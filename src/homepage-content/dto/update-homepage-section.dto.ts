import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHomepageSectionDto {
  @IsOptional()
  @IsBoolean()
  showHero?: boolean;

  @IsOptional()
  @IsBoolean()
  showServices?: boolean;

  @IsOptional()
  @IsBoolean()
  showGallery?: boolean;

  @IsOptional()
  @IsBoolean()
  showAbout?: boolean;

  @IsOptional()
  @IsBoolean()
  showContact?: boolean;
}
