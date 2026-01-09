import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentStatus } from 'src/common';
import { Inventory, InventoryDocument } from '../inventory/schemas';
import { Product, ProductDocument } from '../product/schema/product.schema';
import { PurchaseReceipt, PurchaseReceiptDocument } from '../purchese-receipt/schemas';
import { Sales, SalesDocument } from '../sales/schema';
import { DashboardFiltersDto } from './dto/filter.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Sales.name) private salesModel: Model<SalesDocument>,
    @InjectModel(PurchaseReceipt.name) private purchaseModel: Model<PurchaseReceiptDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
  ) {}

  async getSalesSummary(filters: DashboardFiltersDto) {
    const matchStage: any = { status: DocumentStatus.CONFIRMED };

    if (filters.startDate && filters.endDate) {
      matchStage.sale_date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    if (filters.warehouse_id) {
      matchStage.warehouse_id = filters.warehouse_id;
    }

    if (filters.currency) {
      matchStage.currency = filters.currency;
    }

    const result = await this.salesModel.aggregate([
      { $match: matchStage },
      { $unwind: '$lines' },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: { $multiply: ['$lines.quantity', '$lines.unit_price'] },
          },
          salesCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          salesCount: 1,
          averageSaleValue: {
            $cond: [
              { $eq: ['$salesCount', 0] },
              0,
              { $divide: ['$totalAmount', '$salesCount'] },
            ],
          },
        },
      },
    ]);

    return result[0] || { totalAmount: 0, salesCount: 0, averageSaleValue: 0 };
  }

  async getDailySalesChart(startDate: string, endDate: string) {
    const result = await this.salesModel.aggregate([
      {
        $match: {
          status: DocumentStatus.CONFIRMED,
          sale_date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      { $unwind: '$lines' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$sale_date' },
          },
          totalAmount: {
            $sum: { $multiply: ['$lines.quantity', '$lines.unit_price'] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalAmount: 1,
          count: 1,
        },
      },
    ]);

    return result;
  }

  async getTopProducts(limit: number = 10) {
    const result = await this.salesModel.aggregate([
      { $match: { status: DocumentStatus.CONFIRMED } },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.product_id',
          totalQuantity: { $sum: '$lines.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$lines.quantity', '$lines.unit_price'] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          product_name: '$product.name',
          product_sku: '$product.sku',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return result;
  }

  async getInventorySummary() {
    const totalSKUs = await this.productModel.countDocuments({
      deleted_at: null,
      is_active: true,
    });

    const stockByWarehouse = await this.inventoryModel.aggregate([
      {
        $group: {
          _id: '$warehouse_id',
          totalQuantity: { $sum: '$quantity' },
          uniqueProducts: { $addToSet: '$product_id' },
        },
      },
      {
        $project: {
          _id: 0,
          warehouse_id: '$_id',
          totalQuantity: 1,
          uniqueProductsCount: { $size: '$uniqueProducts' },
        },
      },
    ]);

    const lowStockItems = await this.inventoryModel.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $match: {
          $expr: {
            $and: [
              { $lt: ['$quantity', '$product.min_stock_level'] },
              { $gt: ['$product.min_stock_level', 0] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          product_id: '$product._id',
          product_name: '$product.name',
          product_sku: '$product.sku',
          warehouse_id: 1,
          current_stock: '$quantity',
          min_stock_level: '$product.min_stock_level',
        },
      },
    ]);

    return {
      totalSKUs,
      stockByWarehouse,
      lowStockItems,
    };
  }

  async getPurchaseSummary(filters: DashboardFiltersDto) {
    const matchStage: any = { status: DocumentStatus.CONFIRMED };

    if (filters.startDate && filters.endDate) {
      matchStage.receipt_date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    if (filters.warehouse_id) {
      matchStage.warehouse_id = filters.warehouse_id;
    }

    const totalResult = await this.purchaseModel.aggregate([
      { $match: matchStage },
      { $unwind: '$lines' },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: { $multiply: ['$lines.quantity', '$lines.unit_price'] },
          },
          receiptCount: { $sum: 1 },
        },
      },
    ]);

    const topPurchased = await this.purchaseModel.aggregate([
      { $match: matchStage },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.product_id',
          totalQuantity: { $sum: '$lines.quantity' },
          totalSpent: {
            $sum: { $multiply: ['$lines.quantity', '$lines.unit_price'] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          product_name: '$product.name',
          product_sku: '$product.sku',
          totalQuantity: 1,
          totalSpent: 1,
        },
      },
    ]);

    return {
      ...(totalResult[0] || { totalAmount: 0, receiptCount: 0 }),
      topPurchasedProducts: topPurchased,
    };
  }
}
