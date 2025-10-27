import { BadRequestException, Injectable ,HttpException, HttpStatus, NotFoundException, InternalServerErrorException,} from '@nestjs/common';
import { CreateStockDto } from './dto/create-stock.dto';
import { AssetDetailArray, Stock } from './entities/stocks.entity';
import { ILike, Repository, DataSource, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StockListDto } from './dto/stock-list.dto';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity';
import { AssetDatum } from 'src/assets-data/asset-data/entities/asset-datum.entity';
import { count } from 'console';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { AssetStockSerialsRepository } from './entities/asset_stock_serials.entity'
import {OrganizationVendors} from "src/organizational-profile/entity/organizational-vendors.entity"
import { ItemLicenceType } from './entities/item_licence_type.entity';
import { AssetTransferHistory } from 'src/asset-mapping/entities/asset_transfer_history.entity';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import * as XlsxPopulate from 'xlsx-populate';





@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly dataSource: DataSource,

    @InjectRepository(AssetMappingRepository)
    private readonly assetMappingRepository: Repository<AssetMappingRepository>,

    @InjectRepository(AssetStockSerialsRepository)
    private readonly assetStockSerialsRepository: Repository<AssetStockSerialsRepository>, // Fix here

    @InjectRepository(AssetTransferHistory)
    private readonly AssetTransferHistory: Repository<AssetTransferHistory>, // Fix here

    @InjectRepository(AssetDatum)
    private readonly assetRepository: Repository<AssetDatum>,

    @InjectRepository(OrganizationVendors)
    private readonly vendorRepository: Repository<OrganizationVendors>,

    @InjectRepository(ItemLicenceType)
    private readonly licenceRepo: Repository<ItemLicenceType>,

    @InjectRepository(AssetItem)
    private readonly AssetItem: Repository<AssetItem>,
  ) {}

  async createStocks(createStockDto: CreateStockDto) {
    try {
      // Gets just the value without the entity wrapper
      const assetItem = await this.assetRepository
        .createQueryBuilder('asset')
        .select('asset.asset_item_id')
                .where('asset.asset_id = :asset_id', { asset_id: createStockDto.asset_id })
        .getRawOne();

            console.log("asset_item_id", assetItem);

            if (!assetItem || assetItem.asset_asset_item_id === undefined || assetItem.asset_asset_item_id === null) {
                throw new Error(`Asset item ID not found for asset ${createStockDto.asset_id}`);
      }

            console.log("createStockDto keys:", Object.keys(createStockDto));

      const asset_item_id = assetItem.asset_asset_item_id;
            console.log("Extracted asset_item_id:", asset_item_id);

      // Create a new Stock entity instance
            console.log("createStockDto.asset_id :-", createStockDto);

      const newStock = this.stockRepository.create({
        asset_id: createStockDto.asset_id,
        previous_available_quantity: createStockDto.previous_available_quantity,
        total_available_quantity: createStockDto.total_available_quantity,
        description: createStockDto.description,
        vendor_id: createStockDto.vendor_id,
        created_by: createStockDto.created_by,
        updated_by: createStockDto.updated_by,
        is_active: createStockDto.is_active,
        is_deleted: createStockDto.is_deleted,
        asset_ownership_status: createStockDto.asset_ownership_status,
        quantity: createStockDto.quantity,
        license_details: createStockDto.licence,
                assetDetails: createStockDto.assetDetails.map(detail => ({
          serial_number: detail.serial_number,
          system_code: detail.system_code,
          license_key: detail.license_key || null,
        })),
        // ✅ New fields
        warranty_start: createStockDto.warranty_start,
        warranty_end: createStockDto.warranty_end,
        buy_price: createStockDto.buy_price,
        purchase_date: createStockDto.purchase_date,
        invoice_no: createStockDto.invoice_no,
      });

      // Save the new ownership status
      const savedData = await this.stockRepository.save(newStock);

      // Insert into asset_stocks_unique_id for each serial number with system_code
      const assetStocksUniqueIds = createStockDto.assetDetails.map((detail) => {
        // Ensure system_code is always present
        if (!detail.system_code) {
          throw new Error('system_code is required in assetDetails');
        }

        return {
          asset_id: createStockDto.asset_id,
          stock_id: savedData.stock_id,
          asset_item_id: asset_item_id,
          stock_serials: detail.serial_number, // Use system_code if serial_number is null
          license_key: detail.license_key || null,
          system_code: detail.system_code,
          stock_asset_relation_id: null,
          // license_detail: createStockDto.licence,
        };
      });
      // Insert each serial number as a separate entry in asset_stocks_unique_id table
      await this.assetStockSerialsRepository.insert(assetStocksUniqueIds);

            console.log("New Stock Data: ", JSON.stringify(savedData, null, 2));

      return {
        message: 'Stock created successfully',
        data: {
          saveData: savedData,
                    assetStocksUniqueIds: assetStocksUniqueIds
                }
      };
    } catch (error) {
      console.error(error);
      throw new Error('Failed to create stock.'); // Throw an error to be handled by the controller
    }
  }

  // async createStocks2(createStockDto: CreateStockDto) {
  //   try {
  //     console.log('createStockDto.asset_id :-', createStockDto);

  //     // ✅ Get asset_item_id using asset_id (new addition)
  //     const assetItem = await this.assetRepository
  //       .createQueryBuilder('asset')
  //       .select('asset.asset_item_id')
  //       .where('asset.asset_id = :asset_id', { asset_id: createStockDto.asset_id })
  //       .getRawOne();

  //     if (!assetItem || assetItem.asset_asset_item_id == null) {
  //       throw new Error(`Asset item ID not found for asset ${createStockDto.asset_id}`);
  //     }

  //     const asset_item_id = assetItem.asset_asset_item_id;

  //     // ✅ Create and save the stock entry
  //     const newStock = this.stockRepository.create({
  //       asset_id: createStockDto.asset_id,
  //       previous_available_quantity: createStockDto.previous_available_quantity,
  //       total_available_quantity: createStockDto.total_available_quantity,
  //       description: createStockDto.description,
  //       vendor_id: createStockDto.vendor_id,
  //       created_by: createStockDto.created_by,
  //       updated_by: createStockDto.updated_by,
  //       is_active: createStockDto.is_active,
  //       is_deleted: createStockDto.is_deleted,
  //       asset_ownership_status: createStockDto.asset_ownership_status,
  //       quantity: createStockDto.quantity,
  //       warranty_start: createStockDto.warranty_start,
  //       warranty_end: createStockDto.warranty_end,
  //       buy_price: createStockDto.buy_price,
  //       purchase_date: createStockDto.purchase_date,
  //       invoice_no: createStockDto.invoice_no,
  //       branch_id: createStockDto.branch_id,
  //       license_details: createStockDto.licence,
  //       assetDetails: createStockDto.assetDetails.map((detail) => ({
  //         serial_number: detail.serial_number,
  //         license_key: detail.license_key,
  //         system_code: detail.system_code,
  //         license_details: detail.license_details,
  //       })),
  //     });

  //     const savedData = await this.stockRepository.save(newStock);

  //     // ✅ Insert into asset_stock_serials
  //     const assetStocksUniqueIds = createStockDto.assetDetails.map((detail) => {
  //       if (!detail.system_code) {
  //         throw new Error('system_code is required in assetDetails');
  //       }

  //       return {
  //         asset_id: createStockDto.asset_id,
  //         stock_id: savedData.stock_id,
  //         asset_item_id: asset_item_id,
  //         stock_serials: detail.serial_number,
  //         license_key: detail.license_key,
  //         license_detail: createStockDto.licence,
  //         system_code: detail.system_code,
  //         stock_asset_relation: null,
  //         generated_serial_number: detail.generated_serial_number || null,
  //       };
  //     });

  //   const uniqueId =   await this.assetStockSerialsRepository.insert(assetStocksUniqueIds);

  //     // Attach asset_stocks_unique_id to each assetDetail
  // const insertedIds = uniqueId.raw.map(r => r.asset_stocks_unique_id);
  //     savedData.assetDetails = savedData.assetDetails.map((detail, index) => ({
  //       ...detail,
  //       asset_stocks_unique_id: insertedIds[index], // assuming same order
  //     }));

  // console.log("assetStocksUniqueIds", assetStocksUniqueIds)
  //     // ✅ Insert into asset_mapping table
  //     const assetMappings = createStockDto.assetDetails.map((detail) => ({
  //       asset_id: createStockDto.asset_id,
  //       branch_id: createStockDto.branch_id ?? null,
  //       department_id: detail.department_id ?? null,
  //       asset_used_by: detail.asset_used_by ?? null,
  //       quantity: 1,
  //       mapping_type: detail.asset_used_by ? 1 : 0, // <-- conditional logic here
  //       status_type_id: detail.status_type_id ?? null,
  //       asset_managed_by: detail.asset_managed_by ?? null,
  //       unique_id: detail.serial_number ?? detail.license_key,
  //       system_code: detail.system_code,
  //       created_by: createStockDto.created_by,
  //     }));
  // console.log("aseet mappings ",assetMappings)
  //     await this.assetMappingRepository.insert(assetMappings);

  //     // After inserting into assetMappingRepository
  //     const transferHistoryEntries = createStockDto.assetDetails
  //       .filter((detail) => detail.asset_used_by) // only when asset is assigned
  //       .map((detail) => ({
  //         asset_id: createStockDto.asset_id,
  //         previous_organization_id: null, // no previous owner in this case
  //         previous_used_by: null,
  //         previous_managed_by: null,
  //         new_organization_id: createStockDto.branch_id, // same as branch_id
  //         used_by: detail.asset_used_by,
  //         managed_by: detail.asset_managed_by ?? null,
  //         system_code: detail.system_code,
  //         transfered_at: new Date(),
  //         updated_at: new Date(),
  //       }));

  //     if (transferHistoryEntries.length) {
  //       await this.AssetTransferHistory.insert(transferHistoryEntries);
  //     }
  // console.log("aseet transfer   History  Entries ",transferHistoryEntries)


  //     console.log('New MAP STOCK Data: ', JSON.stringify(savedData, null, 2));

  //     return {
  //       message: 'Stock created successfully',
  //       data: savedData,
  //       data2: uniqueId,
  //     };
  //   } catch (error) {
  //     console.error(error);
  //     throw new Error('Failed to create stock.');
  //   }
  // }

  // stock.service.ts


  async createStocks2(createStockDto: CreateStockDto) {
  try {
    console.log('createStockDto.asset_id :-', createStockDto);

   // ✅ Extract sent serials and licenses
const serials = createStockDto.assetDetails
  .map((d) => d.serial_number)
  .filter(Boolean);

const licenses = createStockDto.assetDetails
  .map((d) => d.license_key)
  .filter(Boolean);

// ✅ Fetch all duplicates from DB
const duplicates = await this.assetStockSerialsRepository
  .createQueryBuilder('serials')
  .where(serials.length > 0 ? 'serials.stock_serials IN (:...serials)' : '1=0', { serials })
  .orWhere(licenses.length > 0 ? 'serials.license_key IN (:...licenses)' : '1=0', { licenses })
  .getMany();

// ✅ Match only sent ones (ignore other DB copies)
const sentSerialsSet = new Set(serials);
const sentLicensesSet = new Set(licenses);

// ❌ Previous code would push all DB matches, even if repeated
// ✅ Now collect only unique sent values that matched in DB
const duplicateSerials = [
  ...new Set(
    duplicates
      .map((d) => d.stock_serials)
      .filter((serial) => serial && sentSerialsSet.has(serial))
  ),
];

const duplicateLicenses = [
  ...new Set(
    duplicates
      .map((d) => d.license_key)
      .filter((license) => license && sentLicensesSet.has(license))
  ),
];

// ✅ Return only if relevant duplicates exist
if (duplicateSerials.length > 0 || duplicateLicenses.length > 0) {
  return {
    error: true,
    message: 'Duplicate serials or license keys found.',
    duplicates: {
      serials: duplicateSerials,
      licenses: duplicateLicenses,
    },
  };
}


    // ✅ Step 2: Fetch asset_item_id
    const assetItem = await this.assetRepository
      .createQueryBuilder('asset')
      .select('asset.asset_item_id')
      .where('asset.asset_id = :asset_id', { asset_id: createStockDto.asset_id })
      .getRawOne();

    if (!assetItem || assetItem.asset_asset_item_id == null) {
      throw new Error(`Asset item ID not found for asset ${createStockDto.asset_id}`);
    }

    const asset_item_id = assetItem.asset_asset_item_id;

    // ✅ Step 3: Save stock
    const newStock = this.stockRepository.create({
      asset_id: createStockDto.asset_id,
      previous_available_quantity: createStockDto.previous_available_quantity,
      total_available_quantity: createStockDto.total_available_quantity,
      description: createStockDto.description,
      vendor_id: createStockDto.vendor_id,
      created_by: createStockDto.created_by,
      updated_by: createStockDto.updated_by,
      is_active: createStockDto.is_active,
      is_deleted: createStockDto.is_deleted,
      asset_ownership_status: createStockDto.asset_ownership_status,
      quantity: createStockDto.quantity,
      warranty_start: createStockDto.warranty_start,
      warranty_end: createStockDto.warranty_end,
      buy_price: createStockDto.buy_price,
      purchase_date: createStockDto.purchase_date,
      invoice_no: createStockDto.invoice_no,
      branch_id: createStockDto.branch_id,
      license_details: createStockDto.licence,
      assetDetails: createStockDto.assetDetails.map((detail) => ({
        serial_number: detail.serial_number,
        license_key: detail.license_key,
        system_code: detail.system_code,
        license_details: detail.license_details,
      })),
    });

    const savedData = await this.stockRepository.save(newStock);

    // ✅ Step 4: Insert into asset_stock_serials
    const assetStocksUniqueIds = createStockDto.assetDetails.map((detail) => {
      if (!detail.system_code) {
        throw new Error('system_code is required in assetDetails');
      }

      return {
        asset_id: createStockDto.asset_id,
        stock_id: savedData.stock_id,
        asset_item_id: asset_item_id,
        stock_serials: detail.serial_number,
        license_key: detail.license_key,
        license_detail: createStockDto.licence,
        system_code: detail.system_code,
        stock_asset_relation: null,
        depreciation_start_date:createStockDto.purchase_date,
        depreciation_end_date :createStockDto.warranty_end,
        buy_price: createStockDto.buy_price,
        generated_serial_number: detail.generated_serial_number || null,
      };
    });

    const uniqueId = await this.assetStockSerialsRepository.insert(assetStocksUniqueIds);

    const insertedIds = uniqueId.raw.map(r => r.asset_stocks_unique_id);
    savedData.assetDetails = savedData.assetDetails.map((detail, index) => ({
      ...detail,
      asset_stocks_unique_id: insertedIds[index],
    }));

    // ✅ Step 5: Insert into asset_mapping table
    const assetMappings = createStockDto.assetDetails.map((detail) => ({
      asset_id: createStockDto.asset_id,
      branch_id: createStockDto.branch_id ?? null,
      department_id: detail.department_id ?? null,
      asset_used_by: detail.asset_used_by ?? null,
      quantity: 1,
      mapping_type: detail.asset_used_by ? 1 : 0,
      status_type_id: detail.status_type_id ?? null,
      asset_managed_by: detail.asset_managed_by ?? null,
      unique_id: detail.serial_number ?? detail.license_key,
      system_code: detail.system_code,
      created_by: createStockDto.created_by,
    }));

    await this.assetMappingRepository.insert(assetMappings);

    // ✅ Step 6: Insert into AssetTransferHistory if assigned
    const transferHistoryEntries = createStockDto.assetDetails
      .filter((detail) => detail.asset_used_by)
      .map((detail) => ({
        asset_id: createStockDto.asset_id,
        previous_organization_id: null,
        previous_used_by: null,
        previous_managed_by: null,
        new_organization_id: createStockDto.branch_id,
        used_by: detail.asset_used_by,
        managed_by: detail.asset_managed_by ?? null,
        system_code: detail.system_code,
        transfered_at: new Date(),
        updated_at: new Date(),
      }));

    if (transferHistoryEntries.length) {
      await this.AssetTransferHistory.insert(transferHistoryEntries);
    }

    console.log('New MAP STOCK Data: ', JSON.stringify(savedData, null, 2));

    return {
      message: 'Stock created successfully',
      data: savedData,
      data2: uniqueId,
    };
  } catch (error) {
    console.error(error);
    if (error instanceof BadRequestException) throw error;
    throw new InternalServerErrorException('Failed to create stock.');
  }
}

