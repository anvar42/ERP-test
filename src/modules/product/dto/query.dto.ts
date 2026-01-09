import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTrackingType } from 'src/common';

export class QueryProductDto {
  @ApiPropertyOptional({ enum: ProductTrackingType })
  @IsOptional()
  @IsEnum(ProductTrackingType)
  tracking_type?: ProductTrackingType;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;
}
