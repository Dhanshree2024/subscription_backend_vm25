import { Injectable, NotFoundException , HttpException, HttpStatus, BadRequestException, InternalServerErrorException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , DataSource, ILike, Not, IsNull, Brackets} from 'typeorm';
import { AssetMappingRepository } from './entities/asset-mapping.entity';
import { CreateAssetMappingDto } from './dto/create-asset-mapping.dto';
import { UpdateAssetMappingDto } from './dto/update-asset-mapping.dto';
import { GetAllUniqueMappedAssetsDto } from './dto/get-all-unique-mapped-assets.dto';

import { Stock } from 'src/assets-data/stocks/entities/stocks.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { AssetDatum } from 'src/assets-data/asset-data/entities/asset-datum.entity';

import { AssetToAssetMapDto } from './dto/asset-to-asset-map.dto';
import { AssetStockSerialsRepository } from 'src/assets-data/stocks/entities/asset_stock_serials.entity';
import { AssetTransferHistory } from './entities/asset_transfer_history.entity';
// getting all the unique mapped assets required imports 
import { AssetItem } from '../assets-data/asset-items/entities/asset-item.entity';
import * as XlsxPopulate from 'xlsx-populate';
@Injectable()
export class AssetMappingService {
  getMappedAssegetAllMappedAssetsSortedBySerialIdtsToAssets(asset_id: number) {
    throw new Error('Method not implemented.');
  }
  AssetStockSerialsRepository: any;
  constructor(
    @InjectRepository(AssetMappingRepository)
    private readonly assetMappingRepository: Repository<AssetMappingRepository>,
    private readonly dataSource: DataSource,

    @InjectRepository(AssetStockSerialsRepository)
    private readonly assetStockSerialsRepository: Repository<AssetStockSerialsRepository>,

    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    @InjectRepository(AssetItem)
    private readonly assetItemRepository: Repository<AssetItem>,

    @InjectRepository(AssetDatum)
    private readonly AssetDatum: Repository<AssetDatum>,

    @InjectRepository(AssetTransferHistory)
    private readonly assetTransferHistoryRepository: Repository<AssetTransferHistory>,
  ) {}

  // Create a new Asset Mapping
  async create(createAssetMappingDto: CreateAssetMappingDto) {
    console.log('create dto', createAssetMappingDto);
    const newAssetMapping = this.assetMappingRepository.create(
      createAssetMappingDto,
    );

    return await this.assetMappingRepository.save(newAssetMapping);
  }

