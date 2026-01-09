import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentStatus, ProductTrackingType } from 'src/common';
import { InventoryService } from '../inventory/inventory.service';
import { ProductService } from '../product/product.service';
import { CreatePurchaseReceiptDto } from './dto/reciept-create.dto';
import { UpdatePurchaseReceiptDto } from './dto/update.dto';
import { PurchaseReceipt, PurchaseReceiptDocument } from './schemas';

@Injectable()
export class PurchaseReceiptService {
  constructor(
    @InjectModel(PurchaseReceipt.name)
    private purchaseReceiptModel: Model<PurchaseReceiptDocument>,
    private inventoryService: InventoryService,
    private productService: ProductService,
  ) {}

  async create(dto: CreatePurchaseReceiptDto, userId: string): Promise<PurchaseReceipt> {
    console.log(dto.lines, "lones");
    
    await this.validateLines(dto.lines);

    const receipt = new this.purchaseReceiptModel({
      ...dto,
      status: DocumentStatus.DRAFT,
      created_by: userId,
    });

    return receipt.save();
  }

  async findAll(filters?: any): Promise<PurchaseReceipt[]> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.warehouse_id) {
      query.warehouse_id = filters.warehouse_id;
    }

    if (filters?.startDate && filters?.endDate) {
      query.receipt_date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    return this.purchaseReceiptModel.find(query).populate('lines.product_id').exec();
  }

  async findOne(id: string): Promise<PurchaseReceipt> {
    const receipt = await this.purchaseReceiptModel
      .findById(id)
      .populate('lines.product_id')
      .exec();

    if (!receipt) {
      throw new NotFoundException('Purchase receipt not found');
    }

    return receipt;
  }

  async update(id: string, dto: UpdatePurchaseReceiptDto): Promise<PurchaseReceipt> {
    const receipt = await this.purchaseReceiptModel.findById(id);

    if (!receipt) {
      throw new NotFoundException('Purchase receipt not found');
    }

    if (receipt.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT receipts can be updated');
    }

    // Validate new lines if provided
    if (dto.lines) {
      await this.validateLines(dto.lines);
    }

    Object.assign(receipt, dto);
    return receipt.save();
  }

  async confirm(id: string, userId: string): Promise<PurchaseReceipt> {
    const receipt = await this.purchaseReceiptModel.findById(id);

    console.log(receipt, "Recipent");

    if (!receipt) {
      throw new NotFoundException('Purchase receipt not found');
    }

    if (receipt.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT receipts can be confirmed');
    }

    await this.validateLines(receipt.lines);

    for (const line of receipt.lines) {
      await this.inventoryService.increaseStock({
        product_id: line.product_id,
        warehouse_id: receipt.warehouse_id,
        quantity: line.quantity,
        serial_numbers: line.serial_numbers,
        lot_code: line.lot_code,
        expiration_date: line.expiration_date,
      });
    }

    receipt.status = DocumentStatus.CONFIRMED;
    receipt.confirmed_by = userId;
    receipt.confirmed_at = new Date();

    return receipt.save();
  }

  async cancel(id: string, userId: string, reason: string): Promise<PurchaseReceipt> {
    const receipt = await this.purchaseReceiptModel.findById(id);

    if (!receipt) {
      throw new NotFoundException('Purchase receipt not found');
    }

    if (receipt.status !== DocumentStatus.CONFIRMED) {
      throw new BadRequestException('Only CONFIRMED receipts can be cancelled');
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Cancellation reason is required');
    }

    for (const line of receipt.lines) {
      await this.inventoryService.decreaseStock({
        product_id: line.product_id,
        warehouse_id: receipt.warehouse_id,
        quantity: line.quantity,
        serial_numbers: line.serial_numbers,
        lot_code: line.lot_code,
      });
    }

    receipt.status = DocumentStatus.CANCELLED;
    receipt.cancelled_by = userId;
    receipt.cancelled_at = new Date();
    receipt.cancellation_reason = reason;

    return receipt.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const receipt = await this.purchaseReceiptModel.findById(id);

    if (!receipt) {
      throw new NotFoundException('Purchase receipt not found');
    }

    if (receipt.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT receipts can be deleted');
    }

    await this.purchaseReceiptModel.findByIdAndDelete(id);
    return { message: 'Purchase receipt deleted successfully' };
  }

  private async validateLines(lines: any[]): Promise<void> {
    if (!lines || lines.length === 0) {
      throw new BadRequestException('At least one line is required');
    }

    for (const line of lines) {
      const product = await this.productService.getProductById(line.product_id);

      if (product.is_variant_parent) {
        throw new BadRequestException(
          `Product ${product.name} is a variant parent and cannot be purchased directly`,
        );
      }

      switch (product.tracking_type) {
        case ProductTrackingType.EXPIRABLE:
          if (!line.expiration_date) {
            throw new BadRequestException(
              `Expiration date is required for product ${product.name}`,
            );
          }
          break;

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
