import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateAssetDatumDto } from './dto/create-asset-datum.dto';
import { UpdateAssetDatumDto } from './dto/update-asset-datum.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Repository, DataSource, DeepPartial } from 'typeorm';
import { AssetDatum } from './entities/asset-datum.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { DatabaseService } from 'src/dynamic-schema/database.service';
import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity';
import { response } from 'express';
import { Stock } from '../stocks/entities/stocks.entity';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service';
import { AssetSubcategoriesService } from '../asset-subcategories/asset-subcategories.service';
import { AssetItemsService } from '../asset-items/asset-items.service';
import * as XlsxPopulate from 'xlsx-populate';

import { OrganizationService } from 'src/organizational-profile/organizational-profile.service';
import { StocksService } from '../stocks/stocks.service';
import { AssetOwnershipStatusService } from '../asset-ownership-status/asset-ownership-status.service';
import { AssetsStatusService } from '../assets-status/assets-status.service';
import { AssetWorkingStatusService } from '../asset-working-status/asset-working-status.service';
import { generateSerialNumber } from 'src/utils/helper';
import { AssetItemsFieldsMappingService } from '../asset-items-fields-mapping/asset-items-fields-mapping.service';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { AssetStockSerialsRepository } from '../stocks/entities/asset_stock_serials.entity';

@Injectable()
export class AssetDataService {
  constructor(
    @InjectRepository(AssetDatum)
    private assetDataRepository: Repository<AssetDatum>,
    // private assetMappingRepository:Repository<AssetMappingRepository>,
    private readonly dataSource: DataSource,
    private readonly databaseService: DatabaseService,

    @InjectRepository(AssetCategory)
    private readonly assetCategoryRepository: Repository<AssetCategory>,

    @InjectRepository(AssetMappingRepository)
    private assetMappingRepository: Repository<AssetMappingRepository>,

    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(AssetStockSerialsRepository)
    private readonly assetStockSerialsRepository: Repository<AssetStockSerialsRepository>,

    private readonly catService: AssetCategoriesService,
    private readonly subCatService: AssetSubcategoriesService,
    private readonly assetOwnershipStatusService: AssetOwnershipStatusService,
    private readonly assetStatusService: AssetsStatusService,
    private readonly assetWorkingStatusService: AssetWorkingStatusService,
    private readonly assetItemsFieldsMappingService: AssetItemsFieldsMappingService,
    private readonly assetItemsService: AssetItemsService,
    private readonly organizationService: OrganizationService,
    private readonly stockService: StocksService,
  ) {}

  /// vk changing this
  async findAll(
    asset_main_category_id: number,
    asset_sub_category_id: number,
    asset_item_id: number,
    page: number,
    limit: number,
    searchQuery: string,
    unused?: boolean,
    customFilters?: Record<string, any>,
  ) {
    try {
      if (typeof customFilters === 'string') {
        try {
          customFilters = JSON.parse(customFilters);
        } catch (e) {
          console.warn('Invalid customFilters JSON:', customFilters);
          customFilters = {};
        }
      }

      console.log('Starting findAll with parameters:', {
        asset_main_category_id,
        asset_sub_category_id,
        asset_item_id,
        page,
        limit,
        searchQuery,
        unused,
        customFilters,
      });

      const FIELD_MAPPINGS = {
        main_category_id: 'asset_main_category_id',
        sub_category_id: 'asset_sub_category_id',
        user_id: 'asset_added_by',
        created_at: 'asset_created_at',
        updated_at: 'asset_updated_at',
      };

      let queryBuilder = this.assetDataRepository
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.main_category', 'main_category')
        .leftJoinAndSelect('asset.sub_category', 'sub_category')
        .leftJoinAndSelect('asset.asset_item', 'item')
        .leftJoinAndSelect(
          'asset.stock',
          'stocks',
          'stocks.stock_id = (SELECT MAX(s.stock_id) FROM stocks s WHERE s.asset_id = asset.asset_id)',
        )
        .leftJoinAndSelect('asset.assigned_quantity', 'assigned_quantity')
        .leftJoinAndSelect('asset.added_by_user', 'added_by_user')
        .where('asset.asset_is_active = :isActive', { isActive: 1 })
        .andWhere('asset.asset_is_deleted = :isDeleted', { isDeleted: 0 });

      // ✅ Safe check for null or undefined before calling .toString()
      if (
        asset_main_category_id !== null &&
        asset_main_category_id !== undefined &&
        asset_main_category_id.toString() !== ''
      ) {
        queryBuilder = queryBuilder.andWhere(
          'asset.asset_main_category_id = :mainCategoryId',
          { mainCategoryId: asset_main_category_id.toString() },
        );

        if (
          asset_sub_category_id !== null &&
          asset_sub_category_id !== undefined &&
          asset_sub_category_id.toString() !== ''
        ) {
          queryBuilder = queryBuilder.andWhere(
            'asset.asset_sub_category_id = :subCategoryId',
            { subCategoryId: asset_sub_category_id.toString() },
          );

          if (
            asset_item_id !== null &&
            asset_item_id !== undefined &&
            asset_item_id.toString() !== ''
          ) {
            queryBuilder = queryBuilder.andWhere(
              'asset.asset_item_id = :itemId',
              { itemId: asset_item_id.toString() },
            );
          }
        }
      }

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder = queryBuilder.andWhere(
          `(
            asset.asset_title ILIKE :search OR
            asset.manufacturer ILIKE :search OR
            asset.model_no ILIKE :search OR
            added_by_user.first_name ILIKE :search OR
            added_by_user.last_name ILIKE :search OR
            item.asset_item_name ILIKE :search OR
            main_category.main_category_name ILIKE :search OR
            sub_category.sub_category_name ILIKE :search
          )`,
          { search: `%${searchQuery}%` },
        );
      }

      if (unused) {
        queryBuilder = queryBuilder.andWhere('asset.asset_used_by IS NULL');
      }

      if (customFilters && Object.keys(customFilters).length > 0) {
        console.log('Processing customFilters:', customFilters);
        for (const [key, value] of Object.entries(customFilters)) {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            key === 'sortOrder'
          )
            continue;

          const dbField = FIELD_MAPPINGS[key] || key;

          if (typeof value === 'object' && (value.from || value.to)) {
            console.log(
              `Applying date range filter for ${dbField} from ${value.from || 'N/A'} to ${value.to || 'N/A'}`,
            );

            const conditions = [];
            const parameters: Record<string, any> = {};

            if (value.from) {
              const fromDate = new Date(value.from).toISOString();
              conditions.push(`asset.${dbField} >= :from_${dbField}`);
              parameters[`from_${dbField}`] = fromDate;
            }

            if (value.to) {
              const toDate = new Date(value.to).toISOString();
              conditions.push(`asset.${dbField} <= :to_${dbField}`);
              parameters[`to_${dbField}`] = toDate;
            }

            if (conditions.length > 0) {
              queryBuilder = queryBuilder.andWhere(
                conditions.join(' AND '),
                parameters,
              );
            }
          } else if (key === 'manufacturer') {
            queryBuilder = queryBuilder.andWhere(
              'asset.manufacturer ILIKE :manufacturer',
              { manufacturer: `%${value}%` },
            );
          } else if (typeof value === 'boolean') {
            queryBuilder = queryBuilder.andWhere(
              `asset.${dbField} = :${dbField}`,
              {
                [dbField]: value,
              },
            );
          } else {
            queryBuilder = queryBuilder.andWhere(
              `asset.${dbField} = :${dbField}`,
              {
                [dbField]: value,
              },
            );
          }
        }
      }

      let sortField = 'asset.asset_id';
      let sortDirection: 'ASC' | 'DESC' = 'DESC';

      if (customFilters?.sortOrder) {
        const sortOrder = customFilters.sortOrder.toLowerCase();
        if (sortOrder === 'desc') {
          sortField = 'asset.asset_title';
          sortDirection = 'DESC';
        } else if (sortOrder === 'asc') {
          sortField = 'asset.asset_title';
          sortDirection = 'ASC';
        } else if (sortOrder === 'newest') {
          sortField = 'asset.asset_created_at';
          sortDirection = 'DESC';
        } else if (sortOrder === 'oldest') {
          sortField = 'asset.asset_created_at';
          sortDirection = 'ASC';
        } else if (sortOrder === 'assetname') {
          sortField = 'asset.asset_title';
          sortDirection = 'ASC';
        } else if (sortOrder === 'assettype') {
          sortField = 'item.item_name';
          sortDirection = 'ASC';
        }
      }

