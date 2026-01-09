import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { ProductModule } from './product/product.module';
import { PurchaseReceiptModule } from './purchese-receipt/purchese-receipt.module';
import { SalesModule } from './sales/sales.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from 'src/infra';
import { ConfigModule } from 'src/config';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ProductModule,
    InventoryModule,
    PurchaseReceiptModule,
    SalesModule,
    DashboardModule,
  ],
})
export class AppModule {}
