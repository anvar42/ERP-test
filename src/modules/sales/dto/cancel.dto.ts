import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelSalesDto {
  @ApiProperty({ example: 'Customer returned items' })
  @IsString()
  cancellation_reason: string;
}
