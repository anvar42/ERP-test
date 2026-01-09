import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { ProductModule } from '../product/product.module';
import { Inventory, InventorySchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }]),
    ProductModule,
  ],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}