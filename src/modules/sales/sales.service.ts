import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentStatus, ProductTrackingType } from 'src/common';
import { InventoryService } from '../inventory/inventory.service';
import { ProductService } from '../product/product.service';
import { CreateSalesDto } from './dto/create.dto';
import { UpdateSalesDto } from './dto/update';
import { Sales, SalesDocument } from './schema';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sales.name) private salesModel: Model<SalesDocument>,
    private inventoryService: InventoryService,
    private productService: ProductService,
  ) {}

  async create(dto: CreateSalesDto, userId: string): Promise<Sales> {
    await this.validateLines(dto.lines, dto.warehouse_id);

    const sale = new this.salesModel({
      ...dto,
      status: DocumentStatus.DRAFT,
      created_by: userId,
    });

    return sale.save();
  }

  async findAll(filters?: any): Promise<Sales[]> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.warehouse_id) {
      query.warehouse_id = filters.warehouse_id;
    }

    if (filters?.customer_id) {
      query.customer_id = filters.customer_id;
    }

    if (filters?.startDate && filters?.endDate) {
      query.sale_date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    return this.salesModel.find(query).populate('lines.product_id').exec();
  }

  async findOne(id: string): Promise<Sales> {
    const sale = await this.salesModel.findById(id).populate('lines.product_id').exec();

    if (!sale) {
      throw new NotFoundException('Sales record not found');
    }

    return sale;
  }

  async update(id: string, dto: UpdateSalesDto): Promise<Sales> {
    const sale = await this.salesModel.findById(id);

    if (!sale) {
      throw new NotFoundException('Sales record not found');
    }

    if (sale.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT sales can be updated');
    }

    if (dto.lines) {
      await this.validateLines(dto.lines, dto.warehouse_id || sale.warehouse_id);
    }

    Object.assign(sale, dto);
    return sale.save();
  }

  async confirm(id: string, userId: string): Promise<Sales> {
    const sale = await this.salesModel.findById(id);

    if (!sale) {
      throw new NotFoundException('Sales record not found');
    }

    if (sale.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT sales can be confirmed');
    }

    await this.validateLines(sale.lines, sale.warehouse_id, true);

    for (const line of sale.lines) {
      await this.inventoryService.decreaseStock({
        product_id: line.product_id,
        warehouse_id: sale.warehouse_id,
        quantity: line.quantity,
        serial_numbers: line.serial_numbers,
        lot_code: line.lot_code,
      });
    }

    sale.status = DocumentStatus.CONFIRMED;
    sale.confirmed_by = userId;
    sale.confirmed_at = new Date();

    return sale.save();
  }

  async cancel(id: string, userId: string, reason: string): Promise<Sales> {
    const sale = await this.salesModel.findById(id);

    if (!sale) {
      throw new NotFoundException('Sales record not found');
    }

    if (sale.status !== DocumentStatus.CONFIRMED) {
      throw new BadRequestException('Only CONFIRMED sales can be cancelled');
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Cancellation reason is required');
    }

    for (const line of sale.lines) {
      await this.inventoryService.increaseStock({
        product_id: line.product_id,
        warehouse_id: sale.warehouse_id,
        quantity: line.quantity,
        serial_numbers: line.serial_numbers,
        lot_code: line.lot_code,
        expiration_date: line.expiration_date,
      });
    }

    sale.status = DocumentStatus.CANCELLED;
    sale.cancelled_by = userId;
    sale.cancelled_at = new Date();
    sale.cancellation_reason = reason;

    return sale.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const sale = await this.salesModel.findById(id);

    if (!sale) {
      throw new NotFoundException('Sales record not found');
    }

    if (sale.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT sales can be deleted');
    }

    await this.salesModel.findByIdAndDelete(id);
    return { message: 'Sales record deleted successfully' };
  }

  private async validateLines(lines: any[], warehouse_id: string, checkStock = false): Promise<void> {
    if (!lines || lines.length === 0) {
      throw new BadRequestException('At least one line is required');
    }

    for (const line of lines) {
      const product = await this.productService.getProductById(line.product_id);

      if (product.is_variant_parent) {
        throw new BadRequestException(
          `Product ${product.name} is a variant parent and cannot be sold directly`,
        );
      }

      if (checkStock) {
        const available = await this.inventoryService.checkAvailability(
          line.product_id,
          warehouse_id,
          line.quantity,
        );

        if (!available) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }
      }

      switch (product.tracking_type) {
        case ProductTrackingType.SERIALIZED:
          if (!line.serial_numbers || line.serial_numbers.length !== line.quantity) {
            throw new BadRequestException(
              `Serial numbers count must match quantity for product ${product.name}`,
            );
          }
          break;

        case ProductTrackingType.LOT_TRACKED:
          if (!line.lot_code) {
            throw new BadRequestException(`Lot code is required for product ${product.name}`);
          }
          break;

        case ProductTrackingType.EXPIRABLE:
          // TODO
          break;
      }

      if (line.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      if (line.unit_price < 0) {
        throw new BadRequestException('Unit price cannot be negative');
      }
    }
  }
}
