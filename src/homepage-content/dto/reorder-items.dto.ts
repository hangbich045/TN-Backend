import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

class ReorderItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