      const [results, total] = await queryBuilder
        .orderBy(sortField, sortDirection)
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      console.log('results', results);
      console.log(queryBuilder.getSql());
      console.log(queryBuilder.getParameters());

      if (!results.length) {
        return {
          data: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          message: 'No assets found with the specified criteria.',
        };
      }

      const decodedResults = results.map((asset) => {
        const itemType = asset.asset_item?.item_type;
        const assigned_quantity = asset.assigned_quantity;
        let total_asset_assigned = 0;

        assigned_quantity.forEach((mapping) => {
          const isDirect = mapping.mapping_type === 1;
          const isVirtual =
            mapping.mapping_type === 2 && itemType === 'Virtual';

          if (isDirect || isVirtual) {
            total_asset_assigned += mapping.quantity;
          }
        });

        return { ...asset, total_asset_assigned };
      });

      return {
        data: decodedResults,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        message: 'Assets fetched successfully',
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async exportFilteredExcelForAssets(data: any[]): Promise<Buffer> {
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name('Assets');

    const headers = [
      'Sr. No.',
      'Asset Title',
      'Manufacturer',
      'Model No.',
      'Total Stock',
      'Assigned Quantity',
      'Available Quantity',
      'Added By',
    ];

    // Apply headers
    headers.forEach((header, colIndex) => {
      sheet
        .cell(1, colIndex + 1)
        .value(header)
        .style({
          bold: true,
          fill: 'CCE5FF',
          horizontalAlignment: 'center',
          border: true,
        });
    });

    // Insert data
    data.forEach((asset, index) => {
      const assignedQty = asset.total_asset_assigned || 0;
      const totalQty = asset.stock?.total_available_quantity || 0;
      const availableQty = totalQty - assignedQty;

      const row = [
        index + 1,
        asset.asset_title || '',
        asset.manufacturer || '',
        asset.model_no || '',
        totalQty,
        assignedQty,
        availableQty,
        asset.added_by_user
          ? `${asset.added_by_user.first_name} ${asset.added_by_user.last_name}`
          : '',
      ];

      row.forEach((value, colIndex) => {
        sheet
          .cell(index + 2, colIndex + 1)
          .value(value)
          .style({ border: true });
      });
    });

    // Auto-size columns
    headers.forEach((_, i) => {
      const col = sheet.column(i + 1);
      col.width(Math.max(15, headers[i].length + 5));
    });

    // Freeze header
    sheet.freezePanes(2, 1);

    return await workbook.outputAsync();
  }

  getFilterableColumns() {
    return [
      {
        key: 'main_category_id',
        label: 'Category',
        type: 'select',
        mandatory: false,
      },
      {
        key: 'sub_category_id',
        label: 'Subcategory',
        type: 'select',
        mandatory: false,
      },

      // {
      //   key: 'manufacturer',
      //   label: 'manufacturer name',
      //   type: 'select',
      //   mandatory: false,
      // },

      {
        key: 'asset_added_by',
        label: 'asset added by',
        type: 'select',
        mandatory: false,
      },

      {
        key: 'created_at',
        label: 'Created At',
        type: 'date-range',
        mandatory: false,
      },
    ];
  }

  async getAllAssets(
    asset_main_category_id: number,
    asset_sub_category_id: number,
    asset_item_id: number,
  ) {
    try {
      let whereCondition: any;
      if (asset_main_category_id.toString() != '') {
        whereCondition = {
          asset_is_active: 1,
          asset_is_deleted: 0,
          asset_main_category_id: asset_main_category_id.toString(),
        };

        if (asset_sub_category_id.toString() != '') {
          whereCondition = {
            asset_is_active: 1,
            asset_is_deleted: 0,
            asset_main_category_id: asset_main_category_id.toString(),
            asset_sub_category_id: asset_sub_category_id.toString(),
          };
          if (asset_item_id.toString() != '') {
            whereCondition = {
              asset_is_active: 1,
              asset_is_deleted: 0,
              asset_main_category_id: asset_main_category_id.toString(),
              asset_sub_category_id: asset_sub_category_id.toString(),
              asset_item_id: asset_item_id.toString(),
            };
          }
        }
      } else {
        whereCondition = { asset_is_active: 1, asset_is_deleted: 0 };
      }

      const result = await this.assetDataRepository
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.main_category', 'main_category')
        .leftJoinAndSelect('asset.sub_category', 'sub_category')
        .leftJoinAndSelect('asset.asset_item', 'item')
        .where(whereCondition)
        .getMany();
      // Limit the number of items per page
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async exportCSVData(
    asset_main_category_id: number,
    asset_sub_category_id: number,
    asset_item_id: number,
    searchQuery: string,
  ) {
    try {
      let whereCondition: any;
      if (asset_main_category_id.toString() != '') {
        whereCondition = {
          asset_is_active: 1,
          asset_is_deleted: 0,
          asset_main_category_id: asset_main_category_id.toString(),
        };

        if (asset_sub_category_id.toString() != '') {
          whereCondition = {
            asset_is_active: 1,
            asset_is_deleted: 0,
            asset_main_category_id: asset_main_category_id.toString(),
            asset_sub_category_id: asset_sub_category_id.toString(),
          };
          if (asset_item_id.toString() != '') {
            whereCondition = {
              asset_is_active: 1,
              asset_is_deleted: 0,
              asset_main_category_id: asset_main_category_id.toString(),
              asset_sub_category_id: asset_sub_category_id.toString(),
              asset_item_id: asset_item_id.toString(),
            };
          }
        }
      } else {
        whereCondition = { asset_is_active: 1, asset_is_deleted: 0 };
      }

      if (searchQuery && searchQuery.trim() !== '') {
        whereCondition['asset_title'] = ILike(`%${searchQuery}%`); // Filter by asset title (or any field you need)
      }

      const [results, total] = await this.assetDataRepository
        .createQueryBuilder('asset')
        // .leftJoinAndSelect('asset.organization', 'organization')
        // .leftJoinAndSelect('asset.department', 'department')
        .leftJoinAndSelect('asset.main_category', 'main_category')
        .leftJoinAndSelect('asset.sub_category', 'sub_category')
        .leftJoinAndSelect('asset.asset_item', 'asset_item')
        .leftJoinAndSelect('asset.assigned_quantity', 'assigned_quantity')
        .leftJoinAndSelect('asset.added_by_user', 'added_by_user')
        .where(whereCondition)
        .orderBy('asset.asset_id', 'DESC')
        .getManyAndCount();

      console.log('RESULT ASSET CSV', results);
      const decodedResults = results.map((asset) => {
        try {
          const assetInformationFields = asset.asset_information_fields
            ? JSON.parse(asset.asset_information_fields)
            : null; // Handle empty or undefined fields gracefully

          const retunArray = {
            ...asset,
            asset_information_fields: assetInformationFields,
            asset_main_category_name:
              asset.main_category?.main_category_name || 'N/A',
            asset_sub_category_name:
              asset.sub_category?.sub_category_name || 'N/A',
            // added_by_user:
            // asset.added_by_user?.added_by_user || 'N/A'
          };

          return retunArray;
        } catch (error) {
          console.error('Error decoding asset_information_fields:', error);
          return asset; // Return original row if decoding fails
        }
      });

      const uniqueAssetFields: any[] = [];

      const uniqueAssetFielIDS: number[] = [];
      decodedResults.forEach((asset) => {
        if (asset.asset_information_fields) {
          const fieldsArr = asset.asset_information_fields;
          if (Array.isArray(fieldsArr)) {
            fieldsArr.forEach((field: any) => {
              if (!uniqueAssetFielIDS.includes(field.asset_field_id)) {
                const fieldA = {
                  label_name: field.asset_field_label_name,
                  asset_field_id: field.asset_field_id,
                  field_name: field.asset_field_name,
                };
                uniqueAssetFields.push(fieldA);
                uniqueAssetFielIDS.push(field.asset_field_id);
              }
            });
            console.log('fieldsArr :- ' + fieldsArr);
          }
        }
      });
      return {
        decodedResults: decodedResults,
        uniqueAssetFields: uniqueAssetFields,
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async countAll() {
    try {
      const totalCount = await this.assetDataRepository.count({
        where: {
          asset_is_active: 1,
          asset_is_deleted: 0,
        },
      });

      const unusedCount = await this.assetDataRepository
        .createQueryBuilder('asset')
        .where('asset.asset_is_active = :active', { active: 1 })
        .andWhere('asset.asset_is_deleted = :deleted', { deleted: 0 })
        .getCount();

      const usedCount = totalCount - unusedCount;
      console.log('counts', totalCount, usedCount);
      return { totalCount, unusedCount, usedCount };
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching asset counts.');
    }
  }

  async findItemByItemCategorySubCategory(
    asset_item_id: number,
    asset_category_id: number,
    asset_subcategory_id: number,
  ) {
    try {
      let whereCondition: any;
      whereCondition = {
        asset_item_id: asset_item_id,
        asset_main_category_id: asset_category_id,
        asset_sub_category_id: asset_subcategory_id,
        asset_is_active: 1,
        asset_is_deleted: 0,
      };
      const results = await this.assetDataRepository
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.used_user', 'used_user')
        .leftJoinAndSelect('asset.organization', 'organization')
        .leftJoinAndSelect('asset.department', 'department')
        .leftJoinAndSelect('asset.managed_user', 'managed_user')
        // .leftJoinAndSelect('asset.main_category', 'main_category')
        // .leftJoinAndSelect('asset.sub_category', 'sub_category')
        // .leftJoinAndSelect('asset.asset_item', 'item')
        .where(whereCondition)
        .orderBy('asset_id', 'DESC')
        .getMany();

      return results;
    } catch (error) {
      console.error('Error in s:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }
  async countByCategory(asset_category_id: number): Promise<number> {
    try {
      return await this.assetDataRepository.countBy({
        asset_main_category_id: asset_category_id,
        asset_is_active: 1,
        asset_is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countByCategory:', error);
      throw new Error('An error occurred while counting assets.');
    }
  }
  async countByCategoryy() {
    try {
      // Fetch all active, non-deleted main categories
      const categories = await this.assetCategoryRepository.find({
        where: { is_active: 1, is_deleted: 0 },
        select: ['main_category_id', 'main_category_name'],
      });

      // Fetch asset counts grouped by category
      const categoryCounts = await this.assetDataRepository
        .createQueryBuilder('asset')
        .select('asset.asset_main_category_id', 'categoryId')
        .addSelect('COUNT(asset.asset_id)', 'assetCount')
        .where('asset.asset_is_active = :active', { active: 1 })
        .andWhere('asset.asset_is_deleted = :deleted', { deleted: 0 })
        .groupBy('asset.asset_main_category_id')
        .getRawMany();

      // Map category counts to category names
      const categoryData = categories.map((category) => {
        const countEntry = categoryCounts.find(
          (c) => c.categoryId === category.main_category_id,
        );
        return {
          categoryId: category.main_category_id,
          categoryName: category.main_category_name,
          assetCount: countEntry ? parseInt(countEntry.assetCount, 10) : 0, // Default to 0 if no assets
        };
      });

      return categoryData;
    } catch (error) {
      console.error('Error in countByCategory:', error);
      throw new Error(
        'An error occurred while fetching category-wise asset counts.',
      );
    }
  }

  async getAssetCategorySubCategoryItemName(asset_item_id: number) {
    try {
      const result = await this.assetDataRepository
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.main_category', 'main_category')
        .leftJoinAndSelect('asset.sub_category', 'sub_category')
        .leftJoinAndSelect('asset.asset_item', 'asset_item')
        .where('asset.asset_item_id = :asset_item_id', { asset_item_id })
        .andWhere('asset.asset_is_active = :active', { active: 1 })
        .andWhere('asset.asset_is_deleted = :deleted', { deleted: 0 })
        .select([
          'main_category.asset_category_name',
          'sub_category.asset_subcategory_name',
          'asset_item.asset_item_name',
        ])
        .getOne();

      return {
        categoryName:
          result?.main_category?.main_category_name || 'Unknown Category',
        subCategoryName:
          result?.sub_category?.sub_category_name || 'Unknown Subcategory',
        itemName: result?.asset_item?.asset_item_name || 'Unknown Item',
      };
    } catch (error) {
      console.error('Error in getAssetCategorySubCategoryItemName:', error);
      throw new Error(
        'An error occurred while fetching category and item names.',
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} assetsDatum`;
  }

  update(id: number, updateAssetDatumDto: UpdateAssetDatumDto) {
    return `This action updates a #${id} assetsDatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} assetsDatum`;
  }

  async getUserByPublicID(public_user_id: number): Promise<number> {
    const userExists = await this.dataSource
      .getRepository(User)
      .findOne({ where: { register_user_login_id: public_user_id } });
    console.log('public user id in asset', public_user_id);
    if (!userExists) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'Invalid user ID' },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return userExists.user_id;
    }
  }

  async addAsset(createAssetDatumDto: CreateAssetDatumDto) {
    try {
      // 1. Check for duplicates
      const existingAsset = await this.assetDataRepository.findOne({
        where: { asset_title: createAssetDatumDto.asset_title },
      });

      if (existingAsset) {
        return {
          status: 'duplicate',
          message: 'Asset with the same name already exists.',
          data: existingAsset,
        };
      }

      // 2. Fetch related category IDs from item
      const item = await this.dataSource.getRepository(AssetItem).findOne({
        where: { asset_item_id: createAssetDatumDto.asset_item_id },
      });

      if (!item) {
        return {
          status: 'error',
          message: 'Asset item not found.',
        };
      }

      // 3. Set parent IDs on DTO
      createAssetDatumDto.asset_main_category_id = item.main_category_id;
      createAssetDatumDto.asset_sub_category_id = item.sub_category_id;

      // 4. Save asset
      const savedItem =
        await this.assetDataRepository.save(createAssetDatumDto);

      return {
        status: 'success',
        message: 'Asset added successfully.',
        data: savedItem,
      };
    } catch (error) {
      console.error('Error in insert:', error);
      return {
        status: 'error',
        message: 'An error occurred while inserting the asset.',
      };
    }
  }

  async updateAssetInfo(updateAssetDatumDto: UpdateAssetDatumDto) {
    try {
      const { asset_id, ...updateData } = updateAssetDatumDto;

      // Ensure that the asset_id exists
      if (!asset_id) {
        throw new Error('Asset ID is required for updating.');
      }

      // Find the existing asset data by its asset_id
      const existingAsset = await this.assetDataRepository.findOneBy({
        asset_id: asset_id,
      });

      // If the asset does not exist, throw an error
      if (!existingAsset) {
        throw new Error('Asset not found for updating.');
      }

      // Merge the update data with the existing asset data
      Object.assign(existingAsset, updateData);

      // Save the updated asset data
      const updatedAsset = await this.assetDataRepository.save(existingAsset);

      return updatedAsset;
    } catch (error) {
      console.error('Error in insert:', error);
      throw new Error('An error occurred while inserting the item.');
    }
  }

  // async findSingleAsset(asset_id: number) {
  //   try {
  //     let whereCondition: any;
  //     whereCondition = { asset_id: asset_id };
  //     const results = await this.assetDataRepository
  //       .createQueryBuilder('asset')
  //       .leftJoinAndSelect('asset.main_category', 'main_category')
  //       .leftJoinAndSelect('asset.sub_category', 'sub_category')
  //       .leftJoinAndSelect('asset.asset_item', 'item')
  //       .leftJoinAndSelect(
  //         'asset.related_items',
  //         'related_items',
  //         'related_items.is_active = :related_is_active AND related_items.is_deleted = :related_is_deleted',
  //         { related_is_active: 1, related_is_deleted: 0 },
  //       )
  //       .leftJoinAndSelect('related_items.child_item', 'child_item') // Fetch child asset details
  //       .leftJoinAndSelect('asset.uniques', 'uniques')
  //       //  .leftJoinAndSelect('uniques.mapping_data', 'mapping_data')
  //       .where(whereCondition)
  //       .getOne();

  //     const assetInformationFields = JSON.parse(
  //       results.asset_information_fields,
  //     );

  //     // Reconstruct the results object with decoded asset_information_fields
  //     const decodedResults = {
  //       ...results,
  //       asset_information_fields: assetInformationFields,
  //     };

  //     return decodedResults;
  //   } catch (error) {
  //     console.error('Error in s:', error);
  //     throw new Error('An error occurred while fetching categories.');
  //   }
  // }

  async findSingleAsset(asset_id: number) {
    try {
      let whereCondition: any = { asset_id };

      const result = await this.assetDataRepository
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.main_category', 'main_category')
        .leftJoinAndSelect('asset.sub_category', 'sub_category')
        .leftJoinAndSelect('asset.asset_item', 'item')
        .leftJoinAndSelect(
          'asset.related_items',
          'related_items',
          'related_items.is_active = :related_is_active AND related_items.is_deleted = :related_is_deleted',
          { related_is_active: 1, related_is_deleted: 0 },
        )
        .leftJoinAndSelect('related_items.child_item', 'child_item')
        .leftJoinAndSelect('asset.uniques', 'uniques')
        .leftJoinAndSelect(
          'asset.stock',
          'stocks',
          'stocks.stock_id = (SELECT MAX(s.stock_id) FROM stocks s WHERE s.asset_id = asset.asset_id)',
        )
        .leftJoinAndSelect('asset.assigned_quantity', 'assigned_quantity')
        .where(whereCondition)
        .getOne();

      const asset_information_fields = JSON.parse(
        result.asset_information_fields,
      );

      // ===== Count Calculation Start =====
      const itemType = result.asset_item?.item_type;
      let total_assigned_qty = 0;

      result.assigned_quantity?.forEach((mapping) => {
        const isDirect = mapping.mapping_type === 1;
        const isVirtual = mapping.mapping_type === 2 && itemType === 'Virtual';

        if (isDirect || isVirtual) {
          total_assigned_qty += mapping.quantity;
        }
      });

      const total_stock_qty = result.stock?.total_available_quantity || 0;
      const available_qty = total_stock_qty - total_assigned_qty;

      // ===== Count Calculation End =====

      return {
        ...result,
        asset_information_fields,
        chart_counts: {
          stock: total_stock_qty,
          assigned: total_assigned_qty,
          available: available_qty,
        },
      };
    } catch (error) {
      console.error('Error in findSingleAsset:', error);
      throw new Error('An error occurred while fetching asset.');
    }
  }

  async deleteAsset(createAssetDatumDto: CreateAssetDatumDto) {
    try {
      // Find the asset by its asset_id
      const existingAsset = await this.assetDataRepository.findOneBy({
        asset_id: createAssetDatumDto.asset_id,
      });

      // If the asset does not exist, throw an error
      if (!existingAsset) {
        throw new Error('Asset not found for deleting.');
      }

      // Create a new instance of the AssetsDatum entity
      const newAsset = new AssetDatum();
      newAsset.asset_is_active = 0; // Mark the asset as inactive
      newAsset.asset_is_deleted = 1; // Mark the asset as deleted

      // Merge the update data with the existing asset data
      Object.assign(existingAsset, newAsset);

      // Save the updated asset entity
      const savedAsset = await this.assetDataRepository.save(existingAsset);

      return {
        status: HttpStatus.OK,
        message: `Asset deleted successful`,
      };
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      throw new Error('An error occurred while deleting the asset.');
    }
  }

  async bulkDeleteAssets(assetIds: number[]): Promise<any> {
    try {
      console.log(
        '💡 [START] bulkDeleteAssets called with assetIds:',
        assetIds,
      );

      if (!Array.isArray(assetIds) || assetIds.length === 0) {
        console.warn('⚠️ No asset IDs provided.');
        throw new BadRequestException('No asset IDs provided for deletion.');
      }

      const results: {
        id: number;
        status: string;
        message?: string;
      }[] = [];

      const deletableAssetIds: number[] = [];

      for (const id of assetIds) {
        console.log(`🔍 Checking asset ID: ${id}`);

        const existingAsset = await this.assetDataRepository.findOne({
          where: { asset_id: id },
          relations: ['assigned_quantity', 'asset_item'],
        });

        console.log('existingAsset', existingAsset);

        if (!existingAsset) {
          console.warn(`❌ Asset not found: ID ${id}`);
          results.push({
            id,
            status: 'failed',
            message: 'Asset not found.',
          });
          continue;
        }

        console.log(
          `✅ Asset found: ID ${id}, checking total assigned quantity...`,
        );

        const itemType = existingAsset.asset_item?.item_type;
        const assigned_quantity = existingAsset.assigned_quantity;
        let totalAssigned = 0;

        if (Array.isArray(assigned_quantity)) {
          for (const mapping of assigned_quantity) {
            const isDirect = mapping.mapping_type === 1;
            const isVirtual =
              mapping.mapping_type === 2 && itemType === 'Virtual';

            if (isDirect || isVirtual) {
              const qty = mapping.quantity || 0;
              totalAssigned += qty;
              console.log(`   → Included assigned unit: ${qty}`);
            } else {
              console.log(`   → Ignored mapping_type ${mapping.mapping_type}`);
            }
          }
        }

        if (totalAssigned > 0) {
          console.warn(
            `🚫 Asset ID ${id} has ${totalAssigned} assigned unit(s), skipping.`,
          );
          results.push({
            id,
            status: 'failed',
            message: `Asset has ${totalAssigned} assigned unit(s).`,
          });
          continue;
        }

        console.log(`🆗 Asset ID ${id} is eligible for deletion.`);
        deletableAssetIds.push(id);
        results.push({
          id,
          status: 'success',
          message: 'Asset ready for deletion.',
        });
      }

      // Only soft delete from the assets table
      if (deletableAssetIds.length > 0) {
        console.log('🧹 Soft deleting from "assets" table:', deletableAssetIds);

        const assetRes = await this.assetDataRepository
          .createQueryBuilder()
          .update()
          .set({ asset_is_deleted: 1, asset_is_active: 0 })
          .where('asset_id IN (:...ids)', { ids: deletableAssetIds })
          .execute();

        console.log('✅ Soft delete result (assets):', assetRes);
      } else {
        console.log('ℹ️ No eligible assets found for deletion.');
      }

      const failed = results.filter((r) => r.status === 'failed');
      const success = results.filter((r) => r.status === 'success');

      if (failed.length > 0) {
        console.warn('⚠️ Some deletions failed:', failed);
        throw new BadRequestException({
          success: false,
          message: 'Some assets could not be deleted.',
          details: failed,
        });
      }

      console.log(
        `🎉 Deletion completed. Deleted: ${success.length} asset(s).`,
      );
      return {
        success: true,
        message: `${success.length} asset${success.length > 1 ? 's' : ''} deleted successfully.`,
        details: results,
      };
    } catch (error) {
      console.error('❗ Error in bulkDeleteAssets:', error);
      if (error.response?.details) {
        console.error(
          '🚫 Failed Deletion Details:',
          JSON.stringify(error.response.details, null, 2),
        );
      }
      throw new BadRequestException(
        error.message || 'An error occurred while deleting assets.',
      );
    }
  }

  // Asset Related Data display opertaions APIS here below this commments
  // all operations GET POST operations

  // GET all Asset List
  async getAssetsByAssetId(asset_id: number): Promise<AssetDatum[]> {
    try {
      const assets = await this.assetDataRepository
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.main_category', 'main_category')
        .leftJoinAndSelect('asset.sub_category', 'sub_category')
        .leftJoinAndSelect('asset.asset_item', 'item')
        .leftJoinAndSelect('asset.stock', 'stock')
        .leftJoinAndSelect('asset.assigned_quantity', 'assigned_quantity')
        .where('asset.asset_id = :asset_id', { asset_id })
        .andWhere('asset.asset_is_active = :active', { active: 1 })
        .andWhere('asset.asset_is_deleted = :deleted', { deleted: 0 })
        .orderBy('asset.asset_id', 'DESC')
        .getMany();

      return assets;
    } catch (error) {
      console.error('Error in getAssetsByAssetId:', error);
      throw new Error('An error occurred while fetching assets by asset_id.');
    }
  }

  async generateAssetTemplate(
    categoryId: number,
    subCatgeoryId: number,
    asset_item_id: number,
    licence_id: number,
  ) {
    try {
      const items = await this.assetItemsService.findAll({});
      const selectedItem = items.find(
        (item) => item.asset_item_id === asset_item_id,
      );
      if (!selectedItem) throw new Error('Invalid asset item ID provided');

      const isLicensable = selectedItem.is_licensable === true;

      let selectedLicence: any = null;
      if (isLicensable && licence_id) {
        const licence_type = await this.stockService.findAllLicenceType();
        selectedLicence = licence_type.find((l) => l.licence_id === licence_id);
        // Do not throw if not found — just warn/log
        if (!selectedLicence) {
          console.warn(
            `Licence ID ${licence_id} not found or invalid. Continuing without license details.`,
          );
        }
      }
      console.log('selectedLicence', selectedLicence);

      const dynamicFields =
        await this.assetItemsFieldsMappingService.findItemFields(asset_item_id);
      const dynamicFieldNames: string[] = [];
      for (const key in dynamicFields) {
        const category = dynamicFields[key];
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach(
            (item: { assetFields: { asset_field_name: any } }) => {
              if (item.assetFields?.asset_field_name) {
                dynamicFieldNames.push(item.assetFields.asset_field_name);
              }
            },
          );
        }
      }

      const rawVendors =
        await this.organizationService.getAllorganizationVenders();
      const formattedVendors = rawVendors.data.map(
        (v: { vendor_name: string; vendor_id: any }) => ({
          label: v.vendor_name?.trim(),
          value: v.vendor_id,
        }),
      );

      const branchesResponse =
        await this.organizationService.fetchOrganizationBranches();
      const formattedBranches = branchesResponse.data.map(
        (branch: { branchId: any; branch_name: any }) => ({
          branch_id: branch.branchId,
          branch_name: branch.branch_name?.trim(),
        }),
      );

      const formattedUsers: { label: string; value: number }[] = [];
      for (const branch of formattedBranches) {
        const users = await this.organizationService.fetchAllBranchusers(
          branch.branch_id,
        );
        for (const user of users.data) {
          const fullName =
            `${user.first_name?.trim() || ''} ${user.last_name?.trim() || ''}`.trim();
          formattedUsers.push({ label: fullName, value: user.user_id });
        }
      }

      const status = await this.assetStatusService.findAll();
      const formattedStatus = status.map(
        (s: { status_type_name: string; status_type_id: number }) => ({
          label: s.status_type_name?.trim(),
          value: s.status_type_id,
        }),
      );

      const ownershipStatusRaw =
        await this.assetOwnershipStatusService.getAllAssetOwnershipStatuses();
      const formattedOwnership = ownershipStatusRaw.map(
        (status: {
          ownership_status_type_name: string;
          ownership_status_type_id: number;
        }) => ({
          label: status.ownership_status_type_name?.trim(),
          value: status.ownership_status_type_id,
        }),
      );

      const departmentsRaw =
        await this.organizationService.fetchOrganizationDeparments();
      const formattedDepartments = departmentsRaw.data.map(
        (d: { departmentName: string; departmentId: number }) => ({
          label: d.departmentName?.trim(),
          value: d.departmentId,
        }),
      );

      const workbook = await XlsxPopulate.fromBlankAsync();
      const sheet = workbook.sheet(0).name('Asset Entry');

      sheet
        .cell('A1')
        .value(`Asset Item: ${selectedItem.asset_item_name}`)
        .style({ bold: true, fontSize: 14 });

      if (selectedLicence?.licence_type) {
        sheet
          .cell('A2')
          .value(`License Type: ${selectedLicence.licence_type}`)
          .style({ italic: true, fontSize: 12 });
      }
      const instructions = [
        'Instructions:',
        '1. Start filling data from row 7 onwards. fill important fields which are mendetary',
        '2. For volume licenses (same key for multiple rows), enter the License Key in the first row and copy it down to all related rows manually or using Excel formula like "=A7".',
        '3. If asset is licensable, fill License Key. Otherwise, use Serial No.',
        '4. Do not change the headers in row 6.',
      ];
      instructions.forEach((text, idx) => {
        sheet
          .cell(idx + 3, 1)
          .value(text)
          .style({
            bold: idx === 0,
            fontColor: '0000FF',
          });
      });

      sheet.freezePanes(0, 7);

      const headers = [
        { label: 'Model No./ Title', required: true },
        { label: 'Manufacturer', required: false },
        { label: 'Warranty Start Date', required: false },
        { label: 'Warranty End Date', required: false },
        { label: 'Buy Price', required: false },
        { label: 'Purchase Date', required: false },
        { label: 'Bill No.', required: false },
        { label: 'Vendor', required: false },
        { label: 'Ownership Mode', required: false },
        { label: 'Branch', required: false },
        { label: 'Stock Description', required: false },
        { label: 'Quantity', required: false },
        ...(isLicensable && selectedLicence?.needs_license_key
          ? [{ label: 'License Key', required: false }]
          : [{ label: 'Serial No', required: false }]),
        ...(selectedLicence?.have_plan_type
          ? [
              { label: 'Plan Name', required: false },
              { label: 'Plan Details', required: false },
            ]
          : []),
        { label: 'Department', required: false },
        { label: 'User', required: false },
        { label: 'Manager', required: false },
        ...dynamicFieldNames.map((name) => ({
          label: name,
          required: false,
        })),
      ];

      headers.forEach((item, index) => {
        const label = item.required ? `${item.label} *` : item.label;
        sheet
          .cell(8, index + 1)
          .value(label)
          .style({
            bold: true,
            fontColor: item.required ? 'FF0000' : '000000',
          });
        sheet.column(index + 1).width(25);
      });

      const startRow = 9;
      const endRow = 500;

      for (let startRow = 8; startRow <= endRow; startRow++) {
        const col = (label: string) =>
          headers.findIndex(
            (h) => h.label === label || h.label === `${label} *`,
          ) + 1;

        // // Fill quantity with 1 by default
        // sheet.cell(startRow, col('Quantity')).value(1);

        sheet.cell(startRow, col('Vendor')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedVendors.map((v) => v.label).join(',')}"`,
        });
        sheet.cell(startRow, col('Ownership Mode')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedOwnership.map((o) => o.label).join(',')}"`,
        });
        sheet.cell(startRow, col('Branch')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedBranches.map((b) => b.branch_name).join(',')}"`,
        });
        sheet.cell(startRow, col('Department')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedDepartments.map((d) => d.label).join(',')}"`,
        });
        sheet.cell(startRow, col('User')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedUsers.map((u) => u.label).join(',')}"`,
        });
        sheet.cell(startRow, col('Manager')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedUsers.map((u) => u.label).join(',')}"`,
        });

