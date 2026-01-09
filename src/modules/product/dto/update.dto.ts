import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['sku', 'tracking_type'] as const),
) {}
