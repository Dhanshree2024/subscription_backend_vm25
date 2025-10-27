import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Res,
} from '@nestjs/common';
import { CreateAssetItemNewDto } from './dto/create-asset-item.dto';
import { UpdateAssetItemDto } from './dto/update-asset-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetItem } from './entities/asset-item.entity';
import { DataSource, ILike, In, Like, Repository } from 'typeorm';
import { DatabaseService } from 'src/dynamic-schema/database.service';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { DeleteAssetItemDto } from './dto/delete-asset-item.dto';
import { AssetItemsRelation } from '../asset-items/entities/asset-item-relations.entity';
import { RelationType } from './entities/asset-item-relations.entity';
import { FetchAssetItemByIdDto } from './dto/fetch-asset-item-id.dto';
import * as express from 'express';
import * as XlsxPopulate from 'xlsx-populate';

import { AssetCategoriesService } from '../asset-categories/asset-categories.service';
import { AssetSubcategoriesService } from '../asset-subcategories/asset-subcategories.service';

import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetSubcategory } from '../asset-subcategories/entities/asset-subcategory.entity';
import { AssetStockSerialsRepository } from '../stocks/entities/asset_stock_serials.entity';


enum ItemType {
  PHYSICAL = 'Physical',
  VIRTUAL = 'Virtual',
}

@Injectable()
export class AssetItemsService {
  constructor(
    @InjectRepository(AssetItem)
    private assetItemRepository: Repository<AssetItem>,

    @InjectRepository(AssetCategory)
    private categoryepository: Repository<AssetCategory>,

    @InjectRepository(AssetSubcategory)
    private subCategoryRepository: Repository<AssetSubcategory>,

     @InjectRepository(AssetStockSerialsRepository)
    private readonly serialRepo: Repository<AssetStockSerialsRepository>,

    private readonly dataSource: DataSource,
    private readonly databaseService: DatabaseService,

    private readonly assetCategoriesService: AssetCategoriesService,

    private readonly assetSubCategoriesService: AssetSubcategoriesService,
  ) {}

async testService(): Promise<string[]> {
    const result = await this.serialRepo
      .createQueryBuilder('asset_stock_serials')
      .select('asset_stock_serials.license_key', 'license_key')
      .where('serial.license_key IS NOT NULL')
      .getRawMany();

    // result will be array of objects: [{ license_key: 'LIC001' }, ...]
    return result.map((row) => row.license_key);
  }


  

  async getAllDepreciationItems() {
    const serials = await this.serialRepo.createQueryBuilder('serial')
    
      .andWhere('serial.depreciation_start_date IS NOT NULL')
      .andWhere('serial.depreciation_end_date IS NOT NULL')
      .select([
        'serial.asset_stocks_unique_id',
        'serial.system_code',
        'serial.buy_price',
        'serial.depreciation_start_date',
        'serial.depreciation_end_date',
        
      ])
      .getMany();

    return serials;
  }

