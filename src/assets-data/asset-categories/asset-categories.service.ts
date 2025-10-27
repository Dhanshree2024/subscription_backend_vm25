import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ILike, Repository, DataSource } from 'typeorm';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto';
import { AssetCategory } from './entities/asset-category.entity';
 
import { AssetSubcategory } from '../asset-subcategories/entities/asset-subcategory.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import * as XlsxPopulate from 'xlsx-populate';
 
@Injectable()
export class AssetCategoriesService {
  constructor(
    @InjectRepository(AssetCategory) // Inject the DatabaseService
    private assetCategoryRepository: Repository<AssetCategory>,

    @InjectRepository(AssetSubcategory)
    private assetSubCategoryRepository: Repository<AssetSubcategory>,

    private readonly dataSource: DataSource,
  ) {}

  getFilterableColumns() {
    return [
      {
        key: 'main_category_id',
        label: 'Category',
        type: 'select',
        mandatory: false,
      },
      // {
      //   key: 'is_active',
      //   label: 'Active',
      //   type: 'integer',
      //   mandatory: false,
      // },
      //  {
      //   key: 'is_deleted',
      //   label: 'Deactive',
      //   type: 'integer',
      //   mandatory: false,
      // },
      // { key: 'main_category_description', label: 'Description', type: 'text' },
      // { key: 'parent_organization_id', label: 'Parent Org ID', type: 'number' },
      // { key: 'added_by', label: 'Added By (User ID)', type: 'number' },
      { key: 'created_at', label: 'Created At', type: 'date-range' },
      // { key: 'updated_at', label: 'Updated At', type: 'date-range' },
    ];
  }

  async getAllCategories(
    page: number,
    limit: number,
    searchQuery: string,
    customFilters?: Record<string, any>,
  ): Promise<any> {
    console.log('customFilters', customFilters);

    try {
      let queryBuilder = this.assetCategoryRepository.createQueryBuilder(
        'asset_main_category',
      );

      // Base filters
      queryBuilder = queryBuilder
        .where('asset_main_category.is_active = :isActive', { isActive: 1 })
        .andWhere('asset_main_category.is_deleted = :isDeleted', {
          isDeleted: 0,
        });

      // Search
      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder = queryBuilder.andWhere(
          'asset_main_category.main_category_name ILIKE :search',
          { search: `%${searchQuery}%` },
        );
      }

      // Dynamic custom filters
      if (customFilters && Object.keys(customFilters).length > 0) {
        for (const [key, value] of Object.entries(customFilters)) {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            key === 'sortOrder'
          )
            continue;

          // Handle date-range
          if (typeof value === 'object' && value.from && value.to) {
            queryBuilder = queryBuilder.andWhere(
              `asset_main_category.${key} BETWEEN :from_${key} AND :to_${key}`,
              {
                [`from_${key}`]: value.from,
                [`to_${key}`]: value.to,
              },
            );
          } else {
            // Generic filter (text/number match)
            queryBuilder = queryBuilder.andWhere(
              `CAST(asset_main_category.${key} AS TEXT) ILIKE :${key}`,
              { [key]: `%${value}%` },
            );
          }
        }
      }

      // Sorting logic
      let sortField = 'asset_main_category.main_category_name';
      let sortDirection: 'ASC' | 'DESC' = 'ASC';

      if (customFilters?.sortOrder) {
        const sortOrder = customFilters.sortOrder.toLowerCase();
        if (sortOrder === 'desc') {
          sortDirection = 'DESC';
        } else if (sortOrder === 'asc') {
          sortDirection = 'ASC';
        } else if (sortOrder === 'newest') {
          sortField = 'asset_main_category.created_at';
          sortDirection = 'DESC';
        } else if (sortOrder === 'oldest') {
          sortField = 'asset_main_category.created_at';
          sortDirection = 'ASC';
        }
      }

