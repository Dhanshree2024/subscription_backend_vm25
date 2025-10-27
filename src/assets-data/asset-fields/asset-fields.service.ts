import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAssetFieldDto } from './dto/create-asset-field.dto';
import { UpdateAssetFieldDto } from './dto/update-asset-field.dto';
import { AssetField } from './entities/asset-field.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Repository } from 'typeorm';
import { AssetStatusTypes } from './entities/asset-status-types.entity';
import { AssetWorkingStatusTypes } from './entities/asset-working-status-types.entity';
import { AssetOwnershipStatusTypes } from './entities/asset-ownership-status-types.entity';
import { AssetFieldCategory } from './entities/asset-field-category.entity';
import { DeleteAssetFieldDto } from './dto/delete-asset-field.dto';
import * as XlsxPopulate from 'xlsx-populate';

@Injectable()
export class AssetFieldsService {
  constructor(
    @InjectRepository(AssetField)
    private assetFieldRepository: Repository<AssetField>,
    @InjectRepository(AssetStatusTypes)
    private assetStatusTypeRepository: Repository<AssetStatusTypes>,
    @InjectRepository(AssetWorkingStatusTypes)
    private assetWorkingStatusTypeRepository: Repository<AssetWorkingStatusTypes>,
    @InjectRepository(AssetOwnershipStatusTypes)
    private assetOwnershipStatusTypeRepository: Repository<AssetOwnershipStatusTypes>,

    @InjectRepository(AssetFieldCategory)
    private assetFieldCategoryRepository: Repository<AssetFieldCategory>,
  ) { }

async create(createAssetFieldDto: CreateAssetFieldDto) {
  try {
    createAssetFieldDto.created_at = new Date();
    createAssetFieldDto.is_custom_field = true;
    
    const savedItem = await this.assetFieldRepository.save(createAssetFieldDto);

    return {
      success: true,
      message: "Custom field created successfully",
      data: savedItem,
    };
  } catch (error) {
    console.error("Error in insert:", error);
    return {
      success: false,
      message: "An error occurred while inserting the item.",
    };
  }
}



