import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { DocumentStatus } from 'src/common';

class PurchaseLine {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product_id: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unit_price: number;

  @Prop({ type: [String] })
  serial_numbers?: string[];

  @Prop()
  lot_code?: string;

  @Prop()
  expiration_date?: Date;
}

export type PurchaseReceiptDocument = PurchaseReceipt & Document;

@Schema({ timestamps: true })
export class PurchaseReceipt {
  @Prop({ required: true })
  supplier_id: string;

  @Prop({ required: true })
  warehouse_id: string;

  @Prop({ required: true })
  receipt_date: Date;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ type: String, enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }], required: true })
  lines: PurchaseLine[];

  @Prop()
  invoice_number?: string;

  @Prop()
  comment?: string;

  @Prop({ required: true })
  created_by: string;

  @Prop()
  confirmed_by?: string;

  @Prop()
  confirmed_at?: Date;

  @Prop()
  cancelled_by?: string;

  @Prop()
  cancelled_at?: Date;

  @Prop()
  cancellation_reason?: string;
}

export const PurchaseReceiptSchema = SchemaFactory.createForClass(PurchaseReceipt);

// Indexes
PurchaseReceiptSchema.index({ status: 1 });
PurchaseReceiptSchema.index({ receipt_date: 1 });
PurchaseReceiptSchema.index({ warehouse_id: 1 });