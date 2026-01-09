import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardFiltersDto } from './dto/filter.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('sales-summary')
  @ApiOperation({ summary: 'Get sales summary (total amount, count, average)' })
  @ApiResponse({ status: 200, description: 'Sales summary retrieved successfully' })
  getSalesSummary(@Query() filters: DashboardFiltersDto) {
    return this.dashboardService.getSalesSummary(filters);
  }

  @Get('daily-sales')
  @ApiOperation({ summary: 'Get daily sales chart data' })
  @ApiResponse({ status: 200, description: 'Daily sales data retrieved successfully' })
  getDailySalesChart(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.dashboardService.getDailySalesChart(startDate, endDate);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({ status: 200, description: 'Top products retrieved successfully' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.dashboardService.getTopProducts(limit ? +limit : 10);
  }

  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get inventory summary (total SKUs, stock levels, low stock)' })
  @ApiResponse({ status: 200, description: 'Inventory summary retrieved successfully' })
  getInventorySummary() {
    return this.dashboardService.getInventorySummary();
  }

  @Get('purchase-summary')
  @ApiOperation({ summary: 'Get purchase summary (total received, top purchased products)' })
  @ApiResponse({ status: 200, description: 'Purchase summary retrieved successfully' })
  getPurchaseSummary(@Query() filters: DashboardFiltersDto) {
    return this.dashboardService.getPurchaseSummary(filters);
  }
}
