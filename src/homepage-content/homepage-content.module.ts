import { Module } from '@nestjs/common';
import { HomepageContentService } from './homepage-content.service';
import { HomepageContentController } from './homepage-content.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { HomepageBootstrapService } from './homepage-bootstrap.service';
import { HomepageServiceService } from './homepage-service.service';
import { HomepageGalleryService } from './homepage-gallery.service';
import { HomepageSectionService } from './homepage-section.service';
import { HomepageAggregateService } from './homepage-aggregate.service';
import { HomepageController } from './homepage.controller';
import { HomepageServiceController } from './homepage-service.controller';
import { HomepageGalleryController } from './homepage-gallery.controller';
import { HomepageSectionController } from './homepage-section.controller';

@Module({
  imports: [CloudinaryModule],
  controllers: [
    HomepageController,
    HomepageContentController,
    HomepageServiceController,
    HomepageGalleryController,
    HomepageSectionController,
  ],
  providers: [
    HomepageContentService,
    HomepageBootstrapService,
    HomepageServiceService,
    HomepageGalleryService,
    HomepageSectionService,
    HomepageAggregateService,
  ],
  exports: [
    HomepageContentService,
    HomepageServiceService,
    HomepageGalleryService,
    HomepageSectionService,
    HomepageAggregateService,
  ],
})
export class HomepageContentModule {}
