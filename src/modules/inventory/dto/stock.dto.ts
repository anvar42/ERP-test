import { IsString, IsNumber, IsArray, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StockOperationDto {
  @IsString()
  product_id: string;

  @IsString()
  warehouse_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serial_numbers?: string[];

  @IsOptional()
  @IsString()
  lot_code?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiration_date?: Date;
}