  findAllFieldCategories() {
    try {
      return this.assetFieldCategoryRepository.find({
        order: {
          asset_field_category_name: 'ASC',
        },
        // where: {
        //   is_active: 1,
        //   is_deleted: 0,
        // },
      });
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async getAssetStatusTypes() {
    try {
      let whereCondition: any;
      whereCondition = { is_active: 1, is_deleted: 0 };

      const results = await this.assetStatusTypeRepository
        .createQueryBuilder('asset_status_types')
        .orderBy('status_type_name', 'ASC')
        .where(whereCondition)
        .getMany();

      return results;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async getAssetWorkingStatusType() {
    try {
      let whereCondition: any;
      whereCondition = { is_active: 1, is_deleted: 0 };

      const results = await this.assetWorkingStatusTypeRepository
        .createQueryBuilder('asset_working_status_types')
        .orderBy('working_status_type_name', 'ASC')
        .where(whereCondition)
        .getMany();

      return results;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async getAssetOwnershipStatusType() {
    try {
      let whereCondition: any;
      whereCondition = { is_active: 1, is_deleted: 0 };

      const results = await this.assetOwnershipStatusTypeRepository
        .createQueryBuilder('asset_ownership_status_types')
        .orderBy('ownership_status_type_name', 'ASC')
        .where(whereCondition)
        .getMany();

      return results;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async findAll() {
    try {
      // let whereCondition: any;
      // whereCondition = { is_active: 1 , is_deleted: 0};
      const whereCondition = { is_active: 1, is_deleted: 0 };
      const results = await this.assetFieldRepository
        .createQueryBuilder('asset_fields')
        .leftJoinAndSelect('asset_fields.category', 'category')
        .orderBy('asset_field_name', 'ASC')
        .where(whereCondition)
        .getMany();

      return results;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  countAll() {
    try {
      return this.assetFieldRepository.countBy({
        is_active: 1,
        is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async fetchSingleFieldData(deleteAssetFieldDto: DeleteAssetFieldDto) {
    const { asset_field_id } = deleteAssetFieldDto;

    console.log('Asset Field ID payload:', asset_field_id);

    // Validate if user_id is provided
    if (!asset_field_id) {
      throw new BadRequestException('Asset Field ID is required');
    }

    try {
      let whereCondition = {
        asset_field_id: asset_field_id,
        is_active: 1,
        is_deleted: 0,
      };
      // Fetch user data with related tables using QueryBuilder
      const fieldData = await this.assetFieldRepository
        .createQueryBuilder('asset_fields')
        .leftJoinAndSelect('asset_fields.category', 'category')
        .orderBy('asset_field_name', 'ASC')
        .where(whereCondition)
        .getOne();

      // Check if the user exists
      if (!fieldData) {
        return {
          status: 404,
          message: `Field with ID ${asset_field_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Field fetched successfully',
        data: { fieldData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the user',
        error: error.message,
      };
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} assetField`;
  }

  update(id: number, updateAssetFieldDto: UpdateAssetFieldDto) {
    return `This action updates a #${id} assetField`;
  }

  remove(id: number) {
    return `This action removes a #${id} assetField`;
  }

  async fetchOrganizationAllAssetFields2(searchQuery: string): Promise<any> {
    try {
      let whereCondition = { is_active: 1, is_deleted: 0 };

      if (searchQuery && searchQuery.trim() !== '') {
        whereCondition['asset_field_name'] = ILike(`%${searchQuery}%`);
      }

      const results = await this.assetFieldRepository
        .createQueryBuilder('asset_fields')
        .leftJoinAndSelect('asset_fields.category', 'category')
        .where(whereCondition)
        .orderBy('asset_fields.asset_field_name', 'ASC')
        .getMany();

      if (!results || results.length === 0) {
        throw new BadRequestException(
          'No organizational fields found with the specified criteria.',
        );
      }
      console.log('FIELDS IN BACKEND2');
      return { data: results }; // ✅ No pagination fields in response
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Error fetching vendors: ${error.message}`);
    }
  }

  // async getOrganizationAssetFields2(
  //   searchQuery?: string,
  //   customFilters: Record<string, any> = {},
  //   sortOrder?: string,
  // ) {
  //   try {
  //     const query = this.assetFieldRepository
  //       .createQueryBuilder('asset_fields')
  //       .leftJoinAndSelect('asset_fields.category', 'category') // ✅ Fix here
  //       .where('asset_fields.is_active = :isActive AND asset_fields.is_deleted = :isDeleted', {
  //         isActive: 1,
  //         isDeleted: 0,
  //       });

  //     // Search
  //     if (searchQuery?.trim()) {
  //       query.andWhere(
  //         `(LOWER(asset_fields.asset_field_name) LIKE :search OR 
  //           LOWER(asset_fields.asset_field_description) LIKE :search OR 
  //           LOWER(asset_fields.asset_field_label_name) LIKE :search OR
  //           LOWER(category.asset_field_category_name) LIKE :search)`, // ✅ add category search
  //           { search: `%${searchQuery.toLowerCase()}%` }
  //       );
  //     }


  //     // Custom filters
  //     for (const [key, value] of Object.entries(customFilters)) {
  //       if (value === undefined || value === null || value === '' || key === 'sortOrder') continue;

  //       if (typeof value === 'object' && value.from && value.to) {
  //         query.andWhere(`asset_fields.${key} BETWEEN :from_${key} AND :to_${key}`, {
  //           [`from_${key}`]: value.from,
  //           [`to_${key}`]: value.to,
  //         });
  //       } else {
  //         query.andWhere(`CAST(asset_fields.${key} AS TEXT) ILIKE :${key}`, {
  //           [key]: `%${value}%`,
  //         });
  //       }
  //     }

  //     // Sorting
  //     if (sortOrder) {
  //       const [field, direction = 'ASC'] = sortOrder.split(':');
  //       query.orderBy(`asset_fields.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
  //     } else {
  //       query.orderBy('asset_fields.asset_field_name', 'ASC');
  //     }

  //     const results = await query.getMany();

  //     if (!results.length) return {};

  //     // Group by category
  //     const groupedResults = results.reduce((grouped, item) => {
  //       console.log("item", item)


  //       const category = item.category;
  //       const categoryId = category?.asset_field_category_id;

  //       if (!categoryId) return grouped;

  //       if (!grouped[categoryId]) {
  //         grouped[categoryId] = {
  //           category,
  //           items: [],
  //         };
  //       }
  //       grouped[categoryId].items.push(item);

  //       return grouped;
  //     }, {});

  //     return groupedResults;
  //   } catch (error) {
  //     console.error('Error in getOrganizationAssetFields2:', error);
  //     throw new Error('An error occurred while fetching organization asset fields.');
  //   }
  // }


  // SEARCHING AND SORTING FEATURE REQUIRED SERVICES


  async fetchOrganizationAllAssetFields(
    searchQuery: string,
    customFilters?: Record<string, any>,
  ): Promise<any> {
    try {
      let queryBuilder = this.assetFieldRepository
        .createQueryBuilder('asset_fields')

      // Base filters
      queryBuilder = queryBuilder
        .where('asset_fields.is_active = :isActive', { isActive: 1 })
        .andWhere('asset_fields.is_deleted = :isDeleted', { isDeleted: 0 });

      // Search
      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder = queryBuilder.andWhere(
          `(
              asset_fields.asset_field_name ILIKE :search OR
              asset_fields.asset_field_label_name ILIKE :search OR
              category.asset_field_category_name ILIKE :search
            )`,
          { search: `%${searchQuery}%` },
        );
      }


      // Allowed filters
      const allowedFilters = [
        'asset_field_name',
        'asset_field_description',
        'asset_field_label_name',
        'asset_field_type_details',
        'asset_field_type',
        'parent_organization_id',
        'added_by',
        'created_at',
        'updated_at',
        'main_category_name',
      ];

      // Dynamic filters
      if (customFilters && Object.keys(customFilters).length > 0) {
        for (const [key, value] of Object.entries(customFilters)) {
          if (
            !allowedFilters.includes(key) ||
            value === undefined ||
            value === null ||
            value === '' ||
            key === 'sortOrder'
          ) {
            continue;
          }

          // Date range
          if (typeof value === 'object' && value.from && value.to) {
            queryBuilder = queryBuilder.andWhere(
              `asset_fields.${key} BETWEEN :from_${key} AND :to_${key}`,
              {
                [`from_${key}`]: value.from,
                [`to_${key}`]: value.to,
              },
            );
          } else if (key === 'main_category_name') {
            queryBuilder = queryBuilder.andWhere(
              'category.main_category_name ILIKE :mainCategoryName',
              { mainCategoryName: `%${value}%` },
            );
          } else {
            queryBuilder = queryBuilder.andWhere(
              `CAST(asset_fields.${key} AS TEXT) ILIKE :${key}`,
              { [key]: `%${value}%` },
            );
          }
        }
      }

      // Sorting
      let sortField = 'asset_fields.asset_field_name';
      let sortDirection: 'ASC' | 'DESC' = 'ASC';

      if (customFilters?.sortOrder) {
        const sortOrder = customFilters.sortOrder.toLowerCase();
        if (sortOrder === 'desc') {
          sortDirection = 'DESC';
        } else if (sortOrder === 'asc') {
          sortDirection = 'ASC';
        } else if (sortOrder === 'newest') {
          sortField = 'asset_fields.created_at';
          sortDirection = 'DESC';
        } else if (sortOrder === 'oldest') {
          sortField = 'asset_fields.created_at';
          sortDirection = 'ASC';
        }
      }

      const [results, total] = await queryBuilder
        .orderBy(sortField, sortDirection)
        .getManyAndCount();


        console.log("result", results, results.length)

        const customFields = results.filter(
      (field) => field.is_custom_field !== null,
    );
    const defaultFields = results.filter(
      (field) => field.is_custom_field === null,
    );

      return {
        customFields,
        defaultFields,
        total,
      };
    } catch (error) {
      console.error('Error fetching organization asset fields:', error);
      throw new BadRequestException(
        `Error fetching organization asset fields: ${error.message}`,
      );
    }
  }


  async exportFilteredExcelForAssetFields({
    search,
    filters,
  }: {
    search?: string;
    filters?: Record<string, any>;
  }): Promise<Buffer> {
    const queryBuilder = this.assetFieldRepository
      .createQueryBuilder('asset_fields')
      .leftJoinAndSelect('asset_fields.category', 'category');

    // Base filters
    queryBuilder
      .where('asset_fields.is_active = :isActive', { isActive: 1 })
      .andWhere('asset_fields.is_deleted = :isDeleted', { isDeleted: 0 });

    // Search condition
    if (search && search.trim() !== '') {
      queryBuilder.andWhere(
        '(asset_fields.asset_field_name ILIKE :search OR category.main_category_name ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Allowed filters
    const allowedFilters = [
      'asset_field_name',
      'asset_field_description',
      'asset_field_label_name',
      'asset_field_type_details',
      'asset_field_type',
      'asset_field_category_id',
      'parent_organization_id',
      'added_by',
      'created_at',
      'updated_at',
      'main_category_name',
    ];

    // Dynamic filters
    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        if (
          !allowedFilters.includes(key) ||
          value === undefined ||
          value === null ||
          value === '' ||
          key === 'sortOrder'
        ) {
          continue;
        }

        if (typeof value === 'object' && value.from && value.to) {
          queryBuilder.andWhere(
            `asset_fields.${key} BETWEEN :from_${key} AND :to_${key}`,
            {
              [`from_${key}`]: value.from,
              [`to_${key}`]: value.to,
            },
          );
        } else if (key === 'main_category_name') {
          queryBuilder.andWhere(
            'category.main_category_name ILIKE :mainCategoryName',
            { mainCategoryName: `%${value}%` },
          );
        } else {
          queryBuilder.andWhere(
            `CAST(asset_fields.${key} AS TEXT) ILIKE :${key}`,
            { [key]: `%${value}%` },
          );
        }
      }
    }

    // Sorting
    let sortField = 'asset_fields.asset_field_name';
    let sortDirection: 'ASC' | 'DESC' = 'ASC';

    if (filters?.sortOrder) {
      const sortOrder = filters.sortOrder.toLowerCase();
      if (sortOrder === 'desc') {
        sortDirection = 'DESC';
      } else if (sortOrder === 'asc') {
        sortDirection = 'ASC';
      } else if (sortOrder === 'newest') {
        sortField = 'asset_fields.created_at';
        sortDirection = 'DESC';
      } else if (sortOrder === 'oldest') {
        sortField = 'asset_fields.created_at';
        sortDirection = 'ASC';
      }
    }

    queryBuilder.orderBy(sortField, sortDirection);

    const results = await queryBuilder.getMany();

    // Excel generation
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name('Asset Fields');

    const headers = [
      'Sr. No.',
      'Asset Field Name',
      'Label Name',
      'Type',
      'Type Details',
      'Description',
      'Main Category',
      'Created At',
    ];

    headers.forEach((header, i) => {
      sheet.cell(1, i + 1).value(header).style({ bold: true });
    });

    results.forEach((item, index) => {
      sheet.cell(index + 2, 1).value(index + 1);
      sheet.cell(index + 2, 2).value(item.asset_field_name || '');
      sheet.cell(index + 2, 3).value(item.asset_field_label_name || '');
      sheet.cell(index + 2, 4).value(item.asset_field_type || '');
      sheet.cell(index + 2, 5).value(item.asset_field_type_details || '');
      sheet.cell(index + 2, 6).value(item.asset_field_description || '');
      sheet.cell(index + 2, 8).value(item.created_at?.toISOString() || '');
    });

    return await workbook.outputAsync();
  }


  getFilterableColumns() {
    return [
      {
        key: 'asset_field_category_id',
        label: 'field Category Name',
        type: 'select',
        mandatory: false,
      },
      // {
      //   key: 'asset_field_name',
      //   label: 'Field Name',
      //   type: 'text',
      //   mandatory: true,
      // },
      // {
      //   key: 'is_active',
      //   label: 'Active',
      //   type: 'boolean',
      //   mandatory: false,
      // },
      // {
      //   key: 'is_deleted',
      //   label: 'Deleted',
      //   type: 'boolean',
      //   mandatory: false,
      // },
      // {
      //   key: 'parent_organization_id',
      //   label: 'Parent Organization ID',
      //   type: 'number',
      //   mandatory: false,
      // },
      // {
      //   key: 'added_by',
      //   label: 'Added By (User ID)',
      //   type: 'number',
      //   mandatory: false,
      // },
      {
        key: 'created_at',
        label: 'Created At',
        type: 'date-range',
        mandatory: false,
      },
      // {
      //   key: 'updated_at',
      //   label: 'Updated At',
      //   type: 'date-range',
      //   mandatory: false,
      // },
    ];
  }

  async getAssetFieldCategoryDropdown() {
    const categories = await this.assetFieldCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });
    return categories.map((cat) => ({
      label: cat.asset_field_category_name,
      // value: cat.asset_field_category_id,
    }));
  }



}
