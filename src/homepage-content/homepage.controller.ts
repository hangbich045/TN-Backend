import { Controller, Get } from '@nestjs/common';
import { HomepageAggregateService } from './homepage-aggregate.service';

@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageAggregateService: HomepageAggregateService) {}

  @Get()
  getHomepage() {
    return this.homepageAggregateService.getPublicHomepage();
  }
}
