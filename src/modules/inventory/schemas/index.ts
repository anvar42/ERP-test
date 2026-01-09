import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product_id: string;

  @Prop({ required: true })
  warehouse_id: string;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ type: [String] })
  serial_numbers?: string[];

  @Prop()
  lot_code?: string;

  @Prop()
  expiration_date?: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

InventorySchema.index({ product_id: 1, warehouse_id: 1 });
InventorySchema.index({ serial_numbers: 1 });
InventorySchema.index({ lot_code: 1 });
InventorySchema.index({ expiration_date: 1 });