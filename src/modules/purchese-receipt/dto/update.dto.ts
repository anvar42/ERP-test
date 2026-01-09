import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseReceiptDto } from './reciept-create.dto';

export class UpdatePurchaseReceiptDto extends PartialType(CreatePurchaseReceiptDto) {}
