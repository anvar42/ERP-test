import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CancelSalesDto } from './dto/cancel.dto';
import { CreateSalesDto } from './dto/create.dto';
import { UpdateSalesDto } from './dto/update';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Post()
  @ApiOperation({ summary: 'Create sale (DRAFT)' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  create(@Body() dto: CreateSalesDto) {
    const userId = 'system';
    return this.salesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get allsales' })
  findAll(@Query() filters: any) {
    return this.salesService.findAll(filters);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update sale (DRAFT only)' })
  update(@Param('id') id: string, @Body() dto: UpdateSalesDto) {
    return this.salesService.update(id, dto);
  }
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm sale (decreases stock)' })
  @ApiResponse({ status: 200, description: 'Sale confirmed, stock decreased' })
  confirm(@Param('id') id: string) {
    const userId = 'system'; // TODO
    return this.salesService.confirm(id, userId);
  }
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel confirmed sale (restores stock)' })
  @ApiResponse({ status: 200, description: 'Sale cancelled, stock restored' })
  cancel(@Param('id') id: string, @Body() dto: CancelSalesDto) {
    const userId = 'system'; // TODO
    return this.salesService.cancel(id, userId, dto.cancellation_reason);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete sale (DRAFT only)' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}