        sheet.cell(startRow, col('Vendor')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedVendors.map((v) => v.label).join(',')}"`,
          showInputMessage: true,
          promptTitle: 'Select from list',
          prompt: 'Choose a vendor from the dropdown list (optional)',
        });

        sheet.cell(startRow, col('Ownership Mode')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedOwnership.map((o) => o.label).join(',')}"`,
          showInputMessage: true,
          promptTitle: 'Select from list',
          prompt: 'Choose an ownership mode from the dropdown (optional)',
        });

        sheet.cell(startRow, col('Branch')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedBranches.map((b) => b.branch_name).join(',')}"`,
          showInputMessage: true,
          promptTitle: 'Select from list',
          prompt: 'Choose a branch from the dropdown list (optional)',
        });

        sheet.cell(startRow, col('Department')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedDepartments.map((d) => d.label).join(',')}"`,
          showInputMessage: true,
          promptTitle: 'Select from list',
          prompt: 'Choose a department from the dropdown list (optional)',
        });

        sheet.cell(startRow, col('User')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedUsers.map((u) => u.label).join(',')}"`,
          showInputMessage: true,
          promptTitle: 'Select from list',
          prompt: 'Choose a user from the dropdown list (optional)',
        });

        sheet.cell(startRow, col('Manager')).dataValidation({
          type: 'list',
          allowBlank: true,
          formula1: `"${formattedUsers.map((u) => u.label).join(',')}"`,
          showInputMessage: true,
          promptTitle: 'Select from list',
          prompt: 'Choose a manager from the dropdown list (optional)',
        });

        // Warranty Start Date
        sheet
          .cell(startRow, col('Warranty Start Date'))
          .dataValidation({
            type: 'date',
            operator: 'between',
            formula1: 'DATE(YEAR(TODAY())-5,1,1)',
            formula2: 'TODAY()',
            allowBlank: true,
            showInputMessage: true,
            promptTitle: 'Start Date',
            prompt: 'Select a valid start date (past 5 years).',
            errorTitle: 'Invalid Date',
            error: 'Please select a valid start date.',
          })
          .style({ numberFormat: 'yyyy-mm-dd' });

        // Warranty End Date
        sheet
          .cell(startRow, col('Warranty End Date'))
          .dataValidation({
            type: 'date',
            operator: 'greaterThanOrEqual',
            formula1: 'TODAY()',
            allowBlank: true,
            showInputMessage: true,
            promptTitle: 'End Date',
            prompt: 'Select a valid end date (today or future).',
            errorTitle: 'Invalid Date',
            error: 'End date must be today or later.',
          })
          .style({ numberFormat: 'yyyy-mm-dd' });

        // Purchase Date
        sheet
          .cell(startRow, col('Purchase Date'))
          .dataValidation({
            type: 'date',
            operator: 'between',
            formula1: 'DATE(YEAR(TODAY())-5,1,1)',
            formula2: 'TODAY()',
            allowBlank: true,
            showInputMessage: true,
            promptTitle: 'Purchase Date',
            prompt: 'Select a purchase date within the last 5 years.',
            errorTitle: 'Invalid Date',
            error: 'Please select a valid purchase date.',
          })
          .style({ numberFormat: 'yyyy-mm-dd' });
      }

      return workbook.outputAsync();
    } catch (error) {
      console.error('Error generating template:', error);
      throw new Error('Failed to generate Excel template');
    }
  }

  async checkDuplicateSerial(
    serialNumber: string,
  ): Promise<AssetStockSerialsRepository | null> {
    return this.assetStockSerialsRepository.findOne({
      where: {
        stock_serials: serialNumber,
      },
    });
  }

  async checkDuplicateLicense(
    licenseKey: string,
  ): Promise<AssetStockSerialsRepository | null> {
    return this.assetStockSerialsRepository.findOne({
      where: {
        license_key: licenseKey,
      },
    });
  }

  async bulkCreateAssets(dtos: any[], user_id: number) {

    const successItems = [];
    const errorItems = [];
    const duplicateItems = [];

    function formatDateToISO(dateStr: string): string | null {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('-');
      if (!day || !month || !year) return null;
      return `${year}-${month}-${day}`;
    }

    function generateSerialNumber(asset = null) {
      const prefix = asset?.substring(0, 3).toUpperCase() || 'AST';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${randomNum}`;
    }

    const existingVendors =
      await this.organizationService.getAllorganizationVenders();
    const ownershipStatuses =
      await this.assetOwnershipStatusService.getAllAssetOwnershipStatuses();
    const branches = await this.organizationService.fetchOrganizationBranches();
    const licenseTypes = await this.stockService.findAllLicenceType();
    const departments =
      await this.organizationService.fetchOrganizationDeparments();
    const statusTypes = await this.assetStatusService.findAll();
    const items = await this.assetItemsService.findAll({});

    const inUseStatus = statusTypes.find(
      (s) => s.status_type_name.trim().toLowerCase() === 'inuse',
    );

    const formattedItems = items.map((item) => ({
      asset_item_id: item.asset_item_id,
      is_licensable: item.is_licensable,
    }));

    const volumeLicenseKey =
    dtos[0]?.licence_type === 'Volume' ? dtos[0]?.license_key : null;
  

    for (const dto of dtos) {
      try {
        

        const modelNo = dto.model_no?.trim();
        if (!modelNo || !dto.asset_item_id) {
          console.warn('⚠️ Missing required fields');
          errorItems.push({
            ...dto,
            error: 'Missing required fields: model_no or asset_item_id',
          });
          continue;
        }

        const currentItem = formattedItems.find(
          (item) => item.asset_item_id === dto.asset_item_id,
        );
        const isLicensable = currentItem?.is_licensable === true;
        

        const matchedLicenceType = licenseTypes.find(
          (licence) => licence.licence_type === dto.licence_type,
        );
       

        if (matchedLicenceType?.licence_type === 'Subscription') {
          if (!dto.warranty_start_date || !dto.warranty_end_date) {
            
            errorItems.push({
              ...dto,
              error:
                'Subscription license requires warranty_start_date and warranty_end_date',
            });
            continue;
          }
        }

        const existingAsset = await this.assetDataRepository.findOne({
          where: {
            asset_title: modelNo,
            asset_item_id: dto.asset_item_id,
            asset_main_category_id: dto.main_category_id,
            asset_sub_category_id: dto.sub_category_id,
          },
        });

        const dynamicFieldsRaw =
          await this.assetItemsFieldsMappingService.findItemFields(
            dto.asset_item_id,
          );
        const dynamicFields = dynamicFieldsRaw['2']?.items || [];

        const assetInformationFields = dynamicFields.map(
          (field: { assetFields: any }) => {
            const assetField = field.assetFields;
            const key = assetField.asset_field_label_name;
            return {
              asset_field_id: assetField.asset_field_id,
              asset_field_category_id: assetField.asset_field_category_id,
              asset_field_name: assetField.asset_field_name,
              asset_field_label_name: assetField.asset_field_label_name,
              value: dto[key] || '',
            };
          },
        );

        const vendor = existingVendors.data.find(
          (v: { vendor_name: string }) =>
            v.vendor_name?.trim().toLowerCase() ===
            dto.vendor?.trim().toLowerCase(),
        );
        const ownership = ownershipStatuses.find(
          (s) =>
            s.ownership_status_type_name?.trim().toLowerCase() ===
            dto.ownership_mode?.trim().toLowerCase(),
        );
        const branch = branches.data.find(
          (b: { branchName: string }) =>
            b.branchName?.trim().toLowerCase() ===
            dto.branch?.trim().toLowerCase(),
        );
        const branchUsers = branch
          ? (
              await this.organizationService.fetchAllBranchusers(
                branch.branchId,
              )
            )?.data || []
          : [];
        const usedBy = branchUsers.find(
          (u: { first_name: any; last_name: any }) =>
            `${u.first_name} ${u.last_name}`.toLowerCase() ===
            dto.assigned_to?.trim().toLowerCase(),
        );
        const managedBy = branchUsers.find(
          (u: { first_name: any; last_name: any }) =>
            `${u.first_name} ${u.last_name}`.toLowerCase() ===
            dto.manager?.trim().toLowerCase(),
        );
        const dept = departments.data.find(
          (d: { departmentName: string }) =>
            d.departmentName?.trim().toLowerCase() ===
            dto.department?.trim().toLowerCase(),
        );

        let asset_id: number;
        let systemCode: any;

        if (existingAsset) {
          console.log('♻️ Reusing existing asset:', existingAsset.asset_id);
          asset_id = existingAsset.asset_id;
          systemCode = generateSerialNumber(existingAsset.asset_title);
        } else {
          console.log('🆕 Creating new asset');
          const createAssetDTO = {
            asset_id: null,
            asset_main_category_id: dto.main_category_id || null,
            asset_sub_category_id: dto.sub_category_id || null,
            asset_item_id: dto.asset_item_id || null,
            asset_information_fields: JSON.stringify(assetInformationFields),
            asset_description: dto.stock_description || null,
            asset_title: modelNo,
            asset_added_by: user_id,
            asset_is_active: 1,
            asset_is_deleted: 0,
            asset_created_at: new Date(),
            asset_updated_at: new Date(),
            manufacturer: dto.manufacturer || null,
          };
          console.log('createAssetDTO', createAssetDTO);
          const result = await this.addAsset(createAssetDTO);
          asset_id = result.data.asset_id;
          console.log(`asset_id:-${Math.random()}`, asset_id);
          systemCode = generateSerialNumber(result.data.asset_title);
        }
        

        let licenseKey = null;
        let serialNumber = null;

       

        if (isLicensable && matchedLicenceType) {
          if (
            matchedLicenceType.licence_type === 'Volume' &&
            volumeLicenseKey
          ) {
            licenseKey = volumeLicenseKey;
          } else if (matchedLicenceType.needs_license_key) {
            licenseKey = dto.license_key;
          }

         



          if (licenseKey) {
            const existingLicense =
              await this.checkDuplicateLicense(licenseKey);
            if (existingLicense) {
             
              errorItems.push({
                ...dto,
                error: `Duplicate license key: ${licenseKey}`,
              });
              continue;
            }
          }
        } else {
          serialNumber = dto.serial_no || generateSerialNumber(modelNo);
          const existingSerial = await this.checkDuplicateSerial(serialNumber);
          if (existingSerial) {
            console.warn('🚫 Duplicate serial number:', serialNumber);
            errorItems.push({
              ...dto,
              error: `Duplicate serial number: ${serialNumber}`,
            });
            continue;
          }
        }

        const license_details = matchedLicenceType
          ? JSON.stringify({
              ...matchedLicenceType,
              ...(matchedLicenceType.have_plan_type
                ? { plan_name: dto.plan_name, plan_details: dto.plan_details }
                : {}),
            })
          : null;

        const assetDetails = [
          {
            serial_number: isLicensable
              ? matchedLicenceType && !matchedLicenceType.needs_license_key
                ? licenseKey
                : null
              : serialNumber,
            license_key:
              isLicensable && matchedLicenceType?.needs_license_key
                ? licenseKey
                : null,
            system_code: systemCode,
            license_details,
            department_id: dept?.departmentId || null,
            asset_used_by: usedBy?.user_id || null,
            asset_managed_by: managedBy?.user_id || null,
            branch_id: branch?.branchId,
            asset_item_id: dto.asset_item_id,
            quantity: dto.quantity || 1,
            status_type_id: inUseStatus?.status_type_id || null,
            warranty_start: formatDateToISO(dto.warranty_start_date),
            warranty_end: formatDateToISO(dto.warranty_end_date),
          },
        ];


       

        const newStock = {
          asset_id,
          asset_item_id: dto.asset_item_id,
          previous_available_quantity: 0,
          total_available_quantity: dto.quantity || 1,
          vendor_id: vendor?.vendor_id,
          created_by: user_id,
          asset_ownership_status: ownership?.ownership_status_type_id,
          quantity: dto.quantity || 1,
          warranty_start: dto.warranty_start_date
            ? new Date(formatDateToISO(dto.warranty_start_date))
            : null,
          warranty_end: dto.warranty_end_date
            ? new Date(formatDateToISO(dto.warranty_end_date))
            : null,
          buy_price: dto.buy_price,
          purchase_date: dto.purchase_date
            ? new Date(formatDateToISO(dto.purchase_date))
            : null,
          invoice_no: dto.bill_no,
          branch_id: branch?.branchId,
          license_details,
          assetDetails,
        };

         console.log(`newStock:-${Math.random()}`, newStock);

        console.log(
          '📥 Inserting Stock:',
          isLicensable ? 'Licensable' : 'Non-Licensable',
        );
        try {
          if (isLicensable) {
            await this.stockService.createStockAndSerials(newStock);
          } else {
            await this.stockService.createStocks2(newStock);
          }
          console.log('✅ Stock created');
        } catch (e) {
          console.error('❌ Failed to insert stock:', e);
          throw e;
        }

        const newMapping = {
          asset_id,
          branch_id: branch?.branchId,
          department_id: dept?.departmentId || null,
          asset_used_by: usedBy?.user_id || null,
          quantity: dto.quantity || 1,
          mapping_type: usedBy ? 1 : 0,
          status_type_id: usedBy ? inUseStatus?.status_type_id : null,
          asset_managed_by: managedBy?.user_id || null,
          unique_id: isLicensable ? licenseKey : serialNumber,
          system_code: systemCode,
          created_by: user_id,
        };

        await this.assetMappingRepository.insert(newMapping);
      

        successItems.push(dto);
      } catch (error) {
        
        errorItems.push({
          ...dto,
          error: error.message || 'Unexpected error while processing asset',
        });
      }
    }

    

    return {
      status: successItems.length ? HttpStatus.CREATED : HttpStatus.CONFLICT,
      message:
        successItems.length > 0 &&
        (duplicateItems.length > 0 || errorItems.length > 0)
          ? `Partial success: ${successItems.length} created, ${duplicateItems.length} duplicates, ${errorItems.length} errors.`
          : successItems.length > 0
            ? 'All bulk assets created successfully.'
            : duplicateItems.length > 0
              ? 'All entries were skipped due to duplicates.'
              : 'No assets created due to errors.',
      data: {
        created_count: successItems.length,
        created_items: successItems,
        duplicate_count: duplicateItems.length,
        duplicate_items: duplicateItems,
        error_count: errorItems.length,
        error_items: errorItems,
      },
      refresh: true,
    };
  }

  async bulkCreateAssets1(dtos: any[], user_id: number) {
    console.log('dtos:=', dtos);

    const successItems = [];
    const errorItems = [];
    const duplicateItems = [];

    // Helper function to format dates
    function formatDateToISO(dateStr: string): string | null {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('-');
      if (!day || !month || !year) return null;
      return `${year}-${month}-${day}`;
    }

    // Helper function to generate serial number if not provided
    function generateSerialNumber(asset = null) {
      // console.log(asset)
      const activeAsset = asset;
      // console.log(activeAsset)
      const prefix = activeAsset?.substring(0, 3).toUpperCase() || 'AST';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${randomNum}`;
    }

    // Fetch reference data
    const existingVendors =
      await this.organizationService.getAllorganizationVenders();
    const ownershipStatuses =
      await this.assetOwnershipStatusService.getAllAssetOwnershipStatuses();
    const branches = await this.organizationService.fetchOrganizationBranches();
    const licenseTypes = await this.stockService.findAllLicenceType();
    const departments =
      await this.organizationService.fetchOrganizationDeparments();
    const statusTypes = await this.assetStatusService.findAll();
    const items = await this.assetItemsService.findAll({});

    const inUseStatus = statusTypes.find(
      (s) => s.status_type_name.trim().toLowerCase() === 'inuse',
    );

    const formattedItems = items.map((item) => ({
      asset_item_id: item.asset_item_id,
      is_licensable: item.is_licensable,
    }));

    // Store license key for Volume license type
    const volumeLicenseKey =
      dtos[0]?.licence_type === 'Volume' ? dtos[0]?.license_key : null;

    console.log('volumeLicenseKey', volumeLicenseKey);

    for (const dto of dtos) {
      try {
        const modelNo = dto.model_no?.trim();
        if (!modelNo || !dto.asset_item_id) {
          errorItems.push({
            ...dto,
            error: 'Missing required fields: model_no or asset_item_id',
          });
          continue;
        }

        const currentItem = formattedItems.find(
          (item) => item.asset_item_id === dto.asset_item_id,
        );
        const isLicensable = currentItem?.is_licensable === true;

        // Match license type
        const matchedLicenceType = licenseTypes.find(
          (licence) => licence.licence_type === dto.licence_type,
        );
        console.log('matchedLicenceType', matchedLicenceType);

        // Validate Subscription license requirements
        if (matchedLicenceType?.licence_type === 'Subscription') {
          if (!dto.warranty_start_date || !dto.warranty_end_date) {
            errorItems.push({
              ...dto,
              error:
                'Subscription license requires warranty_start_date and warranty_end_date',
            });
            continue;
          }
        }

        // Check if asset already exists
        const existingAsset = await this.assetDataRepository.findOne({
          where: {
            asset_title: modelNo,
            asset_item_id: dto.asset_item_id,
            asset_main_category_id: dto.main_category_id,
            asset_sub_category_id: dto.sub_category_id,
          },
        });

        // Handle dynamic fields
        const dynamicFieldsRaw =
          await this.assetItemsFieldsMappingService.findItemFields(
            dto.asset_item_id,
          );
        const dynamicFields = dynamicFieldsRaw['2']?.items || [];

        const assetInformationFields = dynamicFields.map(
          (field: { assetFields: any }) => {
            const assetField = field.assetFields;
            const key = assetField.asset_field_label_name;
            return {
              asset_field_id: assetField.asset_field_id,
              asset_field_category_id: assetField.asset_field_category_id,
              asset_field_name: assetField.asset_field_name,
              asset_field_label_name: assetField.asset_field_label_name,
              value: dto[key] || '',
            };
          },
        );

        // Lookup vendor, ownership, branch, users, and department
        const vendor = existingVendors.data.find(
          (v: { vendor_name: string }) =>
            v.vendor_name?.trim().toLowerCase() ===
            dto.vendor?.trim().toLowerCase(),
        );
        const ownership = ownershipStatuses.find(
          (s) =>
            s.ownership_status_type_name?.trim().toLowerCase() ===
            dto.ownership_mode?.trim().toLowerCase(),
        );
        const branch = branches.data.find(
          (b: { branchName: string }) =>
            b.branchName?.trim().toLowerCase() ===
            dto.branch?.trim().toLowerCase(),
        );
        const branchUsers = branch
          ? (
              await this.organizationService.fetchAllBranchusers(
                branch.branchId,
              )
            )?.data || []
          : [];
        const usedBy = branchUsers.find(
          (u: { first_name: any; last_name: any }) =>
            `${u.first_name} ${u.last_name}`.toLowerCase() ===
            dto.assigned_to?.trim().toLowerCase(),
        );
        const managedBy = branchUsers.find(
          (u: { first_name: any; last_name: any }) =>
            `${u.first_name} ${u.last_name}`.toLowerCase() ===
            dto.manager?.trim().toLowerCase(),
        );
        const dept = departments.data.find(
          (d: { departmentName: string }) =>
            d.departmentName?.trim().toLowerCase() ===
            dto.department?.trim().toLowerCase(),
        );

        let asset_id: number;
        let systemCode: any;

        // Create or reuse asset
        if (existingAsset) {
          asset_id = existingAsset.asset_id;
          systemCode = generateSerialNumber(existingAsset.asset_title);
        } else {
          const createAssetDTO = {
            asset_id: null,
            asset_main_category_id: dto.main_category_id || null,
            asset_sub_category_id: dto.sub_category_id || null,
            asset_item_id: dto.asset_item_id || null,
            asset_information_fields: JSON.stringify(assetInformationFields),
            asset_description: dto.stock_description || null,
            asset_title: modelNo,
            asset_added_by: user_id,
            asset_is_active: 1,
            asset_is_deleted: 0,
            asset_created_at: new Date(),
            asset_updated_at: new Date(),
            manufacturer: dto.manufacturer || null,
          };
          const result = await this.addAsset(createAssetDTO);
          asset_id = result.data.asset_id;
          systemCode = generateSerialNumber(result.data.asset_title);
        }

        // Determine license key or serial number
        let licenseKey = null;
        let serialNumber = null;

        if (isLicensable && matchedLicenceType) {
          if (
            matchedLicenceType.licence_type === 'Volume' &&
            volumeLicenseKey
          ) {
            licenseKey = volumeLicenseKey;
          } else if (matchedLicenceType.needs_license_key) {
            licenseKey = dto.license_key;
          }

          // Check for duplicate license key
          if (licenseKey) {
            const existingLicense =
              await this.checkDuplicateLicense(licenseKey);
            if (existingLicense) {
              errorItems.push({
                ...dto,
                error: `Duplicate license key: ${licenseKey}`,
              });
              continue;
            }
          }
        } else {
          serialNumber = dto.serial_no || generateSerialNumber(modelNo);
          // Check for duplicate serial number
          const existingSerial = await this.checkDuplicateSerial(serialNumber);
          if (existingSerial) {
            errorItems.push({
              ...dto,
              error: `Duplicate serial number: ${serialNumber}`,
            });
            continue;
          }
        }

        // Include plan details for Subscription
        const license_details = matchedLicenceType
          ? JSON.stringify({
              ...matchedLicenceType,
              ...(matchedLicenceType.have_plan_type
                ? { plan_name: dto.plan_name, plan_details: dto.plan_details }
                : {}),
            })
          : null;

        // Prepare asset details
        const assetDetails = [
          {
            serial_number: isLicensable
              ? matchedLicenceType && !matchedLicenceType.needs_license_key
                ? licenseKey
                : null
              : serialNumber,
            license_key:
              isLicensable && matchedLicenceType?.needs_license_key
                ? licenseKey
                : null,
            system_code: systemCode,
            license_details,
            department_id: dept?.departmentId || null,
            asset_used_by: usedBy?.user_id || null,
            asset_managed_by: managedBy?.user_id || null,
            branch_id: branch?.branchId,
            asset_item_id: dto.asset_item_id,
            quantity: dto.quantity || 1,
            status_type_id: inUseStatus?.status_type_id || null,
            warranty_start: formatDateToISO(dto.warranty_start_date),
            warranty_end: formatDateToISO(dto.warranty_end_date),
          },
        ];

        // Create stock
        const newStock = {
          asset_id,
          asset_item_id: dto.asset_item_id,
          previous_available_quantity: 0,
          total_available_quantity: dto.quantity || 1,
          vendor_id: vendor?.vendor_id,
          created_by: user_id,
          asset_ownership_status: ownership?.ownership_status_type_id,
          quantity: dto.quantity || 1,
          warranty_start: dto.warranty_start_date
            ? new Date(formatDateToISO(dto.warranty_start_date))
            : null,
          warranty_end: dto.warranty_end_date
            ? new Date(formatDateToISO(dto.warranty_end_date))
            : null,
          buy_price: dto.buy_price,
          purchase_date: dto.purchase_date
            ? new Date(formatDateToISO(dto.purchase_date))
            : null,
          invoice_no: dto.bill_no,
          branch_id: branch?.branchId,
          license_details,
          assetDetails,
        };

        // Save stock based on license type
        if (isLicensable) {
          await this.stockService.createStockAndSerials(newStock);
        } else {
          await this.stockService.createStocks2(newStock);
        }

        // Create mapping
        const newMapping = {
          asset_id,
          branch_id: branch?.branchId,
          department_id: dept?.departmentId || null,
          asset_used_by: usedBy?.user_id || null,
          quantity: dto.quantity || 1,
          mapping_type: usedBy ? 1 : 0,
          status_type_id: usedBy ? inUseStatus?.status_type_id : null,
          asset_managed_by: managedBy?.user_id || null,
          unique_id: isLicensable ? licenseKey : serialNumber,
          system_code: systemCode,
          created_by: user_id,
        };

        await this.assetMappingRepository.insert(newMapping);

        successItems.push(dto);
      } catch (error) {
        console.error('Error processing DTO:', error);
        errorItems.push({
          ...dto,
          error: error.message || 'Unexpected error while processing asset',
        });
      }
    }

    return {
      status: successItems.length ? HttpStatus.CREATED : HttpStatus.CONFLICT,
      message:
        successItems.length > 0 &&
        (duplicateItems.length > 0 || errorItems.length > 0)
          ? `Partial success: ${successItems.length} created, ${duplicateItems.length} duplicates, ${errorItems.length} errors.`
          : successItems.length > 0
            ? 'All bulk assets created successfully.'
            : duplicateItems.length > 0
              ? 'All entries were skipped due to duplicates.'
              : 'No assets created due to errors.',
      data: {
        created_count: successItems.length,
        created_items: successItems,
        duplicate_count: duplicateItems.length,
        duplicate_items: duplicateItems,
        error_count: errorItems.length,
        error_items: errorItems,
      },
      refresh: true,
    };
  }
}
