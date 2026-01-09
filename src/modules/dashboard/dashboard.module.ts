import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from '../inventory/schemas';
import { Product, ProductSchema } from '../product/schema/product.schema';
import { PurchaseReceipt, PurchaseReceiptSchema } from '../purchese-receipt/schemas';
import { Sales, SalesSchema } from '../sales/schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sales.name, schema: SalesSchema },
      { name: PurchaseReceipt.name, schema: PurchaseReceiptSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}