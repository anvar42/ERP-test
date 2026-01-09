import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { DocumentStatus } from 'src/common';

class SalesLine {
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

export type SalesDocument = Sales & Document;

@Schema({ timestamps: true })
export class Sales {
  @Prop()
  customer_id?: string;

  @Prop({ required: true })
  warehouse_id: string;

  @Prop({ required: true })
  sale_date: Date;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ type: String, enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }], required: true })
  lines: SalesLine[];

  @Prop()
  payment_type?: string;

  @Prop()
  comment?: string;

  // Audit fields
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

export const SalesSchema = SchemaFactory.createForClass(Sales);

SalesSchema.index({ status: 1 });
SalesSchema.index({ sale_date: 1 });
SalesSchema.index({ warehouse_id: 1 });
SalesSchema.index({ customer_id: 1 });
