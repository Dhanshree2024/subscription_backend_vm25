import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAssetSubcategoryDto } from './dto/create-asset-subcategory.dto';
import { UpdateAssetSubcategoryDto } from './dto/update-asset-subcategory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as XlsxPopulate from 'xlsx-populate';
import { DataSource, ILike, Like, Repository } from 'typeorm';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { DatabaseService } from 'src/dynamic-schema/database.service';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { DeleteAssetSubCategoryDto } from './dto/delete-asset-subcategory.dto';
import * as express from 'express';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service';
import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetSubcategory } from './entities/asset-subcategory.entity';

@Injectable()
export class AssetSubcategoriesService {
  constructor(
    @InjectRepository(AssetSubcategory)
    private assetSubCategoryRepository: Repository<AssetSubcategory>,

    @InjectRepository(AssetCategory)
    private categoryRepository: Repository<AssetCategory>,

    private readonly dataSource: DataSource,
    private readonly databaseService: DatabaseService,
    private readonly assetCategoriesService: AssetCategoriesService,
  ) {}

  async createNewAssetSubCategory(dto: CreateAssetSubcategoryDto) {
    // Fetch all subcategories with same main category
    const allSubCategories = await this.assetSubCategoryRepository.find({
      where: { main_category_id: dto.main_category_id },
    });

    // Find matching subcategory (case-insensitive)
    const existingUser = allSubCategories.find(
      (item) =>
        item.sub_category_name?.toLowerCase() ===
        dto.sub_category_name?.toLowerCase(),
    );

    if (existingUser) {
      if (existingUser.is_deleted === 1) {
        // Reactivate soft-deleted item
        existingUser.is_deleted = 0;
        existingUser.is_active = 1;
        existingUser.updated_at = new Date();
        existingUser.sub_category_description =
          dto.sub_category_description ?? existingUser.sub_category_description;
        existingUser.added_by = dto.added_by;

        const reactivatedItem =
          await this.assetSubCategoryRepository.save(existingUser);

        return {
          status: HttpStatus.OK,
          message: 'SubCategory reactivated successfully',
          data: {
            user: reactivatedItem,
          },
        };
      }

      // Conflict if already exists and is active
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: `SubCategory '${dto.sub_category_name}' already exists.`,
          data: existingUser,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Save new subcategory
    const newItem = this.assetSubCategoryRepository.create({
      sub_category_name: dto.sub_category_name,
      main_category_id: dto.main_category_id,
      sub_category_description: dto.sub_category_description,
      added_by: dto.added_by,
      is_active: 1,
      is_deleted: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedUser = await this.assetSubCategoryRepository.save(newItem);

    return {
      status: HttpStatus.CREATED,
      message: 'Item created successfully',
      data: {
        user: savedUser,
      },
    };
  }

  async generateSubCategoryExcleTemplate() {
    try {
      // 1. Fetch categories
      const categories = await this.assetCategoriesService.findAll();

      const categoryNames = categories.map((cat) =>
        cat.main_category_name.trim(),
      );

      // Group subcategories by category (optional future use)
      const subCategoryMap = {};
      categories.forEach((cat) => {
        subCategoryMap[cat.main_category_name.trim()] = [];
      });

      // 2. Create workbook and sheets
      const workbook = await XlsxPopulate.fromBlankAsync();
      const mainSheet = workbook.sheet(0);
      mainSheet.name('subcategory_template');
      const dataSheet = workbook.addSheet('Data');

      // 3. Instructions (Row 1–5)
      const instructions = [
        'Instructions:',
        '1. Fill in all required fields starting from row 7.',
        '2. Category column uses dropdown sourced from "Data" sheet.',
        '3. Do not edit the header row (Row 6).',
        '4. "Sub-Category Name" and "Description" are mandatory fields.',
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

      // 4. Set column widths
      const columnWidths = [30, 30, 50]; // A, B, C
      columnWidths.forEach((width, index) => {
        mainSheet.column(index + 1).width(width);
      });

      // 5. Header row (Row 6)
      const headers = [
        { label: 'Category', required: true },
        { label: 'Sub-Category Name', required: true },
        { label: 'Sub-Category Description', required: false },
      ];

      headers.forEach((item, index) => {
        const label = item.required ? `${item.label} *` : item.label;
        mainSheet
          .cell(6, index + 1)
          .value(label)
          .style({
            bold: true,
            fontColor: item.required ? 'FF0000' : '000000',
          });
      });

      const startRow = 7;
      const endRow = 1048576; // Excel max row

      // 6. Populate Data sheet for dropdowns
      categoryNames.forEach((catName, i) => {
        dataSheet.cell(i + 1, 1).value(catName); // Col A
      });

      // 7. Category dropdown
      mainSheet.range(`A${startRow}:A${endRow}`).dataValidation({
        type: 'list',
        formula1: `=Data!$A$1:$A$${categoryNames.length}`,
        allowBlank: false,
        showInputMessage: true,
        promptTitle: 'Select Category',
        prompt: 'Choose one from the dropdown',
        errorTitle: 'Invalid Category',
        error: 'Please select a valid category from the list.',
      });

      // 8. Field Validations
      // Sub-Category Name - Required and must be text
      mainSheet.range(`B${startRow}:B${endRow}`).dataValidation({
        type: 'textLength',
        operator: 'greaterThan',
        formula1: '0',
        allowBlank: false,
        showInputMessage: true,
        promptTitle: 'Sub-Category Name',
        prompt: 'Required field. Should contain text.',
        errorTitle: 'Invalid Name',
        error: 'Sub-Category Name is required.',
      });

      // Sub-Category Description - Required and must be text
      mainSheet.range(`C${startRow}:C${endRow}`).dataValidation({
        type: 'textLength',
        operator: 'greaterThan',
        formula1: '0',
        allowBlank: false,
        showInputMessage: true,
        promptTitle: 'Sub-Category Description',
        prompt: 'Required field. Should contain text.',
        errorTitle: 'Invalid Description',
        error: 'Sub-Category Description is required.',
      });

      // 9. Hide the data sheet
      dataSheet.hidden(true);

      // 10. Export workbook
      const buffer = await workbook.outputAsync();
      return buffer;
    } catch (error) {
      console.error('Error generating template:', error);
      throw new Error('Failed to generate Excel template');
    }
  }

  async bulkCreateSubcategories1(dtos: any[], user_id: number) {
    const userExists = await this.dataSource.getRepository(User).findOne({
      where: { register_user_login_id: user_id },
    });

    if (!userExists) throw new Error('User not found');

    const successSubcategories = [];
    const errorSubcategories = [];

    const existingUser = await this.assetSubCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    console.log('existingUser', existingUser);

    // Fetch all active categories
    const existingCategories = await this.categoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    // Fetch all active subcategories
    const existingSubcategories = await this.assetSubCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    // Map of category name -> category ID
    const categoryMap = {};

    existingCategories.forEach((cat) => {
      console.log('catgory:===', cat);
      const trimmedName = cat.main_category_name?.toLowerCase();
      console.log('trimmedName', trimmedName);
      if (trimmedName) categoryMap[trimmedName] = cat.main_category_id;
    });

    console.log('categoryMap', categoryMap);

    for (const dto of dtos) {
      console.log('dto', dto);

      dto.added_by = user_id;

      console.log('dto1', dto);

      // Get the category ID from name
      const trimmedCategoryName = dto.category?.toLowerCase();

      console.log('trimmedCategoryName', trimmedCategoryName);

      const categoryId = categoryMap[trimmedCategoryName];

      console.log('categoryId', categoryId);

      if (!categoryId) {
        errorSubcategories.push({
          ...dto,
          reason: 'Invalid or unknown category name',
        });
        continue;
      }

      // Check for duplicate subcategory name
      const isDuplicate = existingSubcategories.some(
        (sub) =>
          sub.sub_category_name?.trim().toLowerCase() ===
          dto.sub_category_name?.trim().toLowerCase(),
      );

      if (isDuplicate) {
        errorSubcategories.push({
          ...dto,
          reason: 'Duplicate subcategory name',
        });
        continue;
      }

      const now = new Date();

      const newSubcategory = this.assetSubCategoryRepository.create({
        sub_category_name: dto.sub_category_name,
        sub_category_description: dto.sub_category_description || '',
        main_category_id: categoryId,
        parent_organization_id: dto.parent_organization_id || 0,
        is_active: 1,
        is_deleted: 0,
        created_at: now,
        updated_at: now,
        added_by: userExists.user_id,
      });

      console.log('newSubcategory', newSubcategory);

      try {
        await this.assetSubCategoryRepository.save(newSubcategory);
        successSubcategories.push(dto);
      } catch (error) {
        console.error(
          `Error saving subcategory: ${dto.sub_category_name}`,
          error,
        );
        errorSubcategories.push({ ...dto, reason: 'Database save error' });
      }
    }

    return {
      status: successSubcategories.length
        ? HttpStatus.CREATED
        : HttpStatus.CONFLICT,
      message:
        successSubcategories.length && errorSubcategories.length
          ? 'Bulk subcategories created with some errors.'
          : successSubcategories.length
            ? 'All subcategories created successfully.'
            : 'No subcategories created. All entries failed.',
      data: {
        created_count: successSubcategories.length,
        created_subcategories: successSubcategories,
        error_subcategories: errorSubcategories,
      },
    };
  }

  async bulkCreateSubcategories(dtos: any[], user_id: number) {
    const successSubCategories = [];
    const errorSubCategories = [];
    const newSubCategories = [];

    const existingCategories = await this.categoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    const existingSubCategories = await this.assetSubCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    for (const dto of dtos) {
      // dto.added_by = user_id;

      const matchedCategory = existingCategories.find(
        (category) =>
          category.main_category_name?.trim().toLowerCase() ===
          dto.main_category_name?.trim().toLowerCase(),
      );

      dto.main_category_id = matchedCategory
        ? matchedCategory.main_category_id
        : null;

      const subcategoryExists = existingSubCategories.some(
        (subcategory) =>
          subcategory.sub_category_name?.trim().toLowerCase() ===
          dto.sub_category_name?.trim().toLowerCase(),
      );

      if (subcategoryExists) {
        errorSubCategories.push({
          ...dto,
          reason: 'Subcategory already exists',
        });
        continue;
      }

      const newSubCategory = this.assetSubCategoryRepository.create({
        main_category_id: dto.main_category_id,
        sub_category_name: dto.sub_category_name,
        sub_category_description: dto.sub_category_description,
        parent_organization_id: dto.parent_organization_id,
        is_active: 1,
        is_deleted: 0,
        // added_by: dto.added_by,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
      });

      newSubCategories.push({ dto, newSubCategory });
    }

    // Now batch save all the valid new subcategories
    try {
      const toSave = newSubCategories.map((entry) => entry.newSubCategory);
      const savedSubCategories =
        await this.assetSubCategoryRepository.save(toSave);

      savedSubCategories.forEach((saved, index) => {
        successSubCategories.push(newSubCategories[index].dto);
      });
    } catch (error) {
      console.error('Error during bulk save:', error);
      // Optionally push all to error if bulk save fails
      newSubCategories.forEach((entry) =>
        errorSubCategories.push({ ...entry.dto, reason: 'Batch save error' }),
      );
    }

    return {
      status: successSubCategories.length
        ? HttpStatus.CREATED
        : HttpStatus.CONFLICT,
      message:
        successSubCategories.length && errorSubCategories.length
          ? 'Bulk subcategories created with some conflicts.'
          : successSubCategories.length
            ? 'All subcategories created successfully.'
            : 'No subcategories created. All entries had conflicts.',
      data: {
        created_count: successSubCategories.length,
        created_subcategories: successSubCategories,
        error_subcategories: errorSubCategories,
      },
    };
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

  // async create(createAssetSubcategoryDto: CreateAssetSubcategoryDto) {

  //   try {
  //     let savedItems = await this.assetSubCategoryRepository.save(
  //       createAssetSubcategoryDto,
  //     );

  //     return savedItems;
  //   } catch (error) {
  //     console.error('Error in insert:', error);
  //     throw new Error('An error occurred while inserting the item.');
  //   }
  // }

  async create(createAssetSubcategoryDto: CreateAssetSubcategoryDto) {
    try {
      const { sub_category_name, main_category_id, sub_category_description } =
        createAssetSubcategoryDto;
      console.log({
        sub_category_name,
        main_category_id,
        sub_category_description,
      });

      // Get all matching subcategories for this main_category_id
      const allSubcategories = await this.assetSubCategoryRepository.find({
        where: { main_category_id },
      });

      // Case-insensitive match on sub_category_name
      const matchingSubcategory = allSubcategories.find(
        (item) =>
          item.sub_category_name?.toLowerCase() ===
          sub_category_name?.toLowerCase(),
      );

      if (matchingSubcategory) {
        if (matchingSubcategory.is_deleted === 0) {
          // Found duplicate that is not deleted
          throw new HttpException(
            {
              success: false,
              message: `SubCategory '${sub_category_name}' already exists.`,
              data: matchingSubcategory,
            },
            HttpStatus.CONFLICT,
          );
        } else {
          // Soft-deleted → Reactivate it
          matchingSubcategory.is_deleted = 0;
          matchingSubcategory.is_active = 1;
          matchingSubcategory.updated_at = new Date();
          matchingSubcategory.sub_category_description =
            sub_category_description ??
            matchingSubcategory.sub_category_description;
          const reactivatedItem =
            await this.assetSubCategoryRepository.save(matchingSubcategory);

          return {
            success: true,
            message: 'SubCategory reactivated successfully',
            data: {
              id: reactivatedItem.sub_category_id,
              name: reactivatedItem.sub_category_name,
            },
          };
        }
      }

      // No match → Save new
      const savedItem = await this.assetSubCategoryRepository.save({
        ...createAssetSubcategoryDto,
        is_active: 1,
        is_deleted: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return {
        success: true,
        message: 'Resource created successfully',
        data: {
          id: savedItem.sub_category_id,
          name: savedItem.sub_category_name,
        },
      };
    } catch (error) {
      console.error('Error in insert:', error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message:
            'An unexpected error occurred while inserting the subcategory.',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findAll() {
    try {
      return this.assetSubCategoryRepository.find({
        order: {
          sub_category_name: 'ASC',
        },
        where: { is_active: 1, is_deleted: 0 },
      });
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  countAll() {
    try {
      return this.assetSubCategoryRepository.countBy({
        parent_organization_id: 1,
        is_active: 1,
        is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async getAllSubCategories(
    page: number,
    limit: number,
    searchQuery: string,
    customFilters?: Record<string, any>,
  ): Promise<any> {
    try {
      let queryBuilder = this.assetSubCategoryRepository
        .createQueryBuilder('asset_sub_category')
        .leftJoinAndSelect('asset_sub_category.main_category', 'main');

      // Base filters
      queryBuilder = queryBuilder
        .where('asset_sub_category.is_active = :isActive', { isActive: 1 })
        .andWhere('asset_sub_category.is_deleted = :isDeleted', {
          isDeleted: 0,
        });

      // Search condition
      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder = queryBuilder.andWhere(
          '(asset_sub_category.sub_category_name ILIKE :search OR main.main_category_name ILIKE :search)',
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

          // Handle date-range filtering
          if (typeof value === 'object' && value.from && value.to) {
            queryBuilder = queryBuilder.andWhere(
              `asset_sub_category.${key} BETWEEN :from_${key} AND :to_${key}`,
              {
                [`from_${key}`]: value.from,
                [`to_${key}`]: value.to,
              },
            );
          } else if (key === 'main_category_name') {
            queryBuilder = queryBuilder.andWhere(
              'main.main_category_name ILIKE :mainCategoryName',
              { mainCategoryName: `%${value}%` },
            );
          } else {
            queryBuilder = queryBuilder.andWhere(
              `CAST(asset_sub_category.${key} AS TEXT) ILIKE :${key}`,
              { [key]: `%${value}%` },
            );
          }
        }
      }

      // Sorting
      let sortField = 'asset_sub_category.sub_category_name';
      let sortDirection: 'ASC' | 'DESC' = 'ASC';

      if (customFilters?.sortOrder) {
        const sortOrder = customFilters.sortOrder.toLowerCase();
        if (sortOrder === 'desc') {
          sortDirection = 'DESC';
        } else if (sortOrder === 'asc') {
          sortDirection = 'ASC';
        } else if (sortOrder === 'newest') {
          sortField = 'asset_sub_category.created_at';
          sortDirection = 'DESC';
        } else if (sortOrder === 'oldest') {
          sortField = 'asset_sub_category.created_at';
          sortDirection = 'ASC';
        }
      }

      // Final query with pagination
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
      console.error('Error fetching subcategories:', error);
      throw new BadRequestException(
        `Error fetching asset subcategories: ${error.message}`,
      );
    }
  }
  async exportFilteredExcelForSubCategories({
    search,
    filters,
  }: {
    search?: string;
    filters?: Record<string, any>;
  }): Promise<Buffer> {
    const queryBuilder = this.assetSubCategoryRepository
      .createQueryBuilder('asset_sub_category')
      .leftJoinAndSelect('asset_sub_category.main_category', 'main')
      .where('asset_sub_category.is_active = :isActive', { isActive: 1 })
      .andWhere('asset_sub_category.is_deleted = :isDeleted', { isDeleted: 0 });

    // Search
    if (search?.trim()) {
      const normalizedSearch = search.trim().replace(/\s+/g, ' ');
      queryBuilder.andWhere(
        `(asset_sub_category.sub_category_name ILIKE :search OR main.main_category_name ILIKE :search)`,
        { search: `%${normalizedSearch}%` },
      );
    }

    // Filters
    for (const [key, value] of Object.entries(filters || {})) {
      if (!value || key === 'sortOrder') continue;

      if (typeof value === 'object' && value.from && value.to) {
        queryBuilder.andWhere(
          `asset_sub_category.${key} BETWEEN :from_${key} AND :to_${key}`,
          {
            [`from_${key}`]: value.from,
            [`to_${key}`]: value.to,
          },
        );
      } else if (key === 'main_category_id') {
        queryBuilder.andWhere(
          `asset_sub_category.main_category_id = :mainCategoryId`,
          { mainCategoryId: value },
        );
      } else {
        queryBuilder.andWhere(
          `CAST(asset_sub_category.${key} AS TEXT) ILIKE :${key}`,
          { [key]: `%${value}%` },
        );
      }
    }

    // Sorting
    let sortField = 'asset_sub_category.sub_category_name';
    let sortDirection: 'ASC' | 'DESC' = 'ASC';

    if (filters?.sortOrder) {
      const order = filters.sortOrder.toLowerCase();
      if (order === 'desc') sortDirection = 'DESC';
      else if (order === 'asc') sortDirection = 'ASC';
      else if (order === 'newest') {
        sortField = 'asset_sub_category.created_at';
        sortDirection = 'DESC';
      } else if (order === 'oldest') {
        sortField = 'asset_sub_category.created_at';
        sortDirection = 'ASC';
      }
    }

    queryBuilder.orderBy(sortField, sortDirection);

    const results = await queryBuilder.getMany();

    // Excel sheet creation
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0).name('Asset Sub Categories');

    const headers = [
      'Sr. No.',
      'Sub Category Name',
      'Main Category',
      'Description',
    ];

    headers.forEach((header, i) => {
      sheet
        .cell(1, i + 1)
        .value(header)
        .style({ bold: true });
    });

    results.forEach((item, index) => {
      const row = index + 2;
      sheet.cell(row, 1).value(index + 1);
      sheet.cell(row, 2).value(item.sub_category_name || '');
      sheet.cell(row, 3).value(item.main_category?.main_category_name || '');
      sheet.cell(row, 4).value(item.sub_category_description || '');
    });

    return await workbook.outputAsync();
  }

  async exportSubcategoryCSV() {
    try {
      const whereCondition = { is_active: 1, is_deleted: 0 };

      const [results, total] = await this.assetSubCategoryRepository
        .createQueryBuilder('subcategory')
        .leftJoinAndSelect('subcategory.main_category', 'category')
        .where(whereCondition)
        .orderBy('subcategory.sub_category_id', 'DESC')
        .getManyAndCount();

      const decodedResults = results.map((subcategory) => ({
        'Subcategory Name': subcategory.sub_category_name,
        'Main Category': subcategory.main_category?.main_category_name || 'N/A',
        Description: subcategory.sub_category_description || '',
        'Parent Org ID': subcategory.parent_organization_id || '',
        'Added By': subcategory.added_by || '',
        'Created At': subcategory.created_at
          ? new Date(subcategory.created_at).toLocaleDateString()
          : '',
        'Updated At': subcategory.updated_at
          ? new Date(subcategory.updated_at).toLocaleDateString()
          : '',
      }));

      return { decodedResults };
    } catch (error) {
      console.error('Error in exportSubcategoryCSV:', error);
      throw new Error('An error occurred while fetching subcategories.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} assetSubcategory`;
  }

  async fetchSingleAssetSubCategoryData(
    deleteAssetSubCategoryDto: DeleteAssetSubCategoryDto,
  ) {
    const { sub_category_id } = deleteAssetSubCategoryDto;

    // Validate if vendor_id is provided
    if (!sub_category_id) {
      throw new BadRequestException('Sub Category ID is required');
    }

    try {
      const itemData = await this.assetSubCategoryRepository
        .createQueryBuilder('asset_sub_category')
        .where('asset_sub_category.sub_category_id = :sub_category_id', {
          sub_category_id,
        })
        .andWhere('asset_sub_category.is_active = :is_active', { is_active: 1 })
        .andWhere('asset_sub_category.is_deleted = :is_deleted', {
          is_deleted: 0,
        })
        .getOne();

      // Check if the user exists
      if (!itemData) {
        return {
          status: 404,
          message: `Sub Category with ID ${sub_category_id} not found or inactive`,
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

  async updateSubCategoryData(
    updateAssetSubCategorydto: UpdateAssetSubcategoryDto,
  ) {
    const {
      sub_category_name,
      sub_category_description,
      added_by,
      main_category_id,
      sub_category_id,
    } = updateAssetSubCategorydto;

    // Fetch the user and associated login data
    const existingSubCategory = await this.assetSubCategoryRepository.findOne({
      where: { sub_category_id: sub_category_id },
      // relations: ['userLogintable'],  // Fetch the associated user login details
    });

    if (!existingSubCategory) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: `Sub Category with ID ${sub_category_id} not found.`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Update the user data in the users table
    existingSubCategory.sub_category_name = sub_category_name;
    existingSubCategory.sub_category_description =
      sub_category_description || '';
    existingSubCategory.main_category_id = main_category_id;
    const updatedSubCategory =
      await this.assetSubCategoryRepository.save(existingSubCategory);

    // Return the success response
    return {
      status: HttpStatus.OK,
      message: 'Sub Category Updated Successfully',
      data: {
        user: updatedSubCategory,
      },
    };
  }

  async bulkDeleteSubCategories(subCategoryIds: number[]): Promise<any> {
    try {
      if (!Array.isArray(subCategoryIds) || subCategoryIds.length === 0) {
        throw new BadRequestException(
          'No subcategory IDs provided for deletion.',
        );
      }

      const results: {
        id: number;
        status: string;
        message?: string;
        name?: string;
      }[] = [];

      const subCategoriesToDelete: any[] = [];

      for (const id of subCategoryIds) {
        // Fetch subcategory by id
        const existingSubCategory =
          await this.assetSubCategoryRepository.findOne({
            where: { sub_category_id: id },
          });

        if (!existingSubCategory) {
          results.push({
            id,
            status: 'failed',
            message: 'Subcategory not found.',
            name: `ID ${id}`,
          });
          continue;
        }

        // Optionally add more validation here (e.g. check related data)

        subCategoriesToDelete.push(existingSubCategory);

        results.push({
          id,
          status: 'success',
          name: existingSubCategory.sub_category_name,
        });
      }

      if (subCategoriesToDelete.length > 0) {
        await this.assetSubCategoryRepository
          .createQueryBuilder()
          .update()
          .set({ is_active: 0, is_deleted: 1 })
          .where('sub_category_id IN (:...ids)', {
            ids: subCategoriesToDelete.map((c) => c.sub_category_id),
          })
          .execute();
      }

      const failedDeletions = results.filter((r) => r.status === 'failed');
      const successDeletions = results.filter((r) => r.status === 'success');

      if (failedDeletions.length > 0) {
        const failedNames = failedDeletions.map((d) => d.name).join(', ');
        throw new BadRequestException({
          success: false,
          message: `Could not delete the following subcategories: ${failedNames}`,
          details: failedDeletions,
        });
      }

      return {
        success: true,
        message: `${successDeletions.length} subcategor${
          successDeletions.length > 1 ? 'ies' : 'y'
        } deleted successfully.`,
        details: results,
      };
    } catch (error) {
      console.error('Error in bulkDeleteSubCategories:', error);
      console.log(
        'Failed Deletion Details:',
        JSON.stringify(error.response?.details, null, 2),
      );
      throw new BadRequestException(
        error.message || 'An error occurred while deleting subcategories.',
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} Sub Category`;
  }

  // ===============================

  getFilterableColumns() {
    return [
      {
        key: 'main_category_id',
        label: 'Main Category',
        type: 'select',
        mandatory: false,
      },
      // {
      //   key: 'sub_category_id',
      //   label: 'Subcategory',
      //   type: 'select',
      //   mandatory: false,
      // },
      {
        key: 'created_at',
        label: 'Created At',
        type: 'date-range',
        mandatory: false,
      },
    ];
  }

  async getSubCategoryDropdown() {
    const subcategories = await this.assetSubCategoryRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    return subcategories.map((sub) => ({
      label: sub.sub_category_name,
      value: sub.sub_category_id,
    }));
  }
}
