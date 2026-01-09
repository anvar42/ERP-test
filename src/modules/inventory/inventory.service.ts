import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { ProductService } from '../product/product.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ProductTrackingType } from 'src/common';
import { StockOperationDto } from './dto/stock.dto';
import { Inventory, InventoryDocument } from './schemas';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectConnection() private connection: Connection,
    private productService: ProductService,
  ) {}

  async increaseStock(data: StockOperationDto): Promise<void> {
    const product = await this.productService.getProductById(data.product_id);

    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      switch (product.tracking_type) {
        case ProductTrackingType.SIMPLE:
          await this.increaseSimpleStock(data, session);
          break;

        case ProductTrackingType.SERIALIZED:
          await this.increaseSerializedStock(data, session);
          break;

        case ProductTrackingType.LOT_TRACKED:
          await this.increaseLotStock(data, session);
          break;

        case ProductTrackingType.EXPIRABLE:
          await this.increaseExpirableStock(data, session);
          break;

        default:
          throw new BadRequestException('Invalid tracking type');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async decreaseStock(data: StockOperationDto): Promise<void> {
    const product = await this.productService.getProductById(data.product_id);

    const available = await this.checkAvailability(
      data.product_id,
      data.warehouse_id,
      data.quantity,
    );

    if (!available) {
      throw new BadRequestException('Insufficient stock');
    }

    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      switch (product.tracking_type) {
        case ProductTrackingType.SIMPLE:
          await this.decreaseSimpleStock(data, session);
          break;

        case ProductTrackingType.SERIALIZED:
          await this.decreaseSerializedStock(data, session);
          break;

        case ProductTrackingType.LOT_TRACKED:
          await this.decreaseLotStock(data, session);
          break;

        case ProductTrackingType.EXPIRABLE:
          await this.decreaseExpirableStock(data, session);
          break;

        default:
          throw new BadRequestException('Invalid tracking type');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async checkAvailability(
    product_id: string,
    warehouse_id: string,
    quantity: number,
  ): Promise<boolean> {
    const result = await this.inventoryModel.aggregate([
      {
        $match: {
          product_id: product_id,
          warehouse_id: warehouse_id,
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    return result.length > 0 && result[0].totalQuantity >= quantity;
  }

  async getStock(product_id: string, warehouse_id?: string) {
    const filter: any = { product_id };
    if (warehouse_id) {
      filter.warehouse_id = warehouse_id;
    }

    return this.inventoryModel.find(filter).exec();
  }

  private async increaseSimpleStock(data: StockOperationDto, session: ClientSession) {
    await this.inventoryModel.findOneAndUpdate(
      { product_id: data.product_id, warehouse_id: data.warehouse_id },
      { $inc: { quantity: data.quantity } },
      { upsert: true, session },
    );
  }

  private async increaseSerializedStock(data: StockOperationDto, session: ClientSession) {
    if (!data.serial_numbers || data.serial_numbers.length !== data.quantity) {
      throw new BadRequestException('Serial numbers count must match quantity');
    }

    const existing = await this.inventoryModel.findOne({
      serial_numbers: { $in: data.serial_numbers },
    });

    if (existing) {
      throw new BadRequestException('One or more serial numbers already exist');
    }

    await this.inventoryModel.create(
      [
        {
          product_id: data.product_id,
          warehouse_id: data.warehouse_id,
          quantity: data.quantity,
          serial_numbers: data.serial_numbers,
        },
      ],
      { session },
    );
  }

  private async increaseLotStock(data: StockOperationDto, session: ClientSession) {
    if (!data.lot_code) {
      throw new BadRequestException('Lot code is required for lot-tracked products');
    }

    await this.inventoryModel.findOneAndUpdate(
      {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        lot_code: data.lot_code,
      },
      { $inc: { quantity: data.quantity } },
      { upsert: true, session },
    );
  }

  private async increaseExpirableStock(data: StockOperationDto, session: ClientSession) {
    if (!data.expiration_date) {
      throw new BadRequestException('Expiration date is required for expirable products');
    }

    await this.inventoryModel.create(
      [
        {
          product_id: data.product_id,
          warehouse_id: data.warehouse_id,
          quantity: data.quantity,
          expiration_date: data.expiration_date,
        },
      ],
      { session },
    );
  }

  private async decreaseSimpleStock(data: StockOperationDto, session: ClientSession) {
    const result = await this.inventoryModel.findOneAndUpdate(
      {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        quantity: { $gte: data.quantity },
      },
      { $inc: { quantity: -data.quantity } },
      { session },
    );

    if (!result) {
      throw new BadRequestException('Insufficient stock or negative stock prevented');
    }
  }

  private async decreaseSerializedStock(data: StockOperationDto, session: ClientSession) {
    if (!data.serial_numbers || data.serial_numbers.length !== data.quantity) {
      throw new BadRequestException('Serial numbers count must match quantity');
    }

    const result = await this.inventoryModel.findOneAndDelete(
      {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        serial_numbers: { $all: data.serial_numbers },
      },
      { session },
    );

    if (!result) {
      throw new BadRequestException('Serial numbers not found in stock');
    }
  }

  private async decreaseLotStock(data: StockOperationDto, session: ClientSession) {
    if (!data.lot_code) {
      throw new BadRequestException('Lot code is required');
    }

    const result = await this.inventoryModel.findOneAndUpdate(
      {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        lot_code: data.lot_code,
        quantity: { $gte: data.quantity },
      },
      { $inc: { quantity: -data.quantity } },
      { session },
    );

    if (!result) {
      throw new BadRequestException('Insufficient stock in lot');
    }
  }

  private async decreaseExpirableStock(data: StockOperationDto, session: ClientSession) {
    const stock = await this.inventoryModel
      .findOne({
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        quantity: { $gte: data.quantity },
        expiration_date: { $gt: new Date() }, // Not expired
      })
      .sort({ expiration_date: 1 })
      .session(session);

    if (!stock) {
      throw new BadRequestException('No suitable stock found or stock expired');
    }

    await this.inventoryModel.findByIdAndUpdate(
      stock._id,
      { $inc: { quantity: -data.quantity } },
      { session },
    );
  }
}
