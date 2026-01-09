import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPurchaseReceiptDto {
  // Optional: Add any confirmation-specific fields if needed
}

export class CancelPurchaseReceiptDto {
  @ApiProperty({ example: 'Incorrect items received' })
  @IsString()
  cancellation_reason: string;
}