async validateSerialOrLicense(
  serial?: string,
  license?: string,
): Promise<{ isDuplicate: boolean }> {
  const query = this.assetStockSerialsRepository
    .createQueryBuilder('serials');

  if (serial) {
    query.orWhere('serials.stock_serials = :serial', { serial });
  }

  if (license) {
    query.orWhere('serials.license_key = :license', { license });
  }

  const duplicate = await query.getOne();
  return { isDuplicate: !!duplicate };
}


  async createStockAndSerials(createStockDto: CreateStockDto) {
    try {
      // 1. Get asset_item_id using asset_id
      const assetItem = await this.assetRepository
        .createQueryBuilder('asset')
        .select('asset.asset_item_id')
      .where('asset.asset_id = :asset_id', { asset_id: createStockDto.asset_id })
        .getRawOne();

      if (!assetItem || assetItem.asset_asset_item_id == null) {
      throw new Error(`Asset item ID not found for asset ${createStockDto.asset_id}`);
      }

      const asset_item_id = assetItem.asset_asset_item_id;

      // 2. Create stock entry
      const newStock = this.stockRepository.create({
        asset_id: createStockDto.asset_id,
        previous_available_quantity: createStockDto.previous_available_quantity,
        total_available_quantity: createStockDto.total_available_quantity,
        description: createStockDto.description,
        vendor_id: createStockDto.vendor_id,
        created_by: createStockDto.created_by,
        updated_by: createStockDto.updated_by,
        is_active: createStockDto.is_active,
        is_deleted: createStockDto.is_deleted,
        asset_ownership_status: createStockDto.asset_ownership_status,
        quantity: createStockDto.quantity,
        warranty_start: createStockDto.warranty_start,
        warranty_end: createStockDto.warranty_end,
        buy_price: createStockDto.buy_price,
        purchase_date: createStockDto.purchase_date,
        invoice_no: createStockDto.invoice_no,
        branch_id: createStockDto.branch_id,
        license_details: createStockDto.licence,
        assetDetails: createStockDto.assetDetails.map((detail) => ({
          serial_number: detail.serial_number,
          license_key: detail.license_key,
          system_code: detail.system_code,
          license_details: detail.license_details,
        })),
      });

      const savedStock = await this.stockRepository.save(newStock);

      // 3. Insert stock_serials
      const serialsToInsert = createStockDto.assetDetails.map((detail) => {
      if (!detail.system_code) throw new Error('Missing system_code in assetDetails');
        return {
          asset_id: createStockDto.asset_id,
          stock_id: savedStock.stock_id,
          asset_item_id: asset_item_id,
          stock_serials: detail.serial_number,
          license_key: detail.license_key,
          license_detail: createStockDto.licence,
          system_code: detail.system_code,
          stock_asset_relation: null,
          generated_serial_number: detail.generated_serial_number || null,
        };
      });

      await this.assetStockSerialsRepository.insert(serialsToInsert);

      return {
        message: 'Stock and asset serials created successfully.',
        data: savedStock,
      };
    } catch (error) {
      console.error('Stock creation failed:', error);
      throw new Error('Stock and serials creation failed.');
    }
  }

  // Get all licence types
  async findAllLicenceType(): Promise<ItemLicenceType[]> {
    return await this.licenceRepo.find();
  }

  async findAllStocks(
    page: number,
    limit: number,
    searchQuery: string,
    customFilters?: Record<string, any>,
    assetId?: number,
  ): Promise<any> {
    try {
      const queryBuilder = this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.asset_info', 'asset')
        .leftJoinAndSelect('stock.vendor_info', 'vendor')
        .leftJoinAndSelect('stock.ownership_information', 'ownership')
        .leftJoinAndSelect('stock.created_user', 'created_user')
        .where('stock.is_active = :isActive', { isActive: 1 })
        .andWhere('stock.is_deleted = :isDeleted', { isDeleted: 0 });

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder.andWhere(
          `(
            LOWER(stock.description) LIKE :search OR 
            LOWER(asset.asset_title) LIKE :search OR 
            LOWER(vendor.vendor_name) LIKE :search OR
            LOWER(created_user.first_name) LIKE :search OR 
            LOWER(created_user.last_name) LIKE :search OR 
            LOWER(CONCAT(COALESCE(created_user.first_name, ''), '', COALESCE(created_user.last_name, ''))) LIKE :search
          )`,
          { search: `%${searchQuery.toLowerCase()}%` }
        );
      }

      if (assetId) {
        queryBuilder.andWhere('stock.asset_id = :assetId', { assetId });
      }

      if (customFilters && Object.keys(customFilters).length > 0) {
        for (const [key, value] of Object.entries(customFilters)) {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            key === 'sortOrder'
          )
            continue;

          if (typeof value === 'object' && value.from && value.to) {
            queryBuilder.andWhere(
              `stock.${key} BETWEEN :from_${key} AND :to_${key}`,
              {
                [`from_${key}`]: value.from,
                [`to_${key}`]: value.to,
              },
            );
          } else {
            queryBuilder.andWhere(`CAST(stock.${key} AS TEXT) ILIKE :${key}`, {
              [key]: `%${value}%`,
            });
          }
        }
      }

      const [results, total] = await queryBuilder
        .orderBy('stock.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      if (!results.length) {
        return {
          data: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          message: 'No stocks found with the specified criteria.',
        };
      }

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        message: 'Stocks fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw new BadRequestException(
        `Error fetching stock list: ${error.message}`,
      );
    }
  }

  async exportFilteredExcelForStocks(data:any[],
    ): Promise<Buffer> {

    // Create Excel file
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name('Stock List');

    const headers = [
      'Sr. No.',
      'Stock Name',
      'Asset Name',
      'Vendor Name',
      'Ownership Status',
      'Created By',
      'Created At',
    ];

    headers.forEach((header, i) => {
      sheet
        .cell(1, i + 1)
        .value(header)
        .style({ bold: true });
    });

    data.forEach((stock, index) => {
      sheet.cell(index + 2, 1).value(index + 1);
      sheet.cell(index + 2, 2).value(stock.stock_serials || '');
      sheet.cell(index + 2, 3).value(stock.asset_info?.asset_title || '');
      sheet.cell(index + 2, 4).value(stock.vendor_info?.vendor_name || '');
      sheet
        .cell(index + 2, 5)
        .value(stock.ownership_information?.ownership_status_type_name || '');
      sheet
        .cell(index + 2, 6)
        .value(
          `${stock.created_user?.first_name} ${stock.created_user?.last_name}` ||
            '',
        );
      sheet
        .cell(index + 2, 7)
        .value(
          stock.created_at
            ? new Date(stock.created_at).toLocaleDateString()
            : '',
        );
    });

    headers.forEach((_, i) => {
      sheet.column(i + 1).width(headers[i].length + 10);
    });

    return await workbook.outputAsync();
  }

  async fetchSingleAssetStockQty(asset_id: any): Promise<any> {
    if (!asset_id) {
      throw new BadRequestException('Asset ID is required');
    }

    try {
    const stock = await this.stockRepository
        .createQueryBuilder('stock')
        .select('stock.total_available_quantity')
        .leftJoinAndSelect('stock.asset_info', 'asset')
        .leftJoinAndSelect('asset.asset_item', 'item')
        .where('stock.asset_id = :asset_id', { asset_id })
        .andWhere('stock.is_active = :is_active', { is_active: 1 })
        .andWhere('stock.is_deleted = :is_deleted', { is_deleted: 0 })
        .orderBy('stock.created_at', 'DESC')
        .getOne();

    if (stock) {
      return {
        status: 200,
        message: 'Qty fetched successfully',
        data: stock,
        refresh: true,
      };
    }

    // Fallback: Get asset directly if stock not found
    const asset = await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.asset_item', 'item')
      .where('asset.asset_id = :asset_id', { asset_id })
      .andWhere('asset.asset_is_active = :isActive', { isActive: 1 })
      .andWhere('asset.asset_is_deleted = :isDeleted', { isDeleted: 0 })
      .getOne();

    if (!asset) {
        return {
          status: 404,
          message: `Asset with ID ${asset_id} not found or inactive`,
          data: null,
        };
      }

    // No stock yet → but valid asset
      return {
        status: 200,
      message: 'No stock found, but asset is valid',
      data: {
        total_available_quantity: 0,
        previous_available_quantity: 0,
        asset_info: asset,
      },
        refresh: true,
      };
    } catch (error) {
      return {
        status: 500,
      message: 'An error occurred while fetching stock or asset info',
        error: error.message,
      };
    }
  }

  ///// code will be deleted later
  async fetchStockListWithUniqueIds(
    page: number,
    limit: number,
    searchQuery: string,
      stock_id: number
  ): Promise<any> {
    if (!stock_id) {
      throw new BadRequestException('Stock ID is required');
    }

    try {
      // Fetch stock details for the given stock_id
      const stockData = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.asset_info', 'asset')
        .leftJoinAndSelect('stock.vendor_info', 'vendor')
        .leftJoinAndSelect('stock.ownership_information', 'ownership')
        .leftJoinAndSelect('stock.created_user', 'createdUser')
        .where('stock.stock_id = :stock_id', { stock_id })
        .andWhere('stock.is_active = :is_active', { is_active: 1 })
        .andWhere('stock.is_deleted = :is_deleted', { is_deleted: 0 });

      if (searchQuery) {
              stockData.andWhere('asset.asset_name ILIKE :search', { search: `%${searchQuery}%` });
      }

      const results = await stockData
        .orderBy('stock.created_at', 'DESC')
        .skip((page - 1) * limit) // Pagination
        .take(limit)
        .getMany();

      if (!results.length) {
        return {
          status: 404,
          message: `No stock found for Stock ID ${stock_id}`,
          data: [],
        };
      }
      ///// unique ids
          const stockIds = results.map(stock => stock.stock_id);

      const serials = await this.assetStockSerialsRepository
        .createQueryBuilder('serials')
        .select([
          'serials.asset_stocks_unique_id',
          'serials.asset_id',
          'serials.stock_id',
          'serials.system_code',
          'serials.asset_item_id',
          'serials.stock_serials',
          'serials.license_key',
          'serials.stock_asset_relation_id',
        ])
        .where('serials.stock_id IN (:...stockIds)', { stockIds })
        .getMany();

      // Map stock IDs to minimal serials
      const stockIdToUniqueIdsMap = stockIds.reduce((acc, id) => {
    acc[id] = serials.filter(serial => serial.stock_id === id);
        return acc;
      }, {});

      // Attach only the required serial object info to each stock
  const stockListWithUniqueIds = results.map(stock => ({
        ...stock,
        unique_ids: stockIdToUniqueIdsMap[stock.stock_id] || [],
      }));

      return {
        status: 200,
        message: 'Stock list fetched successfully',
        data: stockListWithUniqueIds,
        total: results.length,
        currentPage: page,
        totalPages: Math.ceil(results.length / limit),
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching stock list',
        error: error.message,
      };
    }
  }

  async fetchStockListWithUniqueIds2(
    page: number,
    limit: number,
    searchQuery: string,
    asset_id: number,
  ): Promise<any> {
    if (!asset_id) {
      throw new BadRequestException('Asset ID is required');
    }

    try {
      // Fetch stock details for the given asset_id
      const stockData = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.asset_info', 'asset')
        .leftJoinAndSelect('stock.vendor_info', 'vendor')
        .leftJoinAndSelect('stock.ownership_information', 'ownership')
        .leftJoinAndSelect('stock.created_user', 'createdUser')
        .where('stock.asset_id = :asset_id', { asset_id })
        .andWhere('stock.is_active = :is_active', { is_active: 1 })
        .andWhere('stock.is_deleted = :is_deleted', { is_deleted: 0 });

      if (searchQuery) {
        stockData.andWhere('asset.asset_name ILIKE :search', { search: `%${searchQuery}%` });
      }

      const results = await stockData
        .orderBy('stock.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      if (!results.length) {
        return {
          status: 404,
          message: `No stock found for Asset ID ${asset_id}`,
          data: [],
        };
      }

      const stockIds = results.map(stock => stock.stock_id);

      const serials = await this.assetStockSerialsRepository
        .createQueryBuilder('serials')
        .select([
          'serials.asset_stocks_unique_id',
          'serials.asset_id',
          'serials.stock_id',
          'serials.system_code',
          'serials.asset_item_id',
          'serials.stock_serials',
          'serials.license_key',
          'serials.stock_asset_relation_id',
        ])
        .where('serials.stock_id IN (:...stockIds)', { stockIds })
        .getMany();

      // Map stock IDs to serials
      const stockIdToUniqueIdsMap = stockIds.reduce((acc, id) => {
        acc[id] = serials.filter(serial => serial.stock_id === id);
        return acc;
      }, {});

      const stockListWithUniqueIds = results.map(stock => ({
        ...stock,
        unique_ids: stockIdToUniqueIdsMap[stock.stock_id] || [],
      }));

      return {
        status: 200,
        message: 'Stock list fetched successfully',
        data: stockListWithUniqueIds,
        total: results.length,
        currentPage: page,
        totalPages: Math.ceil(results.length / limit),
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching stock list',
        error: error.message,
      };
    }
  }

  async getUserByPublicID(public_user_id: number): Promise<number> {
  const userExists = await this.dataSource.getRepository(User).findOne({ where: { register_user_login_id: public_user_id } });
console.log("public user id in asset", public_user_id)
    if (!userExists) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'Invalid user ID' },
        HttpStatus.BAD_REQUEST,
      );
 }
 else{
      return userExists.user_id;
    }
  }

  async fetchSingleAssetAvailableQty(asset_id: any): Promise<any> {
    if (!asset_id) {
      throw new BadRequestException('Asset ID is required');
    }

    try {
      // [1] First get all serials to build our mapping
      const stockSerials = await this.assetStockSerialsRepository
        .createQueryBuilder('serial')
        .where('serial.asset_id = :asset_id', { asset_id })
        .getMany();

      // Create mapping of serial_number → asset_stocks_unique_id
      // Create mapping of serial_number → asset_stocks_unique_id
      const serialToUniqueIdMap = new Map<string, number>();
          stockSerials.forEach(serial => {
        try {
          // Handle both JSON arrays and plain string cases
          let serialNumbers: string[] = [];

          if (serial.stock_serials.startsWith('[')) {
            // Case 1: JSON array format
                      const items = JSON.parse(serial.stock_serials.replace(/'/g, '"'));
                      serialNumbers = items.map(item => item.serial_number || item);
          } else {
            // Case 2: Plain string format (like "Window-1")
            serialNumbers = [serial.stock_serials];
          }

                  serialNumbers.forEach(serialNumber => {
            if (serialNumber) {
              serialToUniqueIdMap.set(
                String(serialNumber).trim(),
                              serial.asset_stocks_unique_id
              );
                          console.log(`Mapped: ${serialNumber} → ${serial.asset_stocks_unique_id}`);
            }
          });
        } catch (e) {
          console.error('Error processing serial:', {
            id: serial.asset_stocks_unique_id,
            data: serial.stock_serials,
                      error: e.message
          });
        }
      });
          console.log('Final serialToUniqueIdMap:', Array.from(serialToUniqueIdMap.entries()));

      // [2] YOUR EXISTING QUERY (unchanged)
      const statusData = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.vendor_info', 'vendor_info')
        // .addSelect('stock.total_available_quantity', 'stock.assetDetails') // it overwrites the previous one so i comment it
        .where('stock.asset_id = :asset_id', { asset_id })
        .andWhere('stock.is_active = :is_active', { is_active: 1 })
        .andWhere('stock.is_deleted = :is_deleted', { is_deleted: 0 })
        .orderBy('stock.created_at', 'DESC')
        .getMany();

      // [3] YOUR EXISTING MAPPING LOGIC (unchanged)
          let whereConditionMapping: any = { asset_id: asset_id, is_active: 1, is_deleted: 0 };
          console.log(statusData, "statusData");

      const mappingData = await this.assetMappingRepository
              .createQueryBuilder("mapping")
        .where(whereConditionMapping)
              .select("COALESCE(SUM(mapping.quantity), 0)", "assigned_quantity")
        .getRawOne();

          let assigned_quantity = mappingData ? Number(mappingData.assigned_quantity) : 0;

      const assignedIds = await this.assetMappingRepository
              .createQueryBuilder("mapping")
              .select("mapping.unique_id")
        .where(whereConditionMapping)
        .getMany();

          const parseJsonSafely = (data: string | AssetDetailArray[] | null): AssetDetailArray[] => {
        if (!data) return [];
        try {
          if (typeof data === 'string') {
            return JSON.parse(data.replace(/'/g, '"'));
          }
          return data;
        } catch (error) {
                  console.error("Failed to parse JSON:", data, error);
          return [];
        }
      };

      // [4] ONLY MODIFICATION: Add asset_stocks_unique_id during mapping
          const assignedUniqueIds = assignedIds.map(item => parseJsonSafely(item.unique_id))
        .flat()
              .map(id => ({
          ...id,
                  asset_stocks_unique_id: serialToUniqueIdMap.get(id.serial_number) || null
        }));

          const allUniqueIds = statusData.flatMap(item => {
        const parsedAssetDetails = parseJsonSafely(item.assetDetails);
              return parsedAssetDetails.map(asset => ({
          ...asset,
          vendor_name: item.vendor_info?.vendor_name || 'Unknown',
                  asset_stocks_unique_id: serialToUniqueIdMap.get(asset.serial_number) || null
        }));
      });

          const availableUniqueIds = allUniqueIds.filter(id =>
              id && !assignedUniqueIds.some(assigned => assigned.serial_number === id.serial_number)
      );

          const availableSerialNumbers = availableUniqueIds.map(item => item.serial_number).filter(Boolean);
          const assignedSerialNumbers = assignedUniqueIds.map(item => item.serial_number).filter(Boolean);
          const difference = availableSerialNumbers.filter(serial => !assignedSerialNumbers.includes(serial));

      // [5] YOUR EXISTING RESPONSE FORMAT (with added field)
      if (!statusData.length) {
        return {
          status: 404,
          message: `Asset with ID ${asset_id} not found or inactive`,
          data: null,
        };
      }

      console.log(statusData[0]);

      return {
        status: 200,
        message: 'Qty & Unique IDs fetched successfully',
        data: statusData[0].total_available_quantity, //total_available_quantity
        assigned: assigned_quantity,
        available_unique_ids: availableUniqueIds,
        assigned_unique_ids: assignedUniqueIds,
              difference: difference
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the working status',
        error: error.message,
      };
    }
  }
  // async fetchSingleAssetAvailableQty(asset_id: number): Promise<any> {
  //       if (!asset_id) throw new BadRequestException('Asset ID is required');

  //       try {
  //         // [1] Get all stock serials for this asset
  //         const stockSerials = await this.assetStockSerialsRepository.find({
  //           where: { asset_id },
  //         });

  //         // [2] Create mapping: serial_number → asset_stocks_unique_id
  //         const serialToUniqueIdMap = new Map<string, number>();
  //         for (const serial of stockSerials) {
  //           try {
  //             const serialNumbers: string[] = serial.stock_serials.startsWith('[')
  //               ? JSON.parse(serial.asset_stock_serials.replace(/'/g, '"')).map(s => s.serial_number || s)
  //               : [serial.asset_stock_serials];

  //             serialNumbers.forEach(sn => {
  //               if (sn) serialToUniqueIdMap.set(sn.trim(), serial.asset_stocks_unique_id);
  //             });
  //           } catch (err) {
  //             console.error('Serial parse error:', serial.asset_stock_serials, err.message);
  //           }
  //         }

  //         // [3] Get all mapping records with mapping_type = 0
  //         const rawMappings = await this.assetMappingRepository
  //           .createQueryBuilder("mapping")
  //           .select(["mapping.unique_id"])
  //           .where("mapping.asset_id = :asset_id", { asset_id })
  //           .andWhere("mapping.is_active = 1")
  //           .andWhere("mapping.is_deleted = 0")
  //           .andWhere("mapping.mapping_type = 0")
  //           .getMany();

  //         // [4] Parse those unique_ids and attach asset_stocks_unique_id
  //         const parseJsonSafely = (data: any): any[] => {
  //           try {
  //             if (!data) return [];
  //             if (typeof data === 'string') {
  //               return JSON.parse(data.replace(/'/g, '"'));
  //             }
  //             return data;
  //           } catch {
  //             return [];
  //           }
  //         };

  //         const availableUniqueIds = rawMappings
  //         .flatMap(m => parseJsonSafely(m.unique_id))
  //         .map(id => {
  //           const serial = typeof id === 'string' ? id : id.serial_number;
  //           return {
  //             serial_number: serial,
  //             asset_stocks_unique_id: serialToUniqueIdMap.get(serial?.trim()) || null,
  //           };
  //         })
  //         .filter(item => !!item.asset_stocks_unique_id);

  //         return {
  //           status: 200,
  //           message: 'Available serials fetched successfully',
  //           available_unique_ids: availableUniqueIds,
  //           available_serial_numbers: availableUniqueIds.map(i => i.serial_number),
  //           count: availableUniqueIds.length,
  //         };

  //       } catch (err) {
  //         console.error('Error in fetchSingleAssetAvailableQty:', err);
  //         return {
  //           status: 500,
  //           message: 'An error occurred while fetching available unique IDs',
  //           error: err.message,
  //         };
  //       }
  //     }


    async getAllAssetStockSerials(asset_id: number, stock_id: number, page: number, limit: number): Promise<any> {
    if (!asset_id || !stock_id) {
      throw new BadRequestException('Asset ID and Stock ID are required');
    }

    try {
      const [serialsData, total] = await this.assetStockSerialsRepository
        .createQueryBuilder('asset_stock_serials')
        .select([
          'asset_stock_serials.asset_stocks_unique_id',
          'asset_stock_serials.stock_serials',
          'asset_stock_serials.asset_item_id',
          'asset_stock_serials.asset_id',
            'asset_stock_serials.stock_id'


        ])
        .where('asset_stock_serials.asset_id = :asset_id', { asset_id })
        .andWhere('asset_stock_serials.stock_id = :stock_id', { stock_id })
        .orderBy('asset_stock_serials.asset_stocks_unique_id', 'DESC')
        .skip((page - 1) * limit) // Skip items for the current page
        .take(limit) // Limit the number of items per page
        .getManyAndCount();

      if (!serialsData || serialsData.length === 0) {
        return {
          status: 404,
          message: `No serials found for Asset ID ${asset_id} and Stock ID ${stock_id}`,
          data: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      return {
        status: 200,
        message: 'Serials fetched successfully',
        data: serialsData,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the serials',
        error: error.message,
      };
    }
  }

  // s: service to get all asset stock serials info from assets-table asset-mapping-table and stocks-table and asset-stock-serials-table
  async getAllStockInformation(stock_id: number): Promise<any> {
    // if (!stock_id) {
    //     throw new BadRequestException('Stock ID is required');
    // }
    try {
      const stockInfo = await this.stockRepository
        .createQueryBuilder('stock')
        .select([
          'stock.stock_id',
          'stock.asset_id',
          'stock.description',
          'stock.vendor_id',
          'stock.created_by',
          'stock.updated_by',
          'stock.is_active',
          'stock.is_deleted',
          'stock.created_at',
          'stock.asset_ownership_status',
          'stock.warranty_start',
          'stock.warranty_end',
          'stock.buy_price',
          'stock.purchase_date',
          'stock.invoice_no',
          'stock.license_details',
          'stock.assetDetails',
        ])
               .leftJoinAndSelect('stock.asset_info', 'asset_info')
        .leftJoinAndSelect('stock.vendor_info', 'vendor')
        .leftJoinAndSelect('stock.ownershipStatus', 'ownership')

        .where('stock.stock_id = :stock_id', { stock_id })
        .getOne();

      if (!stockInfo) {
        return {
          status: 404,
          message: `Stock with ID ${stock_id} not found`,
          data: null,
        };
      }

      return {
        status: 200,
        message: 'Stock information fetched successfully',
        data: stockInfo,
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the stock information',
        error: error.message,
      };
    }
  }

  // S: get all info of single unique-asset-id from asset_stock_serials-table
    async getSingleAssetStockSerials(asset_stocks_unique_id: number): Promise<any> {

    if (!asset_stocks_unique_id) {
      throw new BadRequestException('Asset Stock Unique ID is required');
    }

    try {
      const serialData = await this.assetStockSerialsRepository
        .createQueryBuilder('asset_stock_serials')
        .leftJoinAndSelect('asset_stock_serials.mapping_data', 'mapping')
        .leftJoinAndSelect('mapping.added_by_user', 'mapped_by_user')
        .leftJoinAndSelect('mapping.department', 'department')
        .leftJoinAndSelect('mapping.map_branch', 'branch')
        .leftJoinAndSelect('mapping.user', 'user')
        .leftJoinAndSelect('mapping.managed_user', 'managed_user')
        //  .leftJoinAndSelect('mapping.mapping_type','mapping_type')
        //  .leftJoinAndSelect('mapping.status_type_id','status')

        // .select([
        //   'asset_stock_serials.asset_stocks_unique_id',
        //   'asset_stock_serials.stock_serials',
        //   'asset_stock_serials.asset_id',
        //   'asset_stock_serials.stock_id',
        //   'asset_stock_serials.system_code',
        //   'asset_stock_serials.license_key',
        //   'asset_stock_serials.system_code',
        //   'asset_stock_serials.license_detail',
        //   'asset_stock_serials.asset_item_id',
        // ])
          .where('asset_stock_serials.asset_stocks_unique_id = :asset_stocks_unique_id', { asset_stocks_unique_id })
        .getOne();

      if (!serialData) {
        return {
          status: 404,
          message: `No serial data found for Asset Stock Unique ID ${asset_stocks_unique_id}`,
          data: null,
        };
      }

      const mappingData = await this.assetMappingRepository
        .createQueryBuilder('mapping')
      .where('mapping.system_code = :system_code', { system_code: serialData.system_code })
        .getOne();

        console.log("SERIAL DATA",serialData)
      return {
        status: 200,
        message: 'Serial data fetched successfully',
        data: serialData,
          mapping: mappingData || null
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the serial data',
        error: error.message,
      };
    }
  }

  async createAssetToAssetMapping(
  assetId: number,
  assetStocksUniqueId: number,
  mappedIds: number[],
): Promise<{ success: boolean; message: string; updatedRecord?: any }> {
  const existingStatus = await this.assetStockSerialsRepository.findOne({
    where: { asset_id: assetId, asset_stocks_unique_id: assetStocksUniqueId },
  });

  if (!existingStatus) {
    throw new HttpException(
      { status: HttpStatus.NOT_FOUND, message: `Stock with ID ${assetStocksUniqueId} not found.` },
      HttpStatus.NOT_FOUND,
    );
  }

  const existingRelations: number[] = Array.isArray(existingStatus.stock_asset_relation_id)
    ? existingStatus.stock_asset_relation_id.map(Number)
    : [];

  const updatedRelationIds = Array.from(new Set([...existingRelations, ...mappedIds]));
  existingStatus.stock_asset_relation_id = updatedRelationIds;

  const updatedStatus = await this.assetStockSerialsRepository.save(existingStatus);

  const parentMapping = await this.assetMappingRepository.findOne({
    where: [
      { asset_id: assetId, system_code: existingStatus.system_code, is_active: 1, is_deleted: 0 },
      ...(existingStatus.stock_serials ? [{
        asset_id: assetId, unique_id: existingStatus.stock_serials, is_active: 1, is_deleted: 0,
      }] : []),
    ],
    order: { created_at: 'DESC' },
  });

  console.log("Parent mapping 1:", parentMapping);

  const isParentAssigned = !!parentMapping?.asset_used_by; // ✅ Check assignment

  if (parentMapping) {
    // ❌ Don't update parent mapping_type
    parentMapping.description = `Parent to asset(s): ${mappedIds.join(', ')}`;
    await this.assetMappingRepository.save(parentMapping);
    console.log("Parent mapping updated:", parentMapping);
  }

  for (const mappedStockId of mappedIds) {
    const mappedStock = await this.assetStockSerialsRepository.findOne({
      where: { asset_stocks_unique_id: mappedStockId },
    });

    if (mappedStock) {
      const reverseRelations: number[] = Array.isArray(mappedStock.stock_asset_relation_id)
        ? mappedStock.stock_asset_relation_id.map(Number)
        : [];

      if (!reverseRelations.includes(assetStocksUniqueId)) {
        reverseRelations.push(assetStocksUniqueId);
        mappedStock.stock_asset_relation_id = reverseRelations;
        await this.assetStockSerialsRepository.save(mappedStock);
      }

      const mappedMapping = await this.assetMappingRepository.findOne({
        where: [
          { asset_id: mappedStock.asset_id, system_code: mappedStock.system_code, is_active: 1, is_deleted: 0 },
          ...(mappedStock.stock_serials ? [{
            asset_id: mappedStock.asset_id, unique_id: mappedStock.stock_serials, is_active: 1, is_deleted: 0,
          }] : []),
        ],
        order: { created_at: 'DESC' },
      });

      if (mappedMapping) {
        // ✅ Update child mapping_type based on parent assignment
        mappedMapping.mapping_type = isParentAssigned ? 1 : 2;

        mappedMapping.description = `Auto-mapped to asset ${assetId}`;
        mappedMapping.asset_used_by = parentMapping?.asset_used_by;
        mappedMapping.asset_managed_by = parentMapping?.asset_managed_by;
        mappedMapping.branch_id = parentMapping?.branch_id;
        mappedMapping.department_id = parentMapping?.department_id;
        mappedMapping.status_type_id = parentMapping?.status_type_id;

        await this.assetMappingRepository.save(mappedMapping);
        console.log("Mapped asset mapping updated:", mappedMapping);
      }
    }
  }

  return {
    success: true,
    message: 'Mapping(s) updated successfully.',
    updatedRecord: updatedStatus,
  };
}

async detachAssetFromAsset(
  assetId: number,
  assetStocksUniqueId: number,
  detachedIds: number[],
): Promise<{ success: boolean; message: string }> {
  const stock = await this.assetStockSerialsRepository.findOne({
    where: { asset_id: assetId, asset_stocks_unique_id: assetStocksUniqueId },
  });

  if (!stock) throw new NotFoundException("Asset stock not found");

  // 1. Remove the relations from parent
  const existing = Array.isArray(stock.stock_asset_relation_id)
    ? stock.stock_asset_relation_id.map(Number)
    : [];

  stock.stock_asset_relation_id = existing.filter(id => !detachedIds.includes(id));
  await this.assetStockSerialsRepository.save(stock);

  // 2. Remove reverse relation & update mapping for detached stocks
  for (const detachedId of detachedIds) {
    const detachedStock = await this.assetStockSerialsRepository.findOne({
      where: { asset_stocks_unique_id: detachedId },
    });

    if (detachedStock) {
      if (Array.isArray(detachedStock.stock_asset_relation_id)) {
        detachedStock.stock_asset_relation_id = detachedStock.stock_asset_relation_id
          .map(Number)
          .filter(id => id !== assetStocksUniqueId);

        await this.assetStockSerialsRepository.save(detachedStock);
      }

      // 3. Find the mapping entry for the detached stock and update fields
      const detachedMapping = await this.assetMappingRepository.findOne({
        where: [
          { asset_id: detachedStock.asset_id, system_code: detachedStock.system_code, is_active: 1, is_deleted: 0 },
          ...(detachedStock.stock_serials ? [{
            asset_id: detachedStock.asset_id,
            unique_id: detachedStock.stock_serials,
            is_active: 1,
            is_deleted: 0,
          }] : []),
        ],
        order: { created_at: 'DESC' },
      });

      if (detachedMapping) {
        detachedMapping.mapping_type = 0;
        detachedMapping.asset_used_by = null;
        detachedMapping.asset_managed_by = null;
        detachedMapping.branch_id = null;
        detachedMapping.department_id = null;
        detachedMapping.status_type_id = null;
        detachedMapping.description = `Unmapped from asset ${assetId}`;

        await this.assetMappingRepository.save(detachedMapping);
      }
    }
  }

  return { success: true, message: "Asset(s) unmapped successfully" };
}



  async getMappingWithNames(assetId: number, assetStocksUniqueId: number) {
    const row = await this.assetStockSerialsRepository
      .createQueryBuilder('asset_stock_serials')
    .where('asset_id = :assetId AND asset_stocks_unique_id = :assetStocksUniqueId', {
          assetId,
          assetStocksUniqueId,
    })
      .getOne();

    if (!row) {
      throw new Error('Row not found');
    }

    // 👇 Handle string or array safely without changing your core logic
    let mappedIds: number[] = [];

    if (Array.isArray(row.stock_asset_relation_id)) {
      mappedIds = row.stock_asset_relation_id;
    } else if (typeof row.stock_asset_relation_id === 'string') {
      try {
        mappedIds = JSON.parse(row.stock_asset_relation_id);
      } catch (err) {
        console.error('Failed to parse stock_asset_relation_id:', err);
        mappedIds = [];
      }
    } else {
      mappedIds = [];
    }

    if (mappedIds.length === 0) {
      return { ...row, resolvedNames: [] };
    }

    const resolvedRows = await this.assetStockSerialsRepository
      .createQueryBuilder('asset_stock_serials')
      .leftJoin('asset_stock_serials.asset_data', 'asset_data') // join assetdatum table
  .where('asset_stock_serials.asset_stocks_unique_id IN (:...ids)', { ids: mappedIds })
      .select([
        'asset_stock_serials.asset_stocks_unique_id',
        'asset_stock_serials.stock_serials',
        'asset_stock_serials.asset_item_id',
        'asset_stock_serials.license_key',
        'asset_stock_serials.system_code',
        'asset_stock_serials.stock_asset_relation_id',
        'asset_stock_serials.license_detail',
        'asset_data.asset_title',
      ])
      .getMany();

    const resolvedNames = resolvedRows.map((r) => ({
      id: r.asset_stocks_unique_id,
      serial_no: r.stock_serials,
      asset_item_id: r.asset_item_id,
      license_key: r.license_key,
      system_code: r.system_code,
      stock_asset_relation_id: r.stock_asset_relation_id,
      license_detail: r.license_detail,
      asset_title: r.asset_data?.asset_title || null,
    }));

    return { ...row, resolvedNames };
  }

  // s: service to get Serial Number-Vendor
  async getAssetSerialsWithVendor(
    asset_id: number,
    stock_id: number,
    page: number,
  limit: number
  ): Promise<any> {
    if (!asset_id || !stock_id) {
      throw new BadRequestException('Asset ID and Stock ID are required');
    }

    try {
      // Step 1: Fetch vendor from stock table
      const stock = await this.stockRepository.findOne({
        where: {
          stock_id,
          asset_id,
        },
        relations: ['vendor_info'], // Make sure your entity uses @ManyToOne(() => VendorEntity, { eager: false }) vendor_info
      });

      const vendorName = stock?.vendor_info?.vendor_name || null;

      // Step 2: Fetch paginated serials
      const [serialsData, total] = await this.assetStockSerialsRepository
        .createQueryBuilder('serial')
        .select([
          'serial.asset_stocks_unique_id',
          'serial.stock_serials',
          'serial.asset_item_id',
          'serial.asset_id',
          'serial.stock_id',
        ])
        .where('serial.asset_id = :asset_id', { asset_id })
        .andWhere('serial.stock_id = :stock_id', { stock_id })
        .orderBy('serial.asset_stocks_unique_id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Step 3: Attach vendor name to each serial
      const enrichedData = serialsData.map((serial) => ({
        ...serial,
        vendor_name: vendorName,
      }));

      return {
        status: 200,
        message: 'Serials with vendor fetched successfully',
        data: enrichedData,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching serials with vendor',
        error: error.message,
      };
    }
  }

  async getSoftwares() {
    // First, get item IDs based on the names
    const items = await this.AssetItem.find({
      where: [
        { asset_item_name: 'Operating Systems' },
        { asset_item_name: 'Application Software' },
        { asset_item_name: 'Contracts' },
      ],
    });

    const nameToIdMap = {};
    for (const item of items) {
      nameToIdMap[item.asset_item_name] = item.asset_item_id;
    }

    const opSystemId = nameToIdMap['Operating Systems'];
    const appId = nameToIdMap['Application Software'];
    const contractId = nameToIdMap['Contracts'];

    const counts = {
      [opSystemId]: 0,
      [appId]: 0,
      [contractId]: 0,
    };

    if (opSystemId) {
      counts[opSystemId] = await this.assetStockSerialsRepository.count({
        where: { asset_item_id: opSystemId },
      });
    }

    if (appId) {
      counts[appId] = await this.assetStockSerialsRepository.count({
        where: { asset_item_id: appId },
      });
    }

    if (contractId) {
      counts[contractId] = await this.assetStockSerialsRepository.count({
        where: { asset_item_id: contractId },
      });
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return {
      op_system: counts[opSystemId] || 0,
      app: counts[appId] || 0,
      contract: counts[contractId] || 0,
      total,
    };
  }
}

     