  // Get all Asset Mappings
  async findAll(
    page: number,
    limit: number,
    searchQuery: string,
    customFilters?: Record<string, any>,
    asset_id?: number,
    status?: string,
  ): Promise<any> {
    console.log('customFilters', customFilters);

    try {
      const qb = this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.asset', 'asset')
        .leftJoinAndSelect('asset.asset_item', 'asset_item')
        .leftJoinAndSelect('mapping.user', 'user')
        .leftJoinAndSelect('mapping.managed_user', 'managed_user')
        .leftJoinAndSelect('mapping.map_branch', 'map_branch')
        .leftJoinAndSelect('mapping.status', 'status')
        .leftJoinAndSelect('mapping.department', 'department')
        .leftJoinAndSelect('mapping.unique_mapping', 'unique_mapping')
        .where(
          'mapping.is_active = :active AND mapping.is_deleted = :deleted',
          {
            active: 1,
            deleted: 0,
          },
        );

      // Filter by asset_id
      if (asset_id) {
        qb.andWhere('mapping.asset_id = :asset_id', { asset_id });
      }

      // Search logic
      const search = `%${searchQuery.trim()}%`;

      qb.andWhere(
        new Brackets((qb) => {
          qb.where('mapping.description ILIKE :search')
            .orWhere('asset.asset_title ILIKE :search')
            .orWhere('asset.manufacturer ILIKE :search')
            .orWhere('unique_mapping.stock_serials ILIKE :search')
            .orWhere('unique_mapping.system_code ILIKE :search')
            .orWhere("user.first_name || ' ' || user.last_name ILIKE :search")
            .orWhere(
              "managed_user.first_name || ' ' || managed_user.last_name ILIKE :search",
            )
            .orWhere('map_branch.branch_name ILIKE :search');
        }),
      ).setParameters({ search });

      // Status logic
      if (status === 'assigned') {
        qb.andWhere(
          new Brackets((qb) => {
            qb.where('mapping.mapping_type = 1').orWhere(
              `(mapping.mapping_type = 2 AND asset_item.item_type = 'Virtual')`,
            );
          }),
        );
      } else if (status === 'unassigned') {
        qb.andWhere(
          new Brackets((qb) => {
            qb.where('mapping.mapping_type = 0').orWhere(
              `(mapping.mapping_type = 2 AND asset_item.item_type = 'Physical')`,
            );
          }),
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
          ) {
            continue;
          }

          // Date range filter
          if (typeof value === 'object' && value.from && value.to) {
            qb.andWhere(`mapping.${key} BETWEEN :from_${key} AND :to_${key}`, {
              [`from_${key}`]: value.from,
              [`to_${key}`]: value.to,
            });
          } else {
            // Generic filter
            qb.andWhere(`CAST(mapping.${key} AS TEXT) ILIKE :${key}`, {
              [key]: `%${value}%`,
            });
          }
        }
      }

      // Sorting
      let sortField = 'mapping.mapping_id';
      let sortDirection: 'ASC' | 'DESC' = 'ASC';

      if (customFilters?.sortOrder) {
        const sort = customFilters.sortOrder.toLowerCase();
        if (sort === 'desc') sortDirection = 'DESC';
        else if (sort === 'asc') sortDirection = 'ASC';
        else if (sort === 'newest') {
          sortField = 'mapping.created_at';
          sortDirection = 'DESC';
        } else if (sort === 'oldest') {
          sortField = 'mapping.created_at';
          sortDirection = 'ASC';
        }
      }

      // Execute query
      const [results, total] = await qb
        .orderBy(sortField, sortDirection)
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Load related serials
      for (const mapping of results) {
        const relationIds = mapping?.unique_mapping?.stock_asset_relation_id;

        if (Array.isArray(relationIds) && relationIds.length) {
          const serials = await this.assetStockSerialsRepository
            .createQueryBuilder('serial')
            .leftJoinAndSelect('serial.asset_data', 'asset')
            .whereInIds(relationIds)
            .getMany();

          mapping.unique_mapping.related_stock_serials = serials;
        } else {
          mapping.unique_mapping.related_stock_serials = [];
        }
      }

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new BadRequestException('Error fetching asset mappings');
    }
  }

  async exportFilteredExcelForAssetsMapping(data: any[]): Promise<Buffer> {
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name('Assets Mapping');


    function formatDate(dateStr: string | Date): string {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    }

    const headers = [
      'Sr.No.',
      'Asset Name',
      'Serial No',
      'Department',
      'Branch',
      'User',
      'Manager',
      'Quantity',
      'Mapped Date',
      'Status',
    ];

    // Set headers
    headers.forEach((header, i) => {
      sheet
        .cell(1, i + 1)
        .value(header)
        .style({ bold: true });
    });

    // Fill rows
    data.forEach((item, index) => {
      sheet.cell(index + 2, 1).value(index + 1); // Sr.No.
      sheet.cell(index + 2, 2).value(item.asset?.asset_title || ''); // Asset Name
      sheet
        .cell(index + 2, 3)
        .value(
          item.unique_mapping?.stock_serials ||
            item.unique_mapping?.system_code ||
            '',
        ); // Serial No
      sheet.cell(index + 2, 4).value(item.department?.departmentName || ''); // Department
      sheet.cell(index + 2, 5).value(item.map_branch?.branch_name || ''); // Branch
      sheet
        .cell(index + 2, 6)
        .value(
          `${item.user?.first_name || ''} ${item.user?.middle_name || ''} ${item.user?.last_name || ''}`.trim(),
        ); // User
      sheet
        .cell(index + 2, 7)
        .value(
          `${item.managed_user?.first_name || ''} ${item.managed_user?.middle_name || ''} ${item.managed_user?.last_name || ''}`.trim(),
        ); // Manager
      sheet.cell(index + 2, 8).value(item.quantity || ''); // Quantity
      sheet.cell(index + 2, 9).value(formatDate(item.created_at)); // Mapped Date
      sheet.cell(index + 2, 10).value(item.status?.status_type_name || ''); // Status
    });

    // Auto adjust column width
    headers.forEach((_, i) => {
      sheet.column(i + 1).width(headers[i].length + 10);
    });

    return await workbook.outputAsync();
  }

  async fetchSingleAssetAvailableQty(asset_id: number): Promise<any> {
    console.log('Asset ID received for qty:', asset_id);
    if (!asset_id) throw new BadRequestException('Asset ID is required');

    try {
      // STEP 1: Fetch serial → unique ID map
      const stockSerials = await this.assetStockSerialsRepository
        .createQueryBuilder('serial')
        .where('serial.asset_id = :asset_id', { asset_id })
        .getMany();

      const serialToUniqueIdMap = new Map<string, number>();
      stockSerials.forEach((serial) => {
        if (serial.system_code) {
          const key = String(serial.system_code).trim().toUpperCase(); // Normalize
          serialToUniqueIdMap.set(key, serial.asset_stocks_unique_id);
        }
      });
      // STEP 2: Fetch vendor info (you can optimize this with joins if needed)
      const stockData = await this.stockRepository
        .createQueryBuilder('stock')
        .leftJoinAndSelect('stock.vendor_info', 'vendor_info')
        .where('stock.asset_id = :asset_id', { asset_id })
        .andWhere('stock.is_active = 1')
        .andWhere('stock.is_deleted = 0')
        .getOne();

      const vendorName = stockData?.vendor_info?.vendor_name || 'Unknown';

      // STEP 3: Fetch mappings as before
      const rawMappings = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .select(['mapping.system_code', 'mapping.unique_id'])
        .where('mapping.asset_id = :asset_id', { asset_id })
        .andWhere('mapping.mapping_type = 0')
        .andWhere('mapping.is_active = 1')
        .andWhere('mapping.is_deleted = 0')
        .getMany();

      const parseJsonSafely = (data: any): any[] => {
        try {
          if (!data) return [];
          if (typeof data === 'string') {
            const jsonStr = data.trim();
            if (jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
              const parsed = JSON.parse(jsonStr.replace(/'/g, '"'));
              return Array.isArray(parsed) ? parsed : [parsed];
            } else {
              return [{ serial_number: jsonStr }];
            }
          }
          return data;
        } catch (e) {
          console.error('JSON parse error for unique_id:', data, e.message);
          return [];
        }
      };

      let srCounter = 1;
      const availableUniqueIds = rawMappings.flatMap((m) => {
        const parsed = parseJsonSafely(m.system_code); // STEP: Use system_code to get serial(s)
        return parsed.map((p) => {
          const systemSerial = typeof p === 'string' ? p : p.serial_number;
          const normalized = String(systemSerial || '')
            .trim()
            .toUpperCase();

          return {
            sr_no: srCounter++,
            serial_number: m.unique_id, // keep original if needed
            system_code: m.system_code,
            vendor_name: vendorName,
            asset_stocks_unique_id: serialToUniqueIdMap.get(normalized) || null, // lookup using system_code-serial
          };
        });
      });

      // Filter out items where both serial_number and system_code are null (if needed)
      const filteredAvailable = availableUniqueIds.filter(
        (item) => item.serial_number || item.system_code,
      );

      return {
        status: 200,
        message: 'Available serials fetched successfully',
        available_unique_ids: availableUniqueIds,
        available_serial_numbers: filteredAvailable.map(
          (i) => i.serial_number || i.system_code,
        ),
        count: filteredAvailable.length,
      };
    } catch (err) {
      console.error('Error in fetchSingleAssetAvailableQty:', err);
      return {
        status: 500,
        message: 'An error occurred while fetching available unique IDs',
        error: err.message,
      };
    }
  }

  async getUsedUnusedAssetCounts(asset_id: number) {
    if (!asset_id) {
      throw new BadRequestException('Asset ID is required');
    }

    try {
      const whereCondition = { is_active: 1, is_deleted: 0, asset_id };

      // Try fetching asset mapping with asset joined
      let assetInfo = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.asset', 'asset')
        .where('mapping.asset_id = :asset_id', { asset_id })
        .andWhere('mapping.is_active = :isActive', { isActive: 1 })
        .andWhere('mapping.is_deleted = :isDeleted', { isDeleted: 0 })
        .getOne();

      // Fallback if no mapping exists → fetch asset manually
      let assetData: any = assetInfo;
      if (!assetInfo) {
        const asset = await this.AssetDatum.createQueryBuilder('asset')
          .where('asset.asset_id = :asset_id', { asset_id })
          .andWhere('asset.asset_is_active = :isActive', { isActive: 1 })
          .andWhere('asset.asset_is_deleted = :isDeleted', { isDeleted: 0 })
          .getOne();

        if (asset) {
          assetData = { asset }; // match frontend structure: asset_info.asset.asset_title
        }
      }

      const usedCount = await this.assetMappingRepository.count({
        where: {
          ...whereCondition,
          asset_used_by: Not(IsNull()),
        },
      });

      const unusedCount = await this.assetMappingRepository.count({
        where: {
          ...whereCondition,
          asset_used_by: IsNull(),
        },
      });

      const usedUniqueIdsRaw = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.asset', 'asset')
        .select([
          'mapping.unique_id',
          'mapping.mapping_id',
          'mapping.system_code',
          'asset.asset_title',
        ])
        .where({ ...whereCondition })
        .andWhere('mapping.asset_used_by IS NOT NULL')
        .getRawMany();

      const unusedUniqueIdsRaw = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.asset', 'asset')
        .select([
          'mapping.unique_id',
          'mapping.mapping_id',
          'mapping.system_code',
          'asset.asset_title',
        ])
        .where({ ...whereCondition })
        .andWhere('mapping.asset_used_by IS NULL')
        .getRawMany();

      const flattenIds = (raw) =>
        raw.map((item) => ({
          unique_id: item.mapping_unique_id,
          mapping_id: item.mapping_mapping_id,
          system_code: item.mapping_system_code,
        }));

      const usedUniqueIds = flattenIds(usedUniqueIdsRaw);
      const unusedUniqueIds = flattenIds(unusedUniqueIdsRaw);

      return {
        status: 200,
        message: 'Used and unused asset counts fetched successfully',
        data: {
          asset_info: assetData,
          used: usedCount,
          unused: unusedCount,
          total: usedCount + unusedCount,
          used_unique_ids: usedUniqueIds,
          unused_unique_ids: unusedUniqueIds,
        },
      };
    } catch (error) {
      console.error('Error in getUsedUnusedAssetCounts:', error);
      throw new InternalServerErrorException(
        'Failed to fetch used/unused asset counts.',
      );
    }
  }

  async getAllmapping() {
    try {
      const whereCondition: any = { is_active: 1, is_deleted: 0 };

      const [results, total] = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.asset', 'asset')
        .leftJoinAndSelect('asset.asset_item', 'asset_item')
        .leftJoinAndSelect('mapping.user', 'user')
        .leftJoinAndSelect('mapping.managed_user', 'managed_user')
        .leftJoinAndSelect('mapping.added_by_user', 'added_by_user')
        .leftJoinAndSelect('mapping.map_branch', 'map_branch')
        .leftJoinAndSelect('mapping.status', 'status')
        .leftJoinAndSelect('mapping.department', 'department')
        .addSelect('mapping.mapping_type')
        .where(whereCondition)
        .orderBy('mapping.mapping_id', 'DESC')
        .getManyAndCount();

      // ✅ Calculate counts using your final logic
      const directly_assigned = await this.assetMappingRepository.count({
        where: { ...whereCondition, mapping_type: 1 },
      });

      const mapped = await this.assetMappingRepository.count({
        where: { ...whereCondition, mapping_type: 2 },
      });

      // ✅ Custom count logic for unused:
      const unusedPhysicalAndFree = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin('mapping.asset', 'asset')
        .leftJoin('asset.asset_item', 'asset_item')
        .where(
          'mapping.is_active = :active AND mapping.is_deleted = :deleted',
          {
            active: 1,
            deleted: 0,
          },
        )
        .andWhere(
          `(mapping.mapping_type = 0 OR (mapping.mapping_type = 2 AND asset_item.item_type = 'Physical'))`,
        )
        .getCount();

      const available_unmapped_assets = await this.assetMappingRepository.count(
        {
          where: { ...whereCondition, mapping_type: 0 },
        },
      );

      const available_mapped_physical_assets = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin('mapping.asset', 'asset')
        .leftJoin('asset.asset_item', 'asset_item')
        .where(
          'mapping.is_active = :active AND mapping.is_deleted = :deleted',
          {
            active: 1,
            deleted: 0,
          },
        )
        .andWhere('mapping.mapping_type = 2 AND asset_item.item_type = :type', {
          type: 'Physical',
        })
        .getCount();

      const unavailable_mapped_virtual_assets =
        await this.assetMappingRepository
          .createQueryBuilder('mapping')
          .leftJoin('mapping.asset', 'asset')
          .leftJoin('asset.asset_item', 'asset_item')
          .where(
            'mapping.is_active = :active AND mapping.is_deleted = :deleted',
            {
              active: 1,
              deleted: 0,
            },
          )
          .andWhere(
            'mapping.mapping_type = 2 AND asset_item.item_type = :type',
            { type: 'Virtual' },
          )
          .getCount();

      const used = total - unusedPhysicalAndFree;

      const formattedResults = results.map((item) => ({
        ...item,
        created_at: item.created_at
          ? new Date(item.created_at).toLocaleDateString('en-GB')
          : null,
        updated_at: item.updated_at
          ? new Date(item.updated_at).toLocaleDateString('en-GB')
          : null,
      }));

      return {
        data: formattedResults,
        total,
        free: available_unmapped_assets,
        unused: unusedPhysicalAndFree,
        mapped,
        mapped_physical: available_mapped_physical_assets,
        mapped_virtual: unavailable_mapped_virtual_assets,
        used,
        directly_assigned,
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching asset mappings.');
    }
  }

  async addAssetMapping(createAssetMappingDto: CreateAssetMappingDto) {
    try {
      console.log('Received DTO:', createAssetMappingDto);

      const savedMapping = await this.assetMappingRepository.save(
        createAssetMappingDto,
      );

      console.log('Saved Mapping:', savedMapping);

      return {
        status: 'success',
        message: 'Asset Mapping added successfully.',
        data: savedMapping,
      };
    } catch (error) {
      console.error('Error in insert:', error);
      throw new Error('An error occurred while inserting the asset mapping.');
    }
  }

  async findSingleAssetMapping(mapping_id: number) {
    try {
      let whereCondition: any = { mapping_id: mapping_id };

      const result = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.user', 'used_user')
        .leftJoinAndSelect('mapping.managed_user', 'managed_user')
        .leftJoinAndSelect('mapping.map_branch', 'branch')
        .leftJoinAndSelect('mapping.status', 'status')
        .leftJoinAndSelect('mapping.department', 'department')
        .leftJoinAndSelect('mapping.asset', 'asset')

        .where(whereCondition)
        .getOne();

      if (!result) {
        throw new Error('Asset mapping not found.');
      }

      return result;
    } catch (error) {
      console.error('Error in findSingleAssetMapping:', error);
      throw new Error('An error occurred while fetching the asset mapping.');
    }
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

  async fetchAllAssetToAssetMappingAssets(asset_id: number) {
    const data = await this.assetMappingRepository.find({
      where: {
        asset_id: asset_id, // Use the asset_id to filter the assets
        mapping_type: 2,
        is_active: 1,
      },
      relations: ['asset'], // Include the related asset details
    });

    console.log('Asset Mapping Data:= ', data); // Log the result to verify

    return data;
  }

  async countAllMappings() {
    try {
      const totalCount = await this.assetMappingRepository.count({
        where: {
          is_active: 1,
          is_deleted: 0,
        },
      });

      const unusedCount = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .where('mapping.is_active = :active', { active: 1 })
        .andWhere('mapping.is_deleted = :deleted', { deleted: 0 })
        .andWhere('mapping.user IS NULL') // Ensuring proper NULL check
        .getCount();

      const usedCount = totalCount - unusedCount;

      return { totalCount, unusedCount, usedCount };
    } catch (error) {
      console.error('Error in countAllMappings:', error);
      throw new Error('An error occurred while fetching asset mapping counts.');
    }
  }

  //////VK
  //    async updateAssetMapping(UpdateAssetMappingDto: UpdateAssetMappingDto) {
  //     try {
  //       const { mapping_id, ...updateData } = UpdateAssetMappingDto;

  //       console.log("UpdateAssetMappingDto",UpdateAssetMappingDto)

  //       const nullableNumberFields = ['department_id', 'asset_managed_by', 'asset_used_by', 'branch_id', 'status_type_id'];
  // nullableNumberFields.forEach((field) => {
  //   if (updateData[field] === '') {
  //     updateData[field] = null;
  //   }
  // });

  //       const existingMapping = await this.assetMappingRepository.findOneBy({
  //         mapping_id,
  //       });
  //       if (!existingMapping)
  //         throw new Error('Asset mapping not found for updating.');

  //       // 🧠 Store old values before update
  //       const previousData = {
  //         asset_id: existingMapping.asset_id,
  //         branch_id: existingMapping.branch_id,
  //         department_id: existingMapping.department_id,
  //         asset_used_by: existingMapping.asset_used_by,
  //         asset_managed_by: existingMapping.asset_managed_by,
  //         system_code: existingMapping.system_code,
  //       };

  //       // ✅ Update mapping
  //       Object.assign(existingMapping, updateData);
  //       if (updateData.asset_used_by) {
  //   existingMapping.mapping_type = 1;
  // }
  //       const updatedMapping =
  //         await this.assetMappingRepository.save(existingMapping);

  //         // 🧠 Check and update children if any (reverse propagation logic)
  // if (updatedMapping.mapping_type === 1) {
  //   // Step 1: Get asset stock serial for this parent (to get child links)
  //   const parentSerial = await this.assetStockSerialsRepository.findOne({
  //     where: { system_code: updatedMapping.system_code, asset_id: updatedMapping.asset_id },
  //   });

  //   console.log("parentSerial",parentSerial)
  //   if (parentSerial?.stock_asset_relation_id?.length > 0) {
  //     for (const childId of parentSerial.stock_asset_relation_id) {
  //       const childSerial = await this.assetStockSerialsRepository.findOne({
  //         where: { asset_stocks_unique_id: childId },
  //       });
  //   console.log("childSerial",childSerial)

  //       if (!childSerial) continue;

  //       const childMapping = await this.assetMappingRepository.findOne({
  //         where: [
  //           { asset_id: childSerial.asset_id, system_code: childSerial.system_code, is_active: 1, is_deleted: 0 },
  //           ...(childSerial.stock_serials ? [{
  //             asset_id: childSerial.asset_id, unique_id: childSerial.stock_serials, is_active: 1, is_deleted: 0,
  //           }] : []),
  //         ],
  //         order: { created_at: 'DESC' },
  //       });

  //       if (childMapping) {
  //         childMapping.mapping_type = 1;
  //         childMapping.asset_used_by = updatedMapping.asset_used_by;
  //         childMapping.asset_managed_by = updatedMapping.asset_managed_by;
  //         childMapping.branch_id = updatedMapping.branch_id;
  //         childMapping.department_id = updatedMapping.department_id;
  //         childMapping.status_type_id = updatedMapping.status_type_id;
  //         childMapping.description = `Auto-inherited from parent asset ${updatedMapping.asset_id}`;

  //         await this.assetMappingRepository.save(childMapping);
  //         console.log(`✅ Updated child mapping for asset_id: ${childMapping.asset_id}`);
  //       }
  //     }
  //   }
  // }

  //       console.log('updatedMapping', updatedMapping);
  //       // ✅ Insert into transfer history (only if assigned)
  //       if (updateData.asset_used_by) {
  //         const transferEntry = {
  //           asset_id: previousData.asset_id,
  //           previous_organization_id: previousData.branch_id,
  //           previous_used_by: previousData.asset_used_by,
  //           previous_managed_by: previousData.asset_managed_by,
  //           new_organization_id: updateData.branch_id ?? previousData.branch_id,
  //           used_by: updateData.asset_used_by,
  //           managed_by: updateData.asset_managed_by ?? null,
  //           system_code: previousData.system_code,
  //           transfered_at: new Date(),
  //           updated_at: new Date(),
  //         };

  //         await this.assetTransferHistoryRepository.insert(transferEntry);
  //       }

  //       return updatedMapping;
  //     } catch (error) {
  //       console.error('Error in update:', error);
  //       throw new Error('An error occurred while updating the asset mapping.');
  //     }
  //   }

  async updateAssetMapping(UpdateAssetMappingDto: UpdateAssetMappingDto) {
    try {
      let mapping_id: any = UpdateAssetMappingDto.mapping_id;
      let updateData = { ...UpdateAssetMappingDto };
      delete updateData.mapping_id;

      // 🔧 Fix string input like '10,9' to [10, 9]
      if (typeof mapping_id === 'string') {
        mapping_id = mapping_id.split(',').map((id) => Number(id.trim()));
      }

      console.log('UpdateAssetMappingDto', UpdateAssetMappingDto);

      const nullableNumberFields = [
        'department_id',
        'asset_managed_by',
        'asset_used_by',
        'branch_id',
        'status_type_id',
      ];
      nullableNumberFields.forEach((field) => {
        if (updateData[field] === '') {
          updateData[field] = null;
        }
      });

      const mappingIds = Array.isArray(mapping_id) ? mapping_id : [mapping_id];
      const results = [];

      for (const id of mappingIds) {
        const existingMapping = await this.assetMappingRepository.findOneBy({
          mapping_id: id,
        });
        if (!existingMapping) continue;

        const previousData = {
          asset_id: existingMapping.asset_id,
          branch_id: existingMapping.branch_id,
          department_id: existingMapping.department_id,
          asset_used_by: existingMapping.asset_used_by,
          asset_managed_by: existingMapping.asset_managed_by,
          system_code: existingMapping.system_code,
        };

        Object.assign(existingMapping, updateData);
        if (updateData.asset_used_by) {
          existingMapping.mapping_type = 1;
        }

        const updatedMapping =
          await this.assetMappingRepository.save(existingMapping);

        if (updatedMapping.mapping_type === 1) {
          const parentSerial = await this.assetStockSerialsRepository.findOne({
            where: {
              system_code: updatedMapping.system_code,
              asset_id: updatedMapping.asset_id,
            },
          });

          console.log('parentSerial', parentSerial);
          if (parentSerial?.stock_asset_relation_id?.length > 0) {
            for (const childId of parentSerial.stock_asset_relation_id) {
              const childSerial =
                await this.assetStockSerialsRepository.findOne({
                  where: { asset_stocks_unique_id: childId },
                });
              console.log('childSerial', childSerial);
              if (!childSerial) continue;

              const childMapping = await this.assetMappingRepository.findOne({
                where: [
                  {
                    asset_id: childSerial.asset_id,
                    system_code: childSerial.system_code,
                    is_active: 1,
                    is_deleted: 0,
                  },
                  ...(childSerial.stock_serials
                    ? [
                        {
                          asset_id: childSerial.asset_id,
                          unique_id: childSerial.stock_serials,
                          is_active: 1,
                          is_deleted: 0,
                        },
                      ]
                    : []),
                ],
                order: { created_at: 'DESC' },
              });

              if (childMapping) {
                childMapping.mapping_type = 1;
                childMapping.asset_used_by = updatedMapping.asset_used_by;
                childMapping.asset_managed_by = updatedMapping.asset_managed_by;
                childMapping.branch_id = updatedMapping.branch_id;
                childMapping.department_id = updatedMapping.department_id;
                childMapping.status_type_id = updatedMapping.status_type_id;
                childMapping.description = `Auto-inherited from parent asset ${updatedMapping.asset_id}`;

                await this.assetMappingRepository.save(childMapping);
                console.log(
                  `✅ Updated child mapping for asset_id: ${childMapping.asset_id}`,
                );
              }
            }
          }
        }

        console.log('updatedMapping', updatedMapping);

        if (updateData.asset_used_by) {
          const transferEntry = {
            asset_id: previousData.asset_id,
            previous_organization_id: previousData.branch_id,
            previous_used_by: previousData.asset_used_by,
            previous_managed_by: previousData.asset_managed_by,
            new_organization_id: updateData.branch_id ?? previousData.branch_id,
            used_by: updateData.asset_used_by,
            managed_by: updateData.asset_managed_by ?? null,
            system_code: previousData.system_code,
            transfered_at: new Date(),
            updated_at: new Date(),
          };

          await this.assetTransferHistoryRepository.insert(transferEntry);
        }

        results.push(existingMapping);
      }

      return Array.isArray(mapping_id) ? results : results[0];
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error('An error occurred while updating the asset mapping.');
    }
  }

  ///////  VK transfer code
  async TransferAssetMapping(UpdateAssetMappingDto: UpdateAssetMappingDto) {
    try {
      const { mapping_id, ...updateData } = UpdateAssetMappingDto;
      console.log('updateData payload', updateData);

      console.log('transfer payload', UpdateAssetMappingDto);
      const existingMapping = await this.assetMappingRepository.findOneBy({
        mapping_id,
      });
      if (!existingMapping)
        throw new Error('Asset mapping not found for updating.');

      // Save history before updating
      const history = this.assetTransferHistoryRepository.create({
        asset_id: existingMapping.asset_id,
        previous_organization_id: existingMapping.branch_id, // Assuming branch is organization
        previous_used_by: existingMapping.asset_used_by,
        previous_managed_by: existingMapping.asset_managed_by,
        new_organization_id: updateData.branch_id,
        used_by: updateData.asset_used_by,
        managed_by: updateData.asset_managed_by,
        system_code: existingMapping.system_code || null,

        transfered_at: new Date(),
        updated_at: new Date(),
      });
      await this.assetTransferHistoryRepository.save(history);
      console.log('history', history);
      // Set reallocation_mapping_id = current mapping_id (for tracking)
      updateData.reallocation_mapping_id = mapping_id;

      // Update the mapping
      Object.assign(existingMapping, updateData);
      const updatedMapping =
        await this.assetMappingRepository.save(existingMapping);

      return updatedMapping;
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error('An error occurred while updating the asset mapping.');
    }
  }

  async getTimelineBySystemCode(systemCode: string) {
    const history = await this.assetTransferHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.prev_user', 'prevUser')
      .leftJoinAndSelect('prevUser.user_department', 'prevUserDept')
      .leftJoinAndSelect('history.prev_manager', 'prevManager')
      .leftJoinAndSelect('history.prev_branch', 'fromBranch')
      .leftJoinAndSelect('history.new_user', 'new_user')
      .leftJoinAndSelect('history.new_manager', 'new_manager')
      .leftJoinAndSelect('history.new_branch', 'new_branch')
      .leftJoinAndSelect('new_user.user_department', 'newUserDept')
      .where('history.system_code = :systemCode', { systemCode })
      .orderBy('history.transfered_at', 'DESC')
      // .select([
      //   'history.id',
      //   'history.asset_id',
      //   'history.system_code',
      //   'history.transfered_at',
      //   'prevUser.user_id',
      //   'prevUser.first_name',
      //   'prevUser.last_name',
      //   'prevUser.department_id',
      //   'prevUser.user_department',
      //  'prevUserDept.department_id',
      //  'prevUserDept.department_name',

      //   'new_user.user_id',
      //   'new_user.first_name',
      //   'new_user.last_name',
      //   'newUserDept.department_id',
      //  'newUserDept.department_name',
      //   'prevManager.first_name',
      //   'prevManager.last_name',
      //   'new_manager.first_name',
      //   'new_manager.last_name',
      //   'fromBranch.branch_name',
      //   'new_branch.branch_name',
      // ])
      .getMany();

    console.log('timeline history', history);
    return history.map((entry) => {
      let status = '';

      if (!entry.prev_user && entry.new_user) {
        status = 'Allocated';
      } else if (entry.prev_user && entry.new_user) {
        status = 'Transferred';
      } else if (entry.prev_user && !entry.new_user) {
        status = 'Returned';
      }

      return {
        id: entry.id,
        system_code: entry.system_code,
        asset_id: entry.asset_id,
        status,
        from_user: entry.prev_user
          ? `${entry.prev_user.first_name} ${entry.prev_user.last_name}`
          : null,
        new_user: entry['new_user']
          ? `${entry['new_user'].first_name} ${entry['new_user'].last_name}`
          : null,
        from_department:
          entry.prev_user?.user_department?.departmentName || null,
        to_department: entry.new_user?.user_department?.departmentName || null,

        from_manager: entry.prev_manager
          ? `${entry.prev_manager.first_name} ${entry.prev_manager.last_name}`
          : null,
        new_manager: entry['new_manager']
          ? `${entry['new_manager'].first_name} ${entry['new_manager'].last_name}`
          : null,
        from_branch: entry.prev_branch?.branch_name || null,
        new_branch: entry['new_branch']?.branch_name || null,
        transferred_at: entry.transfered_at,
      };
    });
  }

  async remove(id: number): Promise<string> {
    const updateResult = await this.assetMappingRepository.update(id, {
      is_active: 0,
      is_deleted: 1,
    });

    if (!updateResult.affected) {
      throw new NotFoundException(`AssetMapping with ID ${id} not found`);
    }

    return `AssetMapping with ID ${id} has been marked as deleted (soft delete).`;
  }

  async getUserDetails(userId: number) {
    const userAssets = await this.assetMappingRepository.find({
      where: [{ asset_managed_by: userId }, { asset_used_by: userId }],
      relations: [
        'managed_user',
        'user',
        'map_branch',
        'status',
        'department',
        'asset',
      ],
    });

    if (!userAssets.length) {
      throw new NotFoundException(`No assets found for user ID: ${userId}`);
    }

    console.log('User Asset Details:', JSON.stringify(userAssets, null, 2)); // Pretty print JSON

    return userAssets;
  }

  // S: get single asset mapping by mapping_id mapping asset to user

  async getSingleAssetMapping(mapping_id: number): Promise<any> {
    // if (!mapping_id) {
    //   throw new NotFoundException(`Mapping ID is required`);
    // }

    try {
      const mapping = await this.assetMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.asset', 'asset') // asset_id
        .leftJoinAndSelect('mapping.managed_user', 'managed_user') // asset_managed_by
        .leftJoinAndSelect('mapping.user', 'user') // asset_used_by
        .leftJoinAndSelect('mapping.map_branch', 'branch') // branch_id
        .leftJoinAndSelect('mapping.status', 'status') // status_type_id
        .leftJoinAndSelect('mapping.department', 'department') // department_id
        .leftJoinAndSelect('mapping.added_by_user', 'added_by_user') // created_by

        .select([
          // Main mapping fields
          'mapping.mapping_id',
          'mapping.asset_id',
          'mapping.asset_managed_by',
          'mapping.asset_used_by',
          'mapping.branch_id',
          'mapping.status_type_id',
          'mapping.department_id',
          'mapping.description',
          'mapping.reallocation_mapping_id',
          'mapping.quantity',
          'mapping.created_by',
          'mapping.updated_by',
          'mapping.created_at',
          'mapping.updated_at',
          'mapping.is_active',
          'mapping.is_deleted',
          'mapping.mapping_type',
          'mapping.unique_id',
        ])
        .where('mapping.mapping_id = :mapping_id', { mapping_id })
        .getOne();

      if (!mapping) {
        return {
          status: 404,
          message: `No mapping found for ID ${mapping_id}`,
          data: null,
        };
      }

      return {
        status: 200,
        message: 'Mapping data fetched successfully',
        data: mapping,
      };
    } catch (error) {
      console.error('Error fetching mapping:', error);
      return {
        status: 500,
        message: 'An error occurred while fetching the mapping',
        error: error.message,
      };
    }
  }



























}


   