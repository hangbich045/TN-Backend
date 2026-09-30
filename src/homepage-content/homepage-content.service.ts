import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HomepageContent, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomepageDto } from './dto/update-homepage.dto';
import { DEFAULT_HOMEPAGE_CONTENT } from './homepage-content.defaults';
import {
  isPrismaDateConversionError,
  repairHomepageContentDateFields,
} from './homepage-content.repair';

@Injectable()
export class HomepageContentService implements OnModuleInit {
  private readonly logger = new Logger(HomepageContentService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.repairInvalidRecords();
      const existing = await this.findFirstSafely();
      if (!existing) {
        await this.createDefaultContent();
        this.logger.log('Seeded default HomepageContent on application startup');
      }
    } catch (error) {
      this.logger.error(
        'HomepageContent startup initialization failed; homepage will use runtime fallbacks',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async getContent(): Promise<HomepageContent> {
    try {
      await this.repairInvalidRecords();

      const content = await this.findFirstSafely();
      if (content) {
        return content;
      }

      return await this.createDefaultContent();
    } catch (error) {
      this.logger.error(
        'Failed to load HomepageContent from database',
        error instanceof Error ? error.stack : String(error),
      );
      return this.buildFallbackContent();
    }
  }

  async updateContent(dto: UpdateHomepageDto): Promise<HomepageContent> {
    await this.repairInvalidRecords();

    const existing = await this.findFirstSafely();

    if (existing) {
      return this.prisma.homepageContent.update({
        where: { id: existing.id },
        data: dto,
      });
    }

    return this.prisma.homepageContent.create({
      data: {
        ...DEFAULT_HOMEPAGE_CONTENT,
        ...dto,
      },
    });
  }

  private async repairInvalidRecords(): Promise<void> {
    try {
      await repairHomepageContentDateFields(this.prisma);
    } catch (error) {
      this.logger.error(
        'HomepageContent date-field repair failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async findFirstSafely(): Promise<HomepageContent | null> {
    try {
      return await this.prisma.homepageContent.findFirst();
    } catch (error) {
      if (!isPrismaDateConversionError(error)) {
        throw error;
      }

      this.logger.warn(
        'Detected invalid HomepageContent DateTime values (P2032); running repair and retrying',
      );

      await this.repairInvalidRecords();
      return await this.prisma.homepageContent.findFirst();
    }
  }

  private async createDefaultContent(): Promise<HomepageContent> {
    try {
      return await this.prisma.homepageContent.create({
        data: DEFAULT_HOMEPAGE_CONTENT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.findFirstSafely();
        if (existing) {
          return existing;
        }
      }

      this.logger.error(
        'Failed to create default HomepageContent',
        error instanceof Error ? error.stack : String(error),
      );
      return this.buildFallbackContent();
    }
  }

  private buildFallbackContent(): HomepageContent {
    const now = new Date();

    return {
      id: 'fallback-homepage-content',
      ...DEFAULT_HOMEPAGE_CONTENT,
      heroPosterUrl: DEFAULT_HOMEPAGE_CONTENT.heroPosterUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }
}
