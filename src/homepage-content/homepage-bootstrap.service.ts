import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_HOMEPAGE_GALLERY,
  DEFAULT_HOMEPAGE_SECTION,
  DEFAULT_HOMEPAGE_SERVICES,
} from './homepage.defaults';
import { HomepageContentService } from './homepage-content.service';

@Injectable()
export class HomepageBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(HomepageBootstrapService.name);

  constructor(
    private prisma: PrismaService,
    private homepageContentService: HomepageContentService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.homepageContentService.getContent();

      const serviceCount = await this.prisma.homepageService.count();
      if (serviceCount === 0) {
        await this.prisma.homepageService.createMany({
          data: DEFAULT_HOMEPAGE_SERVICES,
        });
        this.logger.log(`Seeded ${DEFAULT_HOMEPAGE_SERVICES.length} default homepage services`);
      }

      const galleryCount = await this.prisma.homepageGallery.count();
      if (galleryCount === 0) {
        await this.prisma.homepageGallery.createMany({
          data: DEFAULT_HOMEPAGE_GALLERY,
        });
        this.logger.log(`Seeded ${DEFAULT_HOMEPAGE_GALLERY.length} default homepage gallery items`);
      }

      const section = await this.prisma.homepageSection.findFirst();
      if (!section) {
        await this.prisma.homepageSection.create({
          data: DEFAULT_HOMEPAGE_SECTION,
        });
        this.logger.log('Seeded default homepage section visibility settings');
      }
    } catch (error) {
      this.logger.error(
        'Homepage bootstrap seeding failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
