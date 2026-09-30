import { Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const HOMEPAGE_CONTENT_COLLECTION = 'HomepageContent';
const logger = new Logger('HomepageContentRepair');

type PrismaWithRawCommands = Pick<PrismaClient, '$runCommandRaw'>;

function toMongoDate(date: Date): { $date: string } {
  return { $date: date.toISOString() };
}

export function isPrismaDateConversionError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2032'
  );
}

/**
 * Repairs legacy HomepageContent documents that contain null or missing DateTime fields.
 * Uses raw MongoDB commands because Prisma cannot deserialize invalid DateTime values.
 */
export async function repairHomepageContentDateFields(
  prisma: PrismaService | PrismaClient | PrismaWithRawCommands,
  referenceDate: Date = new Date(),
): Promise<number> {
  const mongoDate = toMongoDate(referenceDate);
  let repairedCount = 0;

  const repairOperations: Array<{
    label: string;
    query: Record<string, unknown>;
    fields: Record<string, unknown>;
  }> = [
    {
      label: 'updatedAt',
      query: {
        $or: [{ updatedAt: null }, { updatedAt: { $exists: false } }],
      },
      fields: { updatedAt: mongoDate },
    },
    {
      label: 'createdAt',
      query: {
        $or: [{ createdAt: null }, { createdAt: { $exists: false } }],
      },
      fields: { createdAt: mongoDate },
    },
  ];

  for (const operation of repairOperations) {
    try {
      const result = (await prisma.$runCommandRaw({
        update: HOMEPAGE_CONTENT_COLLECTION,
        updates: [
          {
            q: operation.query,
            u: { $set: operation.fields },
            multi: true,
          },
        ],
      } as Prisma.InputJsonObject)) as { nModified?: number; n?: number };

      const modified = result.nModified ?? result.n ?? 0;
      repairedCount += modified;

      if (modified > 0) {
        logger.warn(
          `Repaired ${modified} HomepageContent record(s): set missing/null ${operation.label}`,
        );
      }
    } catch (error) {
      logger.error(
        `Failed to repair HomepageContent ${operation.label} fields`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  if (repairedCount > 0) {
    logger.log(`HomepageContent date-field repair completed (${repairedCount} field update(s))`);
  }

  return repairedCount;
}
