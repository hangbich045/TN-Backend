import { Injectable } from '@nestjs/common';
import { HomepageSection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';
import { DEFAULT_HOMEPAGE_SECTION } from './homepage.defaults';

@Injectable()
export class HomepageSectionService {
  constructor(private prisma: PrismaService) {}

  async getSections(): Promise<HomepageSection> {
    const existing = await this.prisma.homepageSection.findFirst();
    if (existing) {
      return existing;
    }

    return this.prisma.homepageSection.create({
      data: DEFAULT_HOMEPAGE_SECTION,
    });
  }

  async updateSections(dto: UpdateHomepageSectionDto): Promise<HomepageSection> {
    const existing = await this.getSections();

    return this.prisma.homepageSection.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}
