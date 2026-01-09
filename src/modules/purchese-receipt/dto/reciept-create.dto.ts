import { IsString, IsDate, IsArray, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PurchaseLineDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  product_id: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiPropertyOptional({ example: ['SN001'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serial_numbers?: string[];

  @ApiPropertyOptional({ example: 'LOT-2024-001' })
  @IsOptional()
  @IsString()
  lot_code?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiration_date?: Date;
}

export class CreatePurchaseReceiptDto {
  @ApiProperty({ example: 'SUPPLIER-001' })
  @IsString()
  supplier_id: string;

  @ApiProperty({ example: 'WAREHOUSE-001' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ example: '2026-01-10' })
  @Type(() => Date)
  @IsDate()
  receipt_date: Date;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ type: [PurchaseLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lines: PurchaseLineDto[];

  @ApiPropertyOptional({ example: 'INV-2024-001' })
  @IsOptional()
  @IsString()
  invoice_number?: string;

  @ApiPropertyOptional({ example: 'Rush order' })
  @IsOptional()
  @IsString()
  comment?: string;
}
