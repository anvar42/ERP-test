import { PartialType } from '@nestjs/swagger';
import { CreateSalesDto } from './create.dto';

export class UpdateSalesDto extends PartialType(CreateSalesDto) {}
