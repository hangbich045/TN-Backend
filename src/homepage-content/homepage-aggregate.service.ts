import { Injectable } from '@nestjs/common';
import { HomepageContentService } from './homepage-content.service';
import { HomepageServiceService } from './homepage-service.service';
import { HomepageGalleryService } from './homepage-gallery.service';
import { HomepageSectionService } from './homepage-section.service';

@Injectable()
export class HomepageAggregateService {
  constructor(
    private homepageContentService: HomepageContentService,
    private homepageServiceService: HomepageServiceService,
    private homepageGalleryService: HomepageGalleryService,
    private homepageSectionService: HomepageSectionService,
  ) {}

  async getPublicHomepage() {
    const [content, services, gallery, sections] = await Promise.all([
      this.homepageContentService.getContent(),
      this.homepageServiceService.findAll(true),
      this.homepageGalleryService.findAll(true),
      this.homepageSectionService.getSections(),
    ]);

    return {
      content,
      services,
      gallery,
      sections,
    };
  }
}