      // Pagination and final query
      const [results, total] = await queryBuilder
        .orderBy(sortField, sortDirection)
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new BadRequestException(
        `Error fetching asset categories: ${error.message}`,
      );
    }
  }

  async getMainCategoryDropdown() {
    const categories = await this.assetCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    return categories.map((cat) => ({
      label: cat.main_category_name,
      value: cat.main_category_id,
    }));
  }

  async exportFilteredExcelFromFilters(
    searchQuery: string,
    customFilters: Record<string, any>,
  ): Promise<Buffer> {
    // console.log('🔹 Step 1 | searchQuery:', searchQuery);
    // console.log('🔹 Step 2 | customFilters:', customFilters);

    try {
      // 🔹 Step 3 | Initialize QueryBuilder
      let queryBuilder = this.assetCategoryRepository.createQueryBuilder(
        'asset_main_category',
      );
      // console.log('✅ Step 3.1 | Base QueryBuilder initialized');

      queryBuilder = queryBuilder
        .where('asset_main_category.is_active = :isActive', { isActive: 1 })
        .andWhere('asset_main_category.is_deleted = :isDeleted', {
          isDeleted: 0,
        });

      // 🔹 Step 4 | Apply search query if provided
      if (searchQuery?.trim()) {
        // console.log(
        //   '✅ Step 4.1 | Applying search filter for main_category_name',
        // );
        queryBuilder = queryBuilder.andWhere(
          'asset_main_category.main_category_name ILIKE :search',
          { search: `%${searchQuery}%` },
        );
      }

      // 🔹 Step 5 | Apply dynamic filters
      if (customFilters && Object.keys(customFilters).length > 0) {
        // console.log('🔹 Step 5.1 | Applying dynamic filters...');
        for (const [key, value] of Object.entries(customFilters)) {
          // console.log(`➡️ Processing filter | key: ${key}, value:`, value);

          if (!value || key === 'sortOrder') {
            // console.log(`⏭️ Skipping key "${key}" (empty or reserved)`);
            continue;
          }

          // Range filter
          if (typeof value === 'object' && value.from && value.to) {
            // console.log(
            //   `📆 Applying range filter for "${key}": ${value.from} to ${value.to}`,
            // );
            queryBuilder = queryBuilder.andWhere(
              `asset_main_category.${key} BETWEEN :from_${key} AND :to_${key}`,
              {
                [`from_${key}`]: value.from,
                [`to_${key}`]: value.to,
              },
            );
          }

          // Exact match for IDs
          else if (key === 'main_category_id') {
            // console.log(
            //   `🔍 Applying exact match for "main_category_id" = ${value}`,
            // );
            queryBuilder = queryBuilder.andWhere(
              `asset_main_category.main_category_id = :main_category_id`,
              { main_category_id: value },
            );
          }

          // Text match for others
          else {
            // console.log(
            //   `🔡 Applying partial match (ILIKE) for "${key}" = ${value}`,
            // );
            queryBuilder = queryBuilder.andWhere(
              `CAST(asset_main_category.${key} AS TEXT) ILIKE :${key}`,
              { [key]: `%${value}%` },
            );
          }
        }
      }

      // 🔹 Step 6 | Apply sort order
      let sortField = 'asset_main_category.main_category_name';
      let sortDirection: 'ASC' | 'DESC' = 'ASC';

      if (customFilters?.sortOrder) {
        const order = customFilters.sortOrder.toLowerCase();
        // console.log('🔃 Step 6.1 | Applying sortOrder:', order);

        if (order === 'desc') sortDirection = 'DESC';
        else if (order === 'asc') sortDirection = 'ASC';
        else if (order === 'newest') {
          sortField = 'asset_main_category.created_at';
          sortDirection = 'DESC';
        } else if (order === 'oldest') {
          sortField = 'asset_main_category.created_at';
          sortDirection = 'ASC';
        }
      }

      // 🔹 Step 7 | Final Query Debug
      // console.log('🛠️ Step 7 | Final SQL:', queryBuilder.getSql());
      // console.log(
      //   '🛠️ Step 7 | Final Parameters:',
      //   queryBuilder.getParameters(),
      // );

      // 🔹 Step 8 | Execute query
      const data = await queryBuilder
        .orderBy(sortField, sortDirection)
        .getMany();
      // console.log('📦 Step 8 | Data fetched:', data.length, 'records');

      // console.log("data",data)

      // 🔹 Step 9 | Excel generation
      const workbook = await XlsxPopulate.fromBlankAsync();
      const sheet = workbook.sheet(0);

      const headers = ['Sr No', 'Main Category Name'];
      headers.forEach((title, i) => {
        sheet
          .cell(1, i + 1)
          .value(title)
          .style({ bold: true });
      });
      sheet.column(1).width(10); // Sr No
      sheet.column(2).width(20); // Main Category Name

      data.forEach((item, index) => {
        const row = index + 2;
        sheet.cell(row, 1).value(index + 1);
        sheet.cell(row, 2).value(item.main_category_name);
      });

      console.log('📄 Step 10 | Excel sheet created successfully');

      // 🔹 Step 11 | Output Excel
      return await workbook.outputAsync();
    } catch (error) {
      console.error(
        '❌ Error exporting Excel | Location: exportFilteredExcelFromFilters',
      );
      console.error(error);
      throw new BadRequestException('Failed to export Excel');
    }
  }

  ///// V restricting duplicates
  async create(createAssetCategoryDto: any) {
    try {
      const successCategories = [];
      const errorCategories = [];

      const normalizedInput = createAssetCategoryDto.main_category_name
        .replace(/\s+/g, '')
        .toLowerCase();

      const existing = await this.assetCategoryRepository
        .createQueryBuilder('category')
        .where(
          "REPLACE(LOWER(category.main_category_name), ' ', '') = :normalizedName",
          {
            normalizedName: normalizedInput,
          },
        )
        .andWhere('category.is_deleted = :isDeleted', { isDeleted: 0 })
        .getOne();

      if (existing) {
        errorCategories.push({
          ...createAssetCategoryDto,
          error: 'Category with this name already exists.',
        });

        return {
          status: HttpStatus.CONFLICT,
          message: 'Category already exists.',
          data: {
            created_count: 0,
            created_categories: [],
            error_categories: errorCategories,
          },
        };
      } else {
        const now = new Date();
        const newCategory = this.assetCategoryRepository.create({
          main_category_name: createAssetCategoryDto.main_category_name,
          main_category_description:
            createAssetCategoryDto.main_category_description || '',
          parent_organization_id:
            createAssetCategoryDto.parent_organization_id || 0,
          is_active: 1,
          is_deleted: 0,
          created_at: now,
          updated_at: now,
          added_by: createAssetCategoryDto.added_by,
        });

        await this.assetCategoryRepository.save(newCategory);
        successCategories.push(createAssetCategoryDto);
      }

      return {
        status: successCategories.length
          ? HttpStatus.CREATED
          : HttpStatus.CONFLICT,
        message:
          successCategories.length && errorCategories.length
            ? 'Category created with some errors.'
            : successCategories.length
              ? 'Category created successfully.'
              : 'No category created. All entries failed.',
        data: {
          created_count: successCategories.length,
          created_categories: successCategories,
          error_categories: errorCategories,
        },
      };
    } catch (error) {
      console.error('Error in insert:', error);
      throw error;
    }
  }

  async generateCategoryTemplate(): Promise<Buffer> {
    try {
      // Create workbook and sheets
      const workbook = await XlsxPopulate.fromBlankAsync();
      const mainSheet = workbook.sheet(0).name('main_category_template');
      // const dataSheet = workbook.addSheet('Data');

      // Add instruction rows in the top 5 rows
      const instructions = [
        'Instructions:',
        '1. Fill in all required fields starting from row 7.',
        '2. "Main Category Name" is mandatory and must be unique.',
        '3. Avoid using special characters in names.',
        '4. Do not modify the header row (Row 6).',
      ];

      instructions.forEach((text, index) => {
        mainSheet
          .cell(index + 1, 1)
          .value(text)
          .style({
            bold: true,
            fontColor: '0000FF', // Blue
          });
      });

      // Define headers at row 6
      const headers = ['Main Category Name', 'Main Category Description'];
      headers.forEach((header, index) => {
        mainSheet
          .cell(6, index + 1)
          .value(header)
          .style({ bold: true });
      });

      const startRow = 7;
      const endRow = 1048576;

      // Pre-fill an example entry (optional)
      mainSheet.cell(startRow, 1).value('Example Category');
      mainSheet
        .cell(startRow, 2)
        .value('This is a sample category description');

      // Hide the data sheet
      // dataSheet.hidden(true);

      // Return buffer
      const buffer = await workbook.outputAsync();
      return buffer;
    } catch (error) {
      console.error('Error generating main category template:', error);
      throw new Error('Failed to generate main category Excel template');
    }
  }

  async bulkCreateCategories(dtos: any[], user_id: number) {
    console.log('📥 Received DTOs for bulk category creation:', dtos);

    const successCategories = [];
    const errorCategories = [];
    const newCategories = [];

    const userExists = await this.dataSource
      .getRepository(User)
      .findOne({ where: { register_user_login_id: user_id } });

    if (!userExists) {
      console.error('❌ User not found for user_id:', user_id);
      throw new Error('User does not exist');
    }

    // Fetch existing active, non-deleted categories
    const existingCategories = await this.assetCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    for (const dto of dtos) {
      dto.added_by = user_id;

      // Validate required field
      if (!dto.main_category_name?.trim()) {
        errorCategories.push({
          ...dto,
          reason: 'Main Category Name is required',
        });
        continue;
      }

      // Check for duplicate category
      const existingMatch = existingCategories.find(
        (cat) =>
          cat.main_category_name?.trim().toLowerCase() ===
          dto.main_category_name?.trim().toLowerCase(),
      );

      if (existingMatch) {
        errorCategories.push({
          ...dto,
          reason: 'Duplicate category name',
          existing_entry: {
            id: existingMatch.main_category_id,
            name: existingMatch.main_category_name,
            description: existingMatch.main_category_description,
            created_at: existingMatch.created_at,
          },
        });
        continue;
      }

      const now = new Date();
      const newCategory = this.assetCategoryRepository.create({
        main_category_name: dto.main_category_name,
        main_category_description: dto.main_category_description || '',
        parent_organization_id: dto.parent_organization_id || 0,
        is_active: 1,
        is_deleted: 0,
        created_at: now,
        updated_at: now,
        added_by: userExists.user_id,
      });

      newCategories.push({ dto, newCategory });
    }

    // Save all valid new categories
    try {
      const toSave = newCategories.map((entry) => entry.newCategory);
      const savedCategories = await this.assetCategoryRepository.save(toSave);

      savedCategories.forEach((saved, index) => {
        successCategories.push(newCategories[index].dto);
      });
    } catch (error) {
      console.error('❌ Error during bulk save:', error);
      newCategories.forEach((entry) =>
        errorCategories.push({ ...entry.dto, reason: 'Batch save error' }),
      );
    }

    return {
      status: successCategories.length
        ? HttpStatus.CREATED
        : HttpStatus.CONFLICT,
      message:
        successCategories.length && errorCategories.length
          ? 'Bulk categories created with some conflicts.'
          : successCategories.length
            ? 'All categories created successfully.'
            : 'No categories created. All entries had conflicts.',
      data: {
        created_count: successCategories.length,
        created_categories: successCategories,
        error_categories: errorCategories,
      },
    };
  }

  countAll() {
    try {
      return this.assetCategoryRepository.countBy({
        parent_organization_id: 1,
        is_active: 1,
        is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  findAll() {
    try {
      return this.assetCategoryRepository.find({
        order: {
          main_category_name: 'ASC',
        },
        where: {
          is_active: 1,
          is_deleted: 0,
        },
      });
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async deleteCategory(createAssetCategoryDto: CreateAssetCategoryDto) {
    try {
      const existingUser = await this.assetCategoryRepository.findOneBy({
        main_category_id: createAssetCategoryDto.main_category_id,
      });
      const existingSubCategory =
        await this.assetSubCategoryRepository.findOneBy({
          main_category_id: createAssetCategoryDto.main_category_id,
          is_active: 1,
        });

      if (!existingUser) {
        return 'Category not found for deletion.';
      }

      if (existingSubCategory) {
        return 'Subcategory Exists! Unable to delete category.';
      }

      existingUser.is_active = 0;
      existingUser.is_deleted = 1;

      const savedUser = await this.assetCategoryRepository.save(existingUser);
      return savedUser;
    } catch (error) {
      // Log the error and include it in the response for better debugging
      console.error('Error in deleteCategory:', error.message);
      throw new Error(
        error.message || 'An error occurred while deleting the category.',
      );
    }
  }

  async bulkDeleteCategories(categoryIds: number[]): Promise<any> {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new BadRequestException('No category IDs provided for deletion.');
      }

      const results: {
        id: number;
        status: string;
        message?: string;
        name?: string;
      }[] = [];

      const categoriesToDelete: any[] = [];

      for (const id of categoryIds) {
        const existingCategory = await this.assetCategoryRepository.findOneBy({
          main_category_id: id,
        });

        if (!existingCategory) {
          results.push({
            id,
            status: 'failed',
            message: 'Category not found.',
            name: `ID ${id}`,
          });
          continue;
        }

        const existingSubCategory =
          await this.assetSubCategoryRepository.findOneBy({
            main_category_id: id,
            is_active: 1,
          });

        if (existingSubCategory) {
          results.push({
            id,
            status: 'failed',
            message: 'Subcategory exists. Deletion not allowed.',
            name: existingCategory.main_category_name, // from parent
          });
          continue;
        }

        categoriesToDelete.push(existingCategory);
        results.push({
          id,
          status: 'success',
          name: existingCategory.main_category_name,
        });
      }

      if (categoriesToDelete.length > 0) {
        await this.assetCategoryRepository
          .createQueryBuilder()
          .update()
          .set({ is_active: 0, is_deleted: 1 })
          .where('main_category_id IN (:...ids)', {
            ids: categoriesToDelete.map((c) => c.main_category_id),
          })
          .execute();
      }

      const failedDeletions = results.filter((r) => r.status === 'failed');
      const successDeletions = results.filter((r) => r.status === 'success');

      if (failedDeletions.length > 0) {
        const failedNames = failedDeletions.map((d) => d.name).join(', ');
        throw new BadRequestException({
          success: false,
          message: `Could not delete the following categories: ${failedNames}`,
          details: failedDeletions,
        });
      }

      return {
        success: true,
        message: `${successDeletions.length} categor${
          successDeletions.length > 1 ? 'ies' : 'y'
        } deleted successfully.`,
        details: results,
      };
    } catch (error) {
      console.error('Error in bulkDeleteCategories:', error);
      console.log(
        'Failed Deletion Details:',
        JSON.stringify(error.response.details, null, 2),
      );
      throw new BadRequestException(
        error.message || 'An error occurred while deleting categories.',
      );
    }
  }

  async update(id: number, updateAssetCategoryDto: UpdateAssetCategoryDto) {
    // Ensure that the asset_id exists
    if (!id) {
      throw new Error('Department ID Not Present');
    }

    // Find the existing asset data by its asset_id
    const existingAsset = await this.assetCategoryRepository.findOneBy({
      main_category_id: id,
    });

    // If the asset does not exist, throw an error
    if (!existingAsset) {
      throw new Error('Department not found for updating.');
    }

    // Merge the update data with the existing asset data
    Object.assign(existingAsset, updateAssetCategoryDto);

    // Save the updated asset data
    const updatedAsset = await this.assetCategoryRepository.save(existingAsset);

    return updatedAsset;
  }

  async fetchSingleAssetCategoryData(
    deleteAssetSubCategoryDto: CreateAssetCategoryDto,
  ) {
    const { main_category_id } = deleteAssetSubCategoryDto;

    // Validate if vendor_id is provided
    if (!main_category_id) {
      throw new BadRequestException('Category ID is required');
    }

    try {
      const categoryData = await this.assetCategoryRepository
        .createQueryBuilder('asset_main_category')
        .where('asset_main_category.main_category_id = :main_category_id', {
          main_category_id,
        })
        .andWhere('asset_main_category.is_active = :is_active', {
          is_active: 1,
        })
        .andWhere('asset_main_category.is_deleted = :is_deleted', {
          is_deleted: 0,
        })
        .getOne();

      // Check if the user exists
      if (!categoryData) {
        return {
          status: 404,
          message: `Main Category with ID ${main_category_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Category fetched successfully',
        data: { categoryData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the Item',
        error: error.message,
      };
    }
  }

  async exportCategoryCSV() {
    try {
      const whereCondition = { is_active: 1, is_deleted: 0 };

      const [results, total] = await this.assetCategoryRepository
        .createQueryBuilder('category')
        .where(whereCondition)
        .orderBy('category.main_category_id', 'DESC')
        .leftJoinAndSelect('category.added_by_user', 'added_by_user') // created_by

        .getManyAndCount();

      const decodedResults = results.map((category) => ({
        'Category Name': category.main_category_name,
        Description: category.main_category_description || '',
        'Parent Organization': category.parent_organization_id || '',
        'Added By': category.added_by_user || '',
        'Created At': category.created_at
          ? new Date(category.created_at).toLocaleDateString()
          : '',
        'Updated At': category.updated_at
          ? new Date(category.updated_at).toLocaleDateString()
          : '',
      }));
      return { decodedResults };
    } catch (error) {
      console.error('Error in exportSubcategoryCSV:', error);
      throw new Error('An error occurred while fetching subcategories.');
    }
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
}
 