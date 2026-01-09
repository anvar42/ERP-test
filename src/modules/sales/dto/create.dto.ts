import { IsString, IsDate, IsArray, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SalesLineDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  product_id: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiPropertyOptional({ example: ['SN003', 'SN004'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serial_numbers?: string[];

  @ApiPropertyOptional({ example: 'LOT-2024-001' })
  @IsOptional()
  @IsString()
  lot_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiration_date?: Date;
}

export class CreateSalesDto {
  @ApiPropertyOptional({ example: 'CUSTOMER-001' })
  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiProperty({ example: 'WAREHOUSE-001' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ example: '2026-01-10' })
  @Type(() => Date)
  @IsDate()
  sale_date: Date;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ type: [SalesLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesLineDto)
  lines: SalesLineDto[];

  @ApiPropertyOptional({ example: 'CASH' })
  @IsOptional()
  @IsString()
  payment_type?: string;

  @ApiPropertyOptional({ example: 'Customer paid in full' })
  @IsOptional()
  @IsString()
  comment?: string;
}
