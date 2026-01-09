import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductTrackingType, UnitOfMeasure } from 'src/common';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true, enum: UnitOfMeasure })
  unit_of_measure: UnitOfMeasure;

  @Prop({ required: true, enum: ProductTrackingType })
  tracking_type: ProductTrackingType;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  barcode?: string;

  @Prop({ default: 0 })
  min_stock_level: number;

  @Prop()
  sale_price_default?: number;

  @Prop()
  purchase_price_default?: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  variant_attributes?: any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' })
  parent_product_id?: string;

  @Prop({ default: false })
  is_variant_parent: boolean;

  @Prop({ required: true })
  created_by: string;

  @Prop()
  deleted_at?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ sku: 1 });
ProductSchema.index({ tracking_type: 1 });
ProductSchema.index({ is_active: 1 });