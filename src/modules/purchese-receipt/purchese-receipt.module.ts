import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductModule } from '../product/product.module';
import { PurchaseReceiptController } from './reciept.controller';
import { PurchaseReceiptService } from './reciept.service';
import { PurchaseReceipt, PurchaseReceiptSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PurchaseReceipt.name, schema: PurchaseReceiptSchema }]),
    InventoryModule,
    ProductModule,
  ],
  controllers: [PurchaseReceiptController],
  providers: [PurchaseReceiptService],
  exports: [PurchaseReceiptService],
})
export class PurchaseReceiptModule {}