  async fetchOrganizationAllAssetItems1(
    page: number,
    limit: number,
    searchQuery: string,
  ): Promise<any> {
    try {
      const queryBuilder = this.assetItemRepository
        .createQueryBuilder('asset_items')
        .leftJoinAndSelect('asset_items.main_category', 'main_category')
        .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
        .leftJoinAndSelect(
          'asset_items.related_items',
          'related_items',
          'related_items.is_active = :related_is_active AND related_items.is_deleted = :related_is_deleted',
          { related_is_active: 1, related_is_deleted: 0 },
        )
        .leftJoinAndSelect('related_items.child_item', 'child_item') // Fetch child asset details
        .where('asset_items.is_active = :isActive', { isActive: 1 })
        .andWhere('asset_items.is_deleted = :isDeleted', { isDeleted: 0 });

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder.andWhere('asset_items.asset_item_name ILIKE :search', {
          search: `%${searchQuery}%`,
        });
      }

      const [results, total] = await queryBuilder
        .orderBy('asset_items.asset_item_name', 'ASC')
        .skip((page - 1) * limit) // Pagination
        .take(limit)
        .getManyAndCount();

      if (!results.length) {
        throw new BadRequestException(
          'No asset items found with the specified criteria.',
        );
      }

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error fetching asset items:', error);
      throw new BadRequestException(
        `Error fetching asset items: ${error.message}`,
      );
    }
  }

  getFilterableItemColumns() {
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
      {
        key: 'is_licensable',
        label: 'Licensable',
        type: 'boolean',
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

  async fetchOrganizationAllAssetItems(
    page: number,
    limit: number,
    searchQuery: string,
    customFilters?: Record<string, any>,
  ): Promise<any> {
    try {
      console.log('page', page);
      console.log('limit', limit);
      console.log('searchQuery', searchQuery);
      console.log('customFilters', customFilters);

      let queryBuilder = this.assetItemRepository
        .createQueryBuilder('asset_items')
        .leftJoinAndSelect('asset_items.main_category', 'main_category')
        .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
        .leftJoinAndSelect(
          'asset_items.related_items',
          'related_items',
          'related_items.is_active = :related_is_active AND related_items.is_deleted = :related_is_deleted',
          { related_is_active: 1, related_is_deleted: 0 },
        )
        .leftJoinAndSelect('related_items.child_item', 'child_item')
        .where('asset_items.is_active = :isActive', { isActive: 1 })
        .andWhere('asset_items.is_deleted = :isDeleted', { isDeleted: 0 });

      // Search logic
      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder = queryBuilder.andWhere(
          'asset_items.asset_item_name ILIKE :search',
          { search: `%${searchQuery}%` },
        );
      }

      // Dynamic filters
      if (customFilters && Object.keys(customFilters).length > 0) {
        for (const [key, value] of Object.entries(customFilters)) {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            key === 'sortOrder'
          )
            continue;

          // Date range filter
          if (typeof value === 'object' && value.from && value.to) {
            queryBuilder = queryBuilder.andWhere(
              `asset_items.${key} BETWEEN :from_${key} AND :to_${key}`,
              {
                [`from_${key}`]: value.from,
                [`to_${key}`]: value.to,
              },
            );
          }
          // Filter by main category
          else if (key === 'main_category_id') {
            queryBuilder = queryBuilder.andWhere(
              'asset_items.main_category_id = :mainCategoryId',
              { mainCategoryId: value },
            );
          }
          // Filter by sub category
          else if (key === 'sub_category_id') {
            queryBuilder = queryBuilder.andWhere(
              'asset_items.sub_category_id = :subCategoryId',
              { subCategoryId: value },
            );
          }
          // Boolean filter
          else if (typeof value === 'boolean') {
            queryBuilder = queryBuilder.andWhere(
              `asset_items.${key} = :${key}`,
              { [key]: value },
            );
          }
          // Default text/number filter
          else {
            queryBuilder = queryBuilder.andWhere(
              `asset_items.${key} = :${key}`,
              { [key]: value },
            );
          }
        }
      }

      // Sorting logic
      let sortField = 'asset_items.asset_item_name';
      let sortDirection: 'ASC' | 'DESC' = 'ASC';

      if (customFilters?.sortOrder) {
        const sortOrder = customFilters.sortOrder.toLowerCase();
        if (sortOrder === 'desc') {
          sortDirection = 'DESC';
        } else if (sortOrder === 'asc') {
          sortDirection = 'ASC';
        } else if (sortOrder === 'newest') {
          sortField = 'asset_items.created_at';
          sortDirection = 'DESC';
        } else if (sortOrder === 'oldest') {
          sortField = 'asset_items.created_at';
          sortDirection = 'ASC';
        }
      }

      const [results, total] = await queryBuilder
        .orderBy(sortField, sortDirection)
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      if (!results.length) {
        return {
          data: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          message: 'No asset items found with the specified criteria.',
        };
      }

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error fetching asset items:', error);
      throw new BadRequestException(
        `Error fetching asset items: ${error.message}`,
      );
    }
  }

  async exportFilteredExcelForAssetItems({
    search,
    filters,
  }: {
    search?: string;
    filters?: Record<string, any>;
  }): Promise<Buffer> {
    const queryBuilder = this.assetItemRepository
      .createQueryBuilder('asset_items')
      .leftJoinAndSelect('asset_items.main_category', 'main_category')
      .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
      .leftJoinAndSelect(
        'asset_items.related_items',
        'related_items',
        'related_items.is_active = :related_is_active AND related_items.is_deleted = :related_is_deleted',
        { related_is_active: 1, related_is_deleted: 0 },
      )
      .leftJoinAndSelect('related_items.child_item', 'child_item')
      .where('asset_items.is_active = :isActive', { isActive: 1 })
      .andWhere('asset_items.is_deleted = :isDeleted', { isDeleted: 0 });

    // ✅ Normalize and apply search
    if (search && search.trim() !== '') {
      const normalizedSearch = search.trim().replace(/\s+/g, ' ');
      queryBuilder.andWhere('asset_items.asset_item_name ILIKE :search', {
        search: `%${normalizedSearch}%`,
      });
    }

    // ✅ Apply dynamic filters
    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          key === 'sortOrder'
        )
          continue;

        if (typeof value === 'object' && value.from && value.to) {
          queryBuilder.andWhere(
            `asset_items.${key} BETWEEN :from_${key} AND :to_${key}`,
            {
              [`from_${key}`]: value.from,
              [`to_${key}`]: value.to,
            },
          );
        } else if (key === 'main_category_id') {
          queryBuilder.andWhere(
            'asset_items.main_category_id = :mainCategoryId',
            { mainCategoryId: value },
          );
        } else if (key === 'sub_category_id') {
          queryBuilder.andWhere(
            'asset_items.sub_category_id = :subCategoryId',
            { subCategoryId: value },
          );
        } else if (typeof value === 'boolean') {
          queryBuilder.andWhere(`asset_items.${key} = :${key}`, {
            [key]: value,
          });
        } else {
          queryBuilder.andWhere(
            `CAST(asset_items.${key} AS TEXT) ILIKE :${key}`,
            { [key]: `%${value}%` },
          );
        }
      }
    }

    // ✅ Apply sort order
    let sortField = 'asset_items.asset_item_name';
    let sortDirection: 'ASC' | 'DESC' = 'ASC';

    if (filters?.sortOrder) {
      const order = filters.sortOrder.toLowerCase();
      if (order === 'desc') sortDirection = 'DESC';
      else if (order === 'asc') sortDirection = 'ASC';
      else if (order === 'newest') {
        sortField = 'asset_items.created_at';
        sortDirection = 'DESC';
      } else if (order === 'oldest') {
        sortField = 'asset_items.created_at';
        sortDirection = 'ASC';
      }
    }

    queryBuilder.orderBy(sortField, sortDirection);

    const data = await queryBuilder.getMany();

    // ✅ Excel generation
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name('Asset Items');

    const headers = [
      'Sr. No.',
      'Item Name',
      'Main Category',
      'Sub Category',
      'Description',
      'Licensable',
    ];

    headers.forEach((header, i) => {
      sheet
        .cell(1, i + 1)
        .value(header)
        .style({ bold: true });
    });

    data.forEach((item, index) => {
      const row = index + 2;
      sheet.cell(row, 1).value(index + 1);
      sheet.cell(row, 2).value(item.asset_item_name || '');
      sheet.cell(row, 3).value(item.main_category?.main_category_name || '');
      sheet.cell(row, 4).value(item.sub_category?.sub_category_name || '');
      sheet.cell(row, 5).value(item.asset_item_description || '');
      sheet.cell(row, 6).value(item.is_licensable ? 'Yes' : 'No');
    });

    headers.forEach((_, i) => {
      sheet.column(i + 1).width(headers[i].length + 10);
    });

    return await workbook.outputAsync();
  }

  // new one
  // async fetchAssetItemById(dto: FetchAssetItemByIdDto): Promise<any> {
  //   const { asset_item_id } = dto;

  //   try {
  //     // Fetch the AssetItem details along with its relations
  //     const assetItem = await this.assetItemRepository
  //       .createQueryBuilder('asset_items')
  //       .leftJoinAndSelect('asset_items.main_category', 'main_category')
  //       .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
  //       .leftJoinAndSelect('asset_items.related_items', 'related_items') // Fetch related items
  //       .leftJoinAndSelect('related_items.child_item', 'child_item') // Fetch child asset details
  //       .where('asset_items.asset_item_id = :asset_item_id', { asset_item_id })
  //       .andWhere('asset_items.is_active = :isActive', { isActive: 1 })
  //       .andWhere('asset_items.is_deleted = :isDeleted', { isDeleted: 0 })
  //       .getOne();

  //     if (!assetItem) {
  //       throw new HttpException(
  //         `Asset Item with ID ${asset_item_id} not found or inactive.`,
  //         HttpStatus.NOT_FOUND,
  //       );
  //     }

  //     // Return the fetched data
  //     return {
  //       data: assetItem,
  //     };
  //   } catch (error) {
  //     console.error('Error fetching asset item by ID:', error);
  //     throw new HttpException(
  //       error.message || 'An error occurred while fetching the asset item.',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  async exportItemsCSV() {
    try {
      const whereCondition = { is_active: 1, is_deleted: 0 };

      // Fetch items with main & subcategories
      const [results, total] = await this.assetItemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.main_category', 'mainCategory')
        .leftJoinAndSelect('item.sub_category', 'subCategory')
        .where(whereCondition)
        .orderBy('item.asset_item_id', 'DESC')
        .getManyAndCount();

      console.log('Fetched Items:', results); // Debugging

      // Ensure data is properly formatted
      const decodedResults = results.map((item) => ({
        'Item Name': item.asset_item_name || '',
        'Main Category': item.main_category?.main_category_name || 'N/A',
        'Sub Category': item.sub_category?.sub_category_name || 'N/A',
        Description: item.asset_item_description || '',
        'Parent Org ID': item.parent_organization_id || '',
        'Added By': item.added_by || '',
        'Created At': item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : '',
        'Updated At': item.updated_at
          ? new Date(item.updated_at).toLocaleDateString()
          : '',
      }));

      return { decodedResults };
    } catch (error) {
      console.error('Error exporting items CSV:', error);
      throw new Error('An error occurred while exporting item data.');
    }
  }

  async findAll(filters: {
    category_id?: string | number;
    sub_category_id?: string | number;
    item_id?: string | number;
  }) {
    try {
      console.log('Final WHERE clause filters:', filters);

      const query = this.assetItemRepository
        .createQueryBuilder('asset_items')
        .leftJoinAndSelect('asset_items.main_category', 'main_category')
        .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
        .where('asset_items.is_active = :is_active', { is_active: 1 })
        .andWhere('asset_items.is_deleted = :is_deleted', { is_deleted: 0 });

      if (filters.category_id) {
        query.andWhere('asset_items.main_category_id = :category_id', {
          category_id: +filters.category_id,
        });
      }

      if (filters.sub_category_id) {
        query.andWhere('asset_items.sub_category_id = :sub_category_id', {
          sub_category_id: +filters.sub_category_id,
        });
      }

      if (filters.item_id) {
        query.andWhere('asset_items.asset_item_id = :item_id', {
          item_id: +filters.item_id,
        });
      }

      const results = await query
        .orderBy('asset_items.asset_item_name', 'ASC')
        .getMany();

      return results;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching items.');
    }
  }

  countAll() {
    try {
      return this.assetItemRepository.countBy({
        parent_organization_id: 1,
        is_active: 1,
        is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} assetItem`;
  }

  async update(id: number, updateAssetItemDto: UpdateAssetItemDto) {
    // Ensure that the asset_id exists
    if (!id) {
      throw new Error('Asset Item ID Not Present');
    }

    // Find the existing asset data by its asset_id
    const existingAsset = await this.assetItemRepository.findOneBy({
      asset_item_id: id,
    });

    // If the asset does not exist, throw an error
    if (!existingAsset) {
      throw new Error('Asset Item not found for updating.');
    }

    // Merge the update data with the existing asset data
    Object.assign(existingAsset, updateAssetItemDto);

    // Save the updated asset data
    const updatedAsset = await this.assetItemRepository.save(existingAsset);

    return updatedAsset;
  }

  // async deleteAssetItem(createAssetItemDto: CreateAssetItemDto) {

  //   try {
  //     const existingItem = await this.assetItemRepository.findOneBy({asset_item_id:createAssetItemDto.asset_item_id});

  //     // If the asset does not exist, throw an error
  //     if (!existingItem) {
  //         throw new Error('Asset Item not found for deleting.');
  //     }

  //     // Create a new instance of the User entity
  //     const newUser = new AssetItem();
  //     newUser.is_active = 0;
  //     newUser.is_deleted = 1;

  //     // Merge the update data with the existing asset data
  //     Object.assign(existingItem, newUser);

  //     // Save the user entity
  //     let savedUser = await this.assetItemRepository.save(existingItem);

  //     return savedUser;
  //   }
  //   catch (error) {
  //       console.error('Error in delete:', error);
  //       throw new Error('An error occurred while inserting the item.');
  //   }

  // }

  remove(id: number) {
    return `This action removes a #${id} assetItem`;
  }

  async getUserByPublicID(public_user_id: number): Promise<number> {
    const userExists = await this.dataSource
      .getRepository(User)
      .findOne({ where: { register_user_login_id: public_user_id } });
    if (!userExists) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'Invalid user ID' },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return userExists.user_id;
    }
  }

  async createNewAssetItem(dto: CreateAssetItemNewDto) {

    console.log("CreateAssetItemNewDto", dto)
    try {
      // Fetch all items with similar name (case-insensitive match)
      const allItems = await this.assetItemRepository.find();

      const existingItem = allItems.find(
        (item) =>
          item.asset_item_name?.toLowerCase() ===
          dto.asset_item_name?.toLowerCase(),
      );

      if (existingItem) {
        if (existingItem.is_deleted === 1) {
          // Reactivate soft-deleted item
          existingItem.is_deleted = 0;
          existingItem.is_active = 1;
          existingItem.updated_at = new Date();
          existingItem.asset_item_description =
            dto.asset_item_description ?? existingItem.asset_item_description;
          existingItem.main_category_id = dto.main_category_id;
          existingItem.sub_category_id = dto.sub_category_id;
          existingItem.item_type = dto.item_type;
          existingItem.is_licensable = dto.is_licensable;
          existingItem.added_by = dto.added_by;

          const reactivatedItem =
            await this.assetItemRepository.save(existingItem);

          // Also handle relations if provided
          if (dto.asset_relation?.length) {
            const relationRepo =
              this.dataSource.getRepository(AssetItemsRelation);

            for (const relation_item of dto.asset_relation) {
              const relationEntity = relationRepo.create({
                parent_asset_item_id: reactivatedItem.asset_item_id,
                child_asset_item_id: relation_item.asset_item_id_2,
                relation_type: relation_item.relation_type as RelationType,
                created_by: dto.added_by,
              });

              await relationRepo.save(relationEntity);
            }
          }

          return {
            status: HttpStatus.OK,
            message: 'Asset item reactivated successfully',
            data: {
              user: reactivatedItem,
            },
          };
        }

        // Already exists and is active
        throw new BadRequestException({
          status: HttpStatus.CONFLICT,
          message: `Item '${dto.asset_item_name}' already exists.`,
          data: existingItem,
        });
      }

      // Create new item
      const newItem = this.assetItemRepository.create({
        asset_item_name: dto.asset_item_name,
        main_category_id: dto.main_category_id,
        sub_category_id: dto.sub_category_id,
        item_type: dto.item_type,
        asset_item_description: dto.asset_item_description,
        is_licensable: dto.is_licensable,
        added_by: dto.added_by,
        is_active: 1,
        is_deleted: 0,
        created_at: new Date(),
        updated_at: new Date(),
         has_depreciation: dto.has_depreciation,
          company_act_asset_life: dto.company_act_asset_life,
          it_act_asset_life: dto.it_act_asset_life,
          company_depreciation_rate: dto.company_depreciation_rate,
          it_act_depreciation_rate: dto.it_act_depreciation_rate,
          company_act_residual_value: dto.company_act_residual_value,
          it_act_residual_value: dto.it_act_residual_value,

         // preffered_method: dto.preffered_method ?? 0,
      });

      const savedUser = await this.assetItemRepository.save(newItem);

      // Handle asset relations if any
      if (dto.asset_relation?.length) {
        const relationRepo = this.dataSource.getRepository(AssetItemsRelation);

        for (const relation_item of dto.asset_relation) {
          const relationEntity = relationRepo.create({
            parent_asset_item_id: savedUser.asset_item_id,
            child_asset_item_id: relation_item.asset_item_id_2,
            relation_type: relation_item.relation_type as RelationType,
            created_by: dto.added_by,
          });

          await relationRepo.save(relationEntity);
        }
      }

      return {
        status: HttpStatus.CREATED,
        message: 'Item created successfully',
        data: {
          user: savedUser,
        },
      };
    } catch (error) {
      console.error('Error creating new asset item:', error);
      throw error; // Let NestJS handle known errors
    }
  }



  async generateItemTemplate(): Promise<Buffer> {
    try {
      // Fetch category and sub-category data
      const categories = await this.assetCategoriesService.findAll();
      const subCategories = await this.assetSubCategoriesService.findAll();

      const categoryNames = categories.map((cat) => cat.main_category_name.trim());

      // Group subcategories under their respective main categories
      const subCategoryMap = {};
      categories.forEach((cat) => {
        subCategoryMap[cat.main_category_name.trim()] = [];
      });

      subCategories.forEach((sub) => {
        const category = categories.find(
          (cat) => cat.main_category_id === sub.main_category_id,
        );
        if (category) {
          const categoryName = category.main_category_name.trim();
          if (!subCategoryMap[categoryName]) subCategoryMap[categoryName] = [];

          if (sub.sub_category_name && sub.sub_category_name.trim()) {
            subCategoryMap[categoryName].push(sub.sub_category_name.trim());
          }
        } else {
          console.log(
            `Category not found for main_category_id: ${sub.main_category_id}`,
          );
        }
      });

      const workbook = await XlsxPopulate.fromBlankAsync();
      const mainSheet = workbook.sheet(0);
      mainSheet.name('Items_template');
      const dataSheet = workbook.addSheet('Data');

      // Instructions
      const instructions = [
        'Instructions:',
        '1. Fill in all required fields starting from row 7.',
        '2. "Category" and "Sub-Category" must be selected from dropdowns.',
        '3. Do not edit the header row (Row 6).',
        '4. Use "Yes"/"No" only in the Licensable field.',
        '5. Use "Physical"/"Virtual" for Item Type.',
      ];
      instructions.forEach((text, index) => {
        mainSheet
          .cell(index + 1, 1)
          .value(text)
          .style({
            bold: true,
            fontColor: '0000FF',
          });
      });

      // Header row (Row 6), using user-pattern: label + required
      const headers = [
        { label: 'Category', required: true },
        { label: 'Sub-Category', required: true },
        { label: 'Item Name', required: true },
        { label: 'Item Description', required: false },
        { label: 'Is item Licensable ?', required: true },
        { label: 'Item Type', required: true },
      ];
      headers.forEach((item, index) => {
        const cell = mainSheet.cell(6, index + 1);
        const label = item.required ? `${item.label} *` : item.label;
        cell.value(label).style({
          bold: true,
          fontColor: item.required ? 'FF0000' : '000000',
        });
      });

      // Column widths for clarity
      const columnWidths = [25, 25, 30, 40, 25, 20];
      columnWidths.forEach((width, index) => {
        mainSheet.column(index + 1).width(width);
      });

      const startRow = 7;
      const endRow = 1048576;

      // Fill data sheet with categories in A, subcategories in B+
      categoryNames.forEach((catName, i) => {
        dataSheet.cell(i + 1, 1).value(catName);
        const subs = subCategoryMap[catName];
        if (subs) {
          subs.forEach((subName, j) => {
            if (subName && subName.trim()) {
              dataSheet.cell(i + 1, j + 2).value(subName.trim());
            }
          });
        }
      });

      // Named Ranges for INDIRECT formula in Sub-Category
      categoryNames.forEach((catName, i) => {
        const safeName = catName.replace(/\s+/g, '_');
        const subs = subCategoryMap[catName];
        if (subs && subs.length > 0) {
          const startCol = 2;
          const endCol = startCol + subs.length - 1;

          const colLetter = (colNum: number) => {
            let temp = '';
            let n = colNum;
            while (n > 0) {
              let remainder = (n - 1) % 26;
              temp = String.fromCharCode(65 + remainder) + temp;
              n = Math.floor((n - 1) / 26);
            }
            return temp;
          };

          const startAddress = `${colLetter(startCol)}${i + 1}`;
          const endAddress = `${colLetter(endCol)}${i + 1}`;
          const range = `${dataSheet.name()}!${startAddress}:${endAddress}`;

          workbook.definedName(safeName, range);
        }
      });

      // Data Validations
      mainSheet.range(`A${startRow}:A${endRow}`).dataValidation({
        type: 'list',
        allowBlank: false,
        showInputMessage: true,
        formula1: `=Data!$A$1:$A$${categoryNames.length}`,
      });

      mainSheet.range(`B${startRow}:B${endRow}`).dataValidation({
        type: 'list',
        allowBlank: false,
        showInputMessage: true,
        formula1: `=INDIRECT(SUBSTITUTE(A${startRow}," ","_"))`,
      });

      mainSheet.range(`E${startRow}:E${endRow}`).dataValidation({
        type: 'list',
        allowBlank: false,
        formula1: `"Yes,No"`,
      });

      mainSheet.range(`F${startRow}:F${endRow}`).dataValidation({
        type: 'list',
        allowBlank: false,
        formula1: `"${ItemType.PHYSICAL},${ItemType.VIRTUAL}"`,
      });

      dataSheet.hidden(true);

      const buffer = await workbook.outputAsync();
      return buffer;
    } catch (error) {
      console.error('Error generating template:', error);
      throw new Error('Failed to generate Excel template');
    }
  }

  async bulkCreateItem(dtos: any[], user_id: number) {

    const newItems = [];
    const errorItems = [];
    const successItems = [];

    console.log('🔵 [START] bulkCreateItem called:', {
      total_dtos: dtos.length,
      user_id,
    });

    // Fetch all required references
    const existingItems = await this.assetItemRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });
    console.log('📦 [INFO] Existing items count:', existingItems.length);

    const existingCategory = await this.categoryepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });
    const existingSubCategory = await this.subCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    // Process each DTO
    for (const dto of dtos) {
      console.log('🔄 [PROCESSING] Incoming DTO:', dto);

      // Skip if critical fields are missing or empty
      if (!dto.category || !dto.subcategory || !dto.items || !dto.item_type) {
        errorItems.push({ ...dto, reason: 'Missing required fields (category, subcategory, item name, or item type)' });
        console.warn('⚠️ [SKIPPED] Missing required fields');
        continue;
      }

      dto.added_by = user_id;

      // Resolve main_category_id
      const matchedCategory = existingCategory.find(
        (category) =>
          category.main_category_name?.trim().toLowerCase() ===
          dto.category?.trim().toLowerCase(),
      );
      dto.main_category_id = matchedCategory?.main_category_id || null;

      // Resolve sub_category_id
      const submatchedCategory = existingSubCategory.find(
        (subcategory) =>
          subcategory.sub_category_name?.trim().toLowerCase() ===
          dto.subcategory?.trim().toLowerCase(),
      );
      dto.sub_category_id = submatchedCategory?.sub_category_id || null;

      console.log('🧩 [MAPPED] Category IDs:', {
        main_category_id: dto.main_category_id,
        sub_category_id: dto.sub_category_id,
      });

      // Validation: Required fields
      if (!dto.main_category_id || !dto.sub_category_id) {
        errorItems.push({ ...dto, reason: 'Invalid category or subcategory' });
        console.warn('⚠️ [SKIPPED] Invalid category or subcategory');
        continue;
      }

      // Validate item_type
      if (!Object.values(ItemType).includes(dto.item_type)) {
        errorItems.push({ ...dto, reason: `Invalid item type: must be ${ItemType.PHYSICAL} or ${ItemType.VIRTUAL}` });
        console.warn('⚠️ [SKIPPED] Invalid item type:', dto.item_type);
        continue;
      }

      // Check for duplicate
      const isDuplicate = existingItems.find(
        (item) =>
          item.asset_item_name?.trim().toLowerCase() ===
            dto.items?.trim().toLowerCase() &&
          item.main_category_id === dto.main_category_id &&
          item.sub_category_id === dto.sub_category_id,
      );

      if (isDuplicate) {
        errorItems.push({ ...dto, reason: 'Duplicate item exists' });
        console.warn('⚠️ [SKIPPED] Duplicate item found:', dto.items);
        continue;
      }

      // Prepare and create item
      const newItem = this.assetItemRepository.create({
        asset_item_name: dto.items.trim(),
        asset_item_description: dto.description?.trim() || '',
        is_licensable: dto.isLicensable,
        main_category_id: dto.main_category_id,
        sub_category_id: dto.sub_category_id,
        added_by: dto.added_by,
        item_type: dto.item_type.trim(),
      });

      try {
        const savedItem = await this.assetItemRepository.save(newItem);

        if (!savedItem) {
          errorItems.push({ ...dto, reason: 'Failed to save item' });
          console.error('❌ [SAVE FAILED]', dto.items);
        } else {
          successItems.push(dto);
          console.log('✅ [SAVED] Item created:', dto.items);
        }
      } catch (err) {
        console.error('❌ [ERROR] Exception while saving item:', err);
        errorItems.push({ ...dto, reason: 'Exception while saving item: ' + err.message });
      }
    }

    console.log('📦 [SUMMARY]', {
      created: successItems.length,
      failed: errorItems.length,
    });

    return {
      status: successItems.length ? HttpStatus.CREATED : HttpStatus.CONFLICT,
      message:
        successItems.length && errorItems.length
          ? 'Bulk assets created successfully with some conflicts.'
          : successItems.length
            ? 'All assets created successfully.'
            : 'No new assets created. All entries had conflicts.',
      data: {
        created_count: successItems.length,
        created_items: successItems,
        error_items: errorItems,
      },
    };
  }

  
  // async generateItemTemplate(): Promise<Buffer> {
  //   enum ItemType {
  //     PHYSICAL = 'Physical',
  //     VIRTUAL = 'Virtual',
  //   }

  //   try {
  //     // Fetch category and sub-category data
  //     const categories = await this.assetCategoriesService.findAll();
  //     const subCategories = await this.assetSubCategoriesService.findAll();

  //     const categoryNames = categories.map((cat) =>
  //       cat.main_category_name.trim(),
  //     );

  //     // Group subcategories under their respective main categories
  //     const subCategoryMap = {};
  //     categories.forEach((cat) => {
  //       subCategoryMap[cat.main_category_name.trim()] = [];
  //     });

  //     subCategories.forEach((sub) => {
  //       const category = categories.find(
  //         (cat) => cat.main_category_id === sub.main_category_id,
  //       );
  //       if (category) {
  //         const categoryName = category.main_category_name.trim();
  //         if (!subCategoryMap[categoryName]) subCategoryMap[categoryName] = [];

  //         if (sub.sub_category_name && sub.sub_category_name.trim()) {
  //           subCategoryMap[categoryName].push(sub.sub_category_name.trim());
  //         }
  //       } else {
  //         console.log(
  //           `Category not found for main_category_id: ${sub.main_category_id}`,
  //         );
  //       }
  //     });

  //     const workbook = await XlsxPopulate.fromBlankAsync();
  //     const mainSheet = workbook.sheet(0);
  //     mainSheet.name('Items_template');
  //     const dataSheet = workbook.addSheet('Data');

  //     // 🟦 Instructions
  //     const instructions = [
  //       'Instructions:',
  //       '1. Fill in all required fields starting from row 7.',
  //       '2. "Category" and "Sub-Category" must be selected from dropdowns.',
  //       '3. Do not edit the header row (Row 6).',
  //       '4. Use "Yes"/"No" only in the Licensable field.',
  //       '5. Use "Physical"/"Virtual" for Item Type.',
  //     ];
  //     instructions.forEach((text, index) => {
  //       mainSheet
  //         .cell(index + 1, 1)
  //         .value(text)
  //         .style({
  //           bold: true,
  //           fontColor: '0000FF',
  //         });
  //     });

  //     // 🟨 Header row (Row 6), using user-pattern: label + required
  //     const headers = [
  //       { label: 'Category', required: true },
  //       { label: 'Sub-Category', required: true },
  //       { label: 'Item Name', required: true },
  //       { label: 'Item Description', required: false },
  //       { label: 'Is item Licensable ?', required: true },
  //       { label: 'Item Type', required: true },
  //     ];
  //     headers.forEach((item, index) => {
  //       const cell = mainSheet.cell(6, index + 1);
  //       const label = item.required ? `${item.label} *` : item.label;
  //       cell.value(label).style({
  //         bold: true,
  //         fontColor: item.required ? 'FF0000' : '000000', // Red for required
  //       });
  //     });

  //     // Column widths for clarity
  //     const columnWidths = [25, 25, 30, 40, 25, 20];
  //     columnWidths.forEach((width, index) => {
  //       mainSheet.column(index + 1).width(width);
  //     });

  //     const startRow = 7;
  //     const endRow = 1048576;

  //     // 🟧 Fill data sheet with categories in A, subcategories in B+
  //     categoryNames.forEach((catName, i) => {
  //       dataSheet.cell(i + 1, 1).value(catName);
  //       const subs = subCategoryMap[catName];
  //       if (subs) {
  //         subs.forEach((subName, j) => {
  //           if (subName && subName.trim()) {
  //             dataSheet.cell(i + 1, j + 2).value(subName.trim());
  //           }
  //         });
  //       }
  //     });

  //     // 🟩 Named Ranges for INDIRECT formula in Sub-Category
  //     categoryNames.forEach((catName, i) => {
  //       const safeName = catName.replace(/\s+/g, '_');
  //       const subs = subCategoryMap[catName];
  //       if (subs && subs.length > 0) {
  //         const startCol = 2;
  //         const endCol = startCol + subs.length - 1;

  //         const colLetter = (colNum: number) => {
  //           let temp = '';
  //           let n = colNum;
  //           while (n > 0) {
  //             let remainder = (n - 1) % 26;
  //             temp = String.fromCharCode(65 + remainder) + temp;
  //             n = Math.floor((n - 1) / 26);
  //           }
  //           return temp;
  //         };

  //         const startAddress = `${colLetter(startCol)}${i + 1}`;
  //         const endAddress = `${colLetter(endCol)}${i + 1}`;
  //         const range = `${dataSheet.name()}!${startAddress}:${endAddress}`;

  //         workbook.definedName(safeName, range);
  //       }
  //     });

  //     // 🟦 Data Validations
  //     mainSheet.range(`A${startRow}:A${endRow}`).dataValidation({
  //       type: 'list',
  //       allowBlank: false,
  //       showInputMessage: true,
  //       formula1: `=Data!$A$1:$A$${categoryNames.length}`,
  //     });

  //     mainSheet.range(`B${startRow}:B${endRow}`).dataValidation({
  //       type: 'list',
  //       allowBlank: false,
  //       showInputMessage: true,
  //       formula1: `=INDIRECT(SUBSTITUTE(A${startRow}," ","_"))`,
  //     });

  //     mainSheet.range(`E${startRow}:E${endRow}`).dataValidation({
  //       type: 'list',
  //       allowBlank: false,
  //       formula1: `"yes,No"`,
  //     });

  //     // ✅ New Item Type dropdown
  //     mainSheet.range(`F${startRow}:F${endRow}`).dataValidation({
  //       type: 'list',
  //       allowBlank: false,
  //       formula1: `"${ItemType.PHYSICAL},${ItemType.VIRTUAL}"`,
  //     });

  //     dataSheet.hidden(true);

  //     const buffer = await workbook.outputAsync();
  //     return buffer;
  //   } catch (error) {
  //     console.error('Error generating template:', error);
  //     throw new Error('Failed to generate Excel template');
  //   }
  // }

  // async bulkCreateItem(dtos: any[], user_id: number) {
  //   const newItems = [];
  //   const errorItems = [];
  //   const successItems = [];

  //   console.log('🔵 [START] bulkCreateItem called:', {
  //     total_dtos: dtos.length,
  //     user_id,
  //   });

  //   // ✅ Fetch all required references
  //   const existingItems = await this.assetItemRepository.find({
  //     where: { is_active: 1, is_deleted: 0 },
  //   });
  //   console.log('📦 [INFO] Existing items count:', existingItems.length);

  //   const existingCategory = await this.categoryepository.find({
  //     where: { is_active: 1, is_deleted: 0 },
  //   });
  //   const existingSubCategory = await this.subCategoryRepository.find({
  //     where: { is_active: 1, is_deleted: 0 },
  //   });

  //   // 🔁 Process each DTO
  //   for (const dto of dtos) {
  //     console.log('🔄 [PROCESSING] Incoming DTO:', dto);

  //     dto.added_by = user_id;

  //     // ✅ Resolve main_category_id
  //     const matchedCategory = existingCategory.find(
  //       (category) =>
  //         category.main_category_name?.trim().toLowerCase() ===
  //         dto.category?.trim().toLowerCase(),
  //     );
  //     dto.main_category_id = matchedCategory?.main_category_id || null;

  //     // ✅ Resolve sub_category_id
  //     const submatchedCategory = existingSubCategory.find(
  //       (subcategory) =>
  //         subcategory.sub_category_name?.trim().toLowerCase() ===
  //         dto.subcategory?.trim().toLowerCase(),
  //     );
  //     dto.sub_category_id = submatchedCategory?.sub_category_id || null;

  //     console.log('🧩 [MAPPED] Category IDs:', {
  //       main_category_id: dto.main_category_id,
  //       sub_category_id: dto.sub_category_id,
  //     });

  //     // ✅ Validation: Required fields
  //     if (!dto.main_category_id || !dto.sub_category_id || !dto.items) {
  //       errorItems.push({ ...dto, reason: 'Missing required fields' });
  //       console.warn('⚠️ [SKIPPED] Missing required fields');
  //       continue;
  //     }

  //     // ✅ Check for duplicate
  //     const isDuplicate = existingItems.find(
  //       (item) =>
  //         item.asset_item_name?.trim().toLowerCase() ===
  //           dto.items?.trim().toLowerCase() &&
  //         item.main_category_id === dto.main_category_id &&
  //         item.sub_category_id === dto.sub_category_id,
  //     );

  //     if (isDuplicate) {
  //       errorItems.push({ ...dto, reason: 'Duplicate item exists' });
  //       console.warn('⚠️ [SKIPPED] Duplicate item found:', dto.items);
  //       continue;
  //     }

  //     // ✅ Prepare and create item
  //     const newItem = this.assetItemRepository.create({
  //       asset_item_name: dto.items,
  //       asset_item_description: dto.description,
  //       is_licensable: dto.isLicensable,
  //       main_category_id: dto.main_category_id,
  //       sub_category_id: dto.sub_category_id,
  //       added_by: dto.added_by,
  //       item_type: dto.item_type, // ✅ Include item_type
  //     });

  //     try {
  //       const savedItem = await this.assetItemRepository.save(newItem);

  //       if (!savedItem) {
  //         errorItems.push({ ...dto, reason: 'Failed to save item' });
  //         console.error('❌ [SAVE FAILED]', dto.items);
  //       } else {
  //         successItems.push(dto);
  //         console.log('✅ [SAVED] Item created:', dto.items);
  //       }
  //     } catch (err) {
  //       console.error('❌ [ERROR] Exception while saving item:', err);
  //       errorItems.push({ ...dto, reason: 'Exception while saving item' });
  //     }
  //   }

  //   console.log('📦 [SUMMARY]', {
  //     created: successItems.length,
  //     failed: errorItems.length,
  //   });

  //   return {
  //     status: successItems.length ? HttpStatus.CREATED : HttpStatus.CONFLICT,
  //     message:
  //       successItems.length && errorItems.length
  //         ? 'Bulk assets created successfully with some conflicts.'
  //         : successItems.length
  //           ? 'All assets created successfully.'
  //           : 'No new assets created. All entries had conflicts.',
  //     data: {
  //       created_count: successItems.length,
  //       created_items: successItems,
  //       error_items: errorItems,
  //     },
  //   };
  // }

  // old method

  async fetchSingleAssetItemData(deleteAssetItemDto: DeleteAssetItemDto) {
    const { asset_item_id } = deleteAssetItemDto;

    // Validate if vendor_id is provided
    if (!asset_item_id) {
      throw new BadRequestException('Item ID is required');
    }

    try {
      const itemData = await this.assetItemRepository
        .createQueryBuilder('asset_items')

        .leftJoinAndSelect('asset_items.main_category', 'main_category')
        .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
        .leftJoinAndSelect(
          'asset_items.related_items',
          'related_items',
          'related_items.is_active = :related_is_active AND related_items.is_deleted = :related_is_deleted',
          { related_is_active: 1, related_is_deleted: 0 },
        )
        .leftJoinAndSelect('related_items.child_item', 'child_item')

        .where('asset_items.asset_item_id = :asset_item_id', { asset_item_id })
        .andWhere('asset_items.is_active = :is_active', { is_active: 1 })
        .andWhere('asset_items.is_deleted = :is_deleted', { is_deleted: 0 })

        .getOne();

      // // const assetItem = await this.assetItemRepository
      // .createQueryBuilder('asset_items')
      // .leftJoinAndSelect('asset_items.main_category', 'main_category')
      // .leftJoinAndSelect('asset_items.sub_category', 'sub_category')
      // .leftJoinAndSelect('asset_items.related_items', 'related_items') // Fetch related items
      // .leftJoinAndSelect('related_items.child_item', 'child_item') // Fetch child asset details
      // .where('asset_items.asset_item_id = :asset_item_id', { asset_item_id })
      // .andWhere('asset_items.is_active = :isActive', { isActive: 1 })
      // .andWhere('asset_items.is_deleted = :isDeleted', { isDeleted: 0 })
      // .getOne();

      // Check if the user exists
      if (!itemData) {
        return {
          status: 404,
          message: `Item with ID ${asset_item_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Item fetched successfully',
        data: { itemData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the Item',
        error: error.message,
      };
    }
  }

  async updateItemData(updateAssetItemdto: UpdateAssetItemDto) {
    const {
      asset_item_id,
      asset_item_name,
      asset_item_description,
      added_by,
      main_category_id,
      sub_category_id,
      item_type,
      asset_relation,
      is_licensable,
      has_depreciation,
        company_act_asset_life,
        it_act_asset_life,
          company_depreciation_rate,
         it_act_depreciation_rate,
          company_act_residual_value,
        it_act_residual_value,
    } = updateAssetItemdto;

    // Fetch the existing item
    const existingItem = await this.assetItemRepository.findOne({
      where: { asset_item_id: asset_item_id },
    });

    if (!existingItem) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: `Item with ID ${asset_item_id} not found`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Update the item data
    existingItem.asset_item_name = asset_item_name;
    existingItem.asset_item_description = asset_item_description || '';
    existingItem.main_category_id = main_category_id;
    existingItem.sub_category_id = sub_category_id;
    existingItem.item_type = item_type;
   
     existingItem.has_depreciation = has_depreciation;
      existingItem.company_act_asset_life = company_act_asset_life;
       existingItem.it_act_asset_life = it_act_asset_life;
        existingItem.company_depreciation_rate = company_depreciation_rate;
         existingItem.it_act_depreciation_rate = it_act_depreciation_rate;
          existingItem.company_act_residual_value = company_act_residual_value;
           existingItem.it_act_residual_value = it_act_residual_value;



    const updatedItem = await this.assetItemRepository.save(existingItem);

    // Handle asset_relation updates only if provided
    if (asset_relation) {
      // ✅ Check for duplicates in new relation list
      const duplicates = asset_relation.filter(
        (rel, idx, arr) =>
          arr.findIndex((x) => x.asset_item_id_2 === rel.asset_item_id_2) !==
          idx,
      );
      if (duplicates.length > 0) {
        throw new BadRequestException(
          'Duplicate asset item relations are not allowed.',
        );
      }

      const relationRepo = this.dataSource.getRepository(AssetItemsRelation);

      // Soft-delete existing relations
      const existingRelations = await relationRepo.find({
        where: {
          parent_asset_item_id: asset_item_id,
          is_active: 1,
          is_deleted: 0,
        },
      });

      if (existingRelations.length > 0) {
        existingRelations.forEach((relation) => {
          relation.is_active = 0;
          relation.is_deleted = 1;
        });
        await relationRepo.save(existingRelations);
      }

      // Insert new relations
      if (asset_relation.length > 0) {
        for (const relation_item of asset_relation) {
          const relationEntity = relationRepo.create({
            parent_asset_item_id: asset_item_id,
            child_asset_item_id: relation_item.asset_item_id_2,
            relation_type: relation_item.relation_type as RelationType,
            created_by: added_by,
          });

          await relationRepo.save(relationEntity);
        }
      }
    }

    return {
      status: HttpStatus.OK,
      message: 'Item updated successfully',
      data: {
        item: updatedItem,
      },
    };
  }

  async bulkDeleteItems(itemIds: number[]): Promise<any> {
    console.log('itemIds', itemIds);

    try {
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new BadRequestException(
          'No asset item IDs provided for deletion.',
        );
      }

      const results: {
        id: number;
        status: string;
        message?: string;
      }[] = [];

      const itemsToDelete: any[] = [];

      for (const id of itemIds) {
        const existingItem = await this.assetItemRepository.findOne({
          where: { asset_item_id: id },
        });

        if (!existingItem) {
          results.push({
            id,
            status: 'failed',
            message: `Item with ID ${id} not found.`,
          });
          continue;
        }

        itemsToDelete.push(existingItem);
        results.push({
          id,
          status: 'success',
        });
      }

      if (itemsToDelete.length > 0) {
        await this.assetItemRepository
          .createQueryBuilder()
          .update()
          .set({ is_active: 0, is_deleted: 1 })
          .where('asset_item_id IN (:...ids)', {
            ids: itemsToDelete.map((item) => item.asset_item_id),
          })
          .execute();
      }

      const failedDeletions = results.filter((r) => r.status === 'failed');
      const successDeletions = results.filter((r) => r.status === 'success');

      if (failedDeletions.length > 0) {
        const failedIds = failedDeletions.map((d) => d.id).join(', ');
        throw new BadRequestException({
          success: false,
          message: `Could not delete the following items: ${failedIds}`,
          details: failedDeletions,
        });
      }

      return {
        success: true,
        message: `${successDeletions.length} item${successDeletions.length > 1 ? 's' : ''} deleted successfully.`,
        details: results,
      };
    } catch (error) {
      console.error('Error in bulkDeleteItems:', error);
      console.log(
        'Failed Deletion Details:',
        JSON.stringify(error.response?.details || {}, null, 2),
      );
      throw new BadRequestException(
        error.message || 'An error occurred while deleting items.',
      );
    }
  }

  async getAssetItemWithRelations(assetItemId: number): Promise<any> {
    try {
      // Fetch the AssetItem details
      const assetItem = await this.assetItemRepository.findOne({
        where: { asset_item_id: assetItemId, is_active: 1, is_deleted: 0 },
        relations: ['main_category', 'sub_category'],
      });

      if (!assetItem) {
        throw new HttpException(
          `Asset Item with ID ${assetItemId} not found.`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Fetch all relations where the asset_item_id is either parent or child
      const relations = await this.dataSource
        .getRepository(AssetItemsRelation)
        .createQueryBuilder('relation')
        .leftJoinAndSelect('relation.parent_item', 'parent_item')
        .leftJoinAndSelect('relation.child_item', 'child_item')
        .where('relation.parent_asset_item_id = :assetItemId', { assetItemId })
        .orWhere('relation.child_asset_item_id = :assetItemId', { assetItemId })
        .getMany();

      // Return the combined result
      return {
        assetItem,
        relations,
      };
    } catch (error) {
      console.error('Error fetching asset item with relations:', error);
      throw new HttpException(
        'An error occurred while fetching asset item details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
