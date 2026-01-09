import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CancelPurchaseReceiptDto } from './dto/confirm.dto';
import { CreatePurchaseReceiptDto } from './dto/reciept-create.dto';
import { UpdatePurchaseReceiptDto } from './dto/update.dto';
import { PurchaseReceiptService } from './reciept.service';

@ApiTags('Purchase Receipts')
@Controller('purchase-receipts')
export class PurchaseReceiptController {
  constructor(private readonly purchaseReceiptService: PurchaseReceiptService) {}

  @Post()
  @ApiOperation({ summary: 'Create purchase receipt (DRAFT)' })
  @ApiResponse({ status: 201, description: 'Receipt created successfully' })
  create(@Body() dto: CreatePurchaseReceiptDto) {
    const userId = 'system'; // TODO
    return this.purchaseReceiptService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase receipts' })
  findAll(@Query() filters: any) {
    return this.purchaseReceiptService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase receipt by ID' })
  findOne(@Param('id') id: string) {
    return this.purchaseReceiptService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase receipt (DRAFT only)' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseReceiptDto) {
    return this.purchaseReceiptService.update(id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm purchase receipt (increases stock)' })
  @ApiResponse({ status: 200, description: 'Receipt confirmed, stock increased' })
  confirm(@Param('id') id: string) {
    const userId = 'system'; // TODO: Get from auth
    return this.purchaseReceiptService.confirm(id, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel confirmed receipt (reverts stock)' })
  @ApiResponse({ status: 200, description: 'Receipt cancelled, stock reverted' })
  cancel(@Param('id') id: string, @Body() dto: CancelPurchaseReceiptDto) {
    const userId = 'system'; // TODO: Get from auth
    return this.purchaseReceiptService.cancel(id, userId, dto.cancellation_reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase receipt (DRAFT only)' })
  remove(@Param('id') id: string) {
    return this.purchaseReceiptService.remove(id);
  }
}
