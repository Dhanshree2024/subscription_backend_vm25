import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateAssetItemsFieldsMappingDto } from './dto/create-asset-items-fields-mapping.dto';
import { UpdateAssetItemsFieldsMappingDto } from './dto/update-asset-items-fields-mapping.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DataSource } from 'typeorm';
import { AssetItemsFieldsMapping } from './entities/asset-items-fields-mapping.entity';
// /import { User } from 'src/user/user.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';

@Injectable()
export class AssetItemsFieldsMappingService {
  constructor(
    @InjectRepository(AssetItemsFieldsMapping)
    private assetItemFieldsMappingRepository: Repository<AssetItemsFieldsMapping>,
    private readonly dataSource: DataSource,
  ) {}

  create(createAssetItemFieldsMappingDto: CreateAssetItemsFieldsMappingDto) {
    return 'This action adds a new assetItemFieldsMapping';
  }

  countAll() {
    try {
      return this.assetItemFieldsMappingRepository.countBy({
        aif_parent_organization_id: 1,
        aif_is_active: 1,
        aif_is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  async addItemFields(
    createAssetItemFieldsMappingDto: CreateAssetItemsFieldsMappingDto[],
  ) {
    const newItems: AssetItemsFieldsMapping[] = [];
    const existingItems: AssetItemsFieldsMapping[] = [];

    for (const dto of createAssetItemFieldsMappingDto) {
      // Process each dto object here

      if (dto.aif_mapping_id == null) {
        const newItem = new AssetItemsFieldsMapping();

        newItem.asset_item_id = dto.asset_item_id;
        newItem.aif_is_enabled = dto.aif_is_enabled;
        newItem.aif_is_mandatory = dto.aif_is_mandatory;
        newItem.aif_is_active = dto.aif_is_active;
        newItem.aif_is_deleted = dto.aif_is_deleted;
        newItem.aif_added_by = dto.aif_added_by;
        newItem.aif_description = dto.aif_description;
        newItem.asset_field_category_id = dto.asset_field_category_id;
        newItem.aif_parent_organization_id = 1;
        newItem.asset_field_id = dto.assetFields.asset_field_id;
        newItems.push(newItem);

      } else {
        
        const existingItem = new AssetItemsFieldsMapping();
        existingItem.aif_mapping_id = dto.aif_mapping_id;
        existingItem.asset_item_id = dto.asset_item_id;
        existingItem.aif_is_enabled = dto.aif_is_enabled;
        existingItem.aif_is_mandatory = dto.aif_is_mandatory;
        existingItem.aif_is_active = dto.aif_is_active;
        existingItem.aif_is_deleted = dto.aif_is_deleted;
        existingItem.aif_added_by = dto.aif_added_by;
        existingItem.aif_description = dto.aif_description;
        existingItem.asset_field_category_id = dto.asset_field_category_id;
        existingItem.aif_parent_organization_id =
          dto.aif_parent_organization_id;
        existingItem.asset_field_id = dto.assetFields.asset_field_id;
        console.log(
          'existingItems ' +
            existingItem.aif_is_enabled +
            ' ' +
            existingItem.aif_is_mandatory,
        );
        existingItems.push(existingItem);
      }
    }

    try {
      let savedItems =
        await this.assetItemFieldsMappingRepository.save(newItems);
      const existingItemsToUpdate =
        await this.assetItemFieldsMappingRepository.save(existingItems);
      savedItems = [...savedItems, ...existingItemsToUpdate];

      return savedItems;
    } catch (error) {
      console.error('Error in insert:', error);
      throw new Error('An error occurred while inserting the item.');
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

  findAll() {
    try {
      return this.assetItemFieldsMappingRepository.find();
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching categories.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} assetItemFieldsMapping232`;
  }

  async findItemFields(
    asset_item_id: number,
    searchQuery?: string,
    customFilters: Record<string, any> = {},
    sortOrder?: string,
  ) {
    try {
      const query = this.assetItemFieldsMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.assetFields', 'assetFields')
        .leftJoinAndSelect('mapping.assetFieldCategory', 'category')
        .where('mapping.asset_item_id = :asset_item_id', { asset_item_id });

      // 🔍 Search by asset field name or value
      if (searchQuery && searchQuery.trim() !== '') {
        query.andWhere(
          `(LOWER(COALESCE(assetFields.asset_field_name, '')) LIKE :search OR LOWER(COALESCE(assetFields.asset_field_value, '')) LIKE :search)`,
          { search: `%${searchQuery.toLowerCase()}%` },
        );
      }

      // 🧠 Apply custom filters
      for (const [key, value] of Object.entries(customFilters)) {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          key === 'sortOrder'
        )
          continue;

        if (typeof value === 'object' && value.from && value.to) {
          query.andWhere(
            `assetFields.${key} BETWEEN :from_${key} AND :to_${key}`,
            {
              [`from_${key}`]: value.from,
              [`to_${key}`]: value.to,
            },
          );
        } else {
          query.andWhere(`CAST(assetFields.${key} AS TEXT) ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }

      // ↕️ Apply sorting
      if (sortOrder) {
        const [field, direction = 'ASC'] = sortOrder.split(':');
        query.orderBy(
          `assetFields.${field}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      }

      // ✅ Fetch results
      const results = await query.getMany();
      console.log('results', results);

      // 🧼 Return [] if no data found
      if (!results || results.length === 0) {
        return [];
      }

      // ✅ Your original grouping logic preserved
      const uniqueCategories = {};
      results.forEach((item) => {
        const categoryId = item.assetFieldCategory?.asset_field_category_id;
        if (!uniqueCategories[categoryId]) {
          uniqueCategories[categoryId] = item.assetFieldCategory;
        }
      });

      
    } catch (error) {
      console.error('Error in findItemFields:', error);
      throw new Error('An error occurred while fetching item fields.');
    }
  }

  update(
    id: number,
    updateAssetItemFieldsMappingDto: UpdateAssetItemsFieldsMappingDto,
  ) {
    return `This action updates a #${id} assetItemFieldsMapping3233`;
  }

  remove(id: number) {
    return `This action removes a #${id} assetItemFieldsMapping233432`;
  }
}
