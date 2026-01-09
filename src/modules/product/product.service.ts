import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductTrackingType } from 'src/common';
import { CreateProductDto } from './dto/create.dto';
import { QueryProductDto } from './dto/query.dto';
import { UpdateProductDto } from './dto/update.dto';
import { Product, ProductDocument } from './schema/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const existingSKU = await this.productModel.findOne({ sku: createProductDto.sku });
    if (existingSKU) {
      throw new BadRequestException('SKU already exists');
    }

    if (createProductDto.tracking_type === ProductTrackingType.VARIANT) {
      if (!createProductDto.variant_attributes) {
        throw new BadRequestException('Variant parent must have variant_attributes');
      }
      createProductDto['is_variant_parent'] = true;
    }

    const product = new this.productModel({
      ...createProductDto,
      created_by: userId,
    });

    return product.save();
  }

  async findAll(query: QueryProductDto): Promise<Product[]> {
    const filter: any = { deleted_at: null };

    if (query.tracking_type) {
      filter.tracking_type = query.tracking_type;
    }

    if (query.is_active !== undefined) {
      filter.is_active = query.is_active;
    }

    return this.productModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id, deleted_at: null }).exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const isUsed = await this.isProductUsed(id);

    if (isUsed) {
      if (updateProductDto['tracking_type']) {
        throw new BadRequestException('Cannot change tracking_type for used product');
      }
      if (updateProductDto['sku']) {
        throw new BadRequestException('Cannot change SKU for used product');
      }
    }

    Object.assign(product, updateProductDto);
    return product.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const isUsed = await this.isProductUsed(id);

    if (isUsed) {
      product.is_active = false;
      await product.save();
      return { message: 'Product marked as inactive' };
    } else {
      product.deleted_at = new Date();
      await product.save();
      return { message: 'Product deleted' };
    }
  }

  private async isProductUsed(productId: string): Promise<boolean> {
    // TODO
    return false;
  }

  async getProductById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}