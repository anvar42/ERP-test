import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitOfMeasure, ProductTrackingType } from 'src/common';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop HP' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  sku: string;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.PIECE })
  @IsEnum(UnitOfMeasure)
  unit_of_measure: UnitOfMeasure;

  @ApiProperty({ enum: ProductTrackingType, example: ProductTrackingType.SERIALIZED })
  @IsEnum(ProductTrackingType)
  tracking_type: ProductTrackingType;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock_level?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sale_price_default?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchase_price_default?: number;

  @IsOptional()
  variant_attributes?: any;

  @IsOptional()
  @IsString()
  parent_product_id?: string;
}
