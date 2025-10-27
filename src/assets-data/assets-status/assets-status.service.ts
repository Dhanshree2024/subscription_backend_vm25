import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAssetsStatusDto } from './dto/create-assets-status.dto';
import { UpdateAssetsStatusDto } from './dto/update-assets-status.dto';
import { DeleteAssetsStatusDto } from "./dto/delete-assets-status.dto";
import { AssetsStatus } from './entities/assets-status.entity';
import { ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AssetsStatusService {
  constructor(
    @InjectRepository(AssetsStatus)
    private assetsStatusRepository: Repository<AssetsStatus>,
  ) {}

  async createNewAssetStatus(dto: CreateAssetsStatusDto) {
    // STEP 1: Normalize name and color
    const rawName = dto.status_type_name || '';
    const name = rawName.trim().replace(/\s+/g, ' ').toUpperCase(); // Human-readable version
    const normalizedName = name.replace(/ /g, ''); // For DB comparison: remove spaces

    const rawColor = dto.status_color_code || '';
    const color = rawColor.trim().toUpperCase();
  const description = dto.asset_status_description?.trim() || '';

    // Validation
    if (!name || !color) {
      return {
        status: 400,
        message: 'Both status name and color code are required.',
        data: null,
      };
    }

    // STEP 2: Check if status with same normalized name already exists
    const existingStatus = await this.assetsStatusRepository
      .createQueryBuilder('status')
      .where(
        "REPLACE(UPPER(status.status_type_name), ' ', '') = :normalizedName",
        {
          normalizedName,
        },
      )
      .andWhere('status.is_deleted = :isDeleted', { isDeleted: 0 })
      .getOne();

    // STEP 3: Check if same color exists
    const existingStatusColor = await this.assetsStatusRepository.findOne({
      where: { status_color_code: color, is_deleted: 0 },
    });

    // STEP 4: If both name and color match the same ID
    if (
      existingStatus &&
      existingStatusColor &&
      existingStatus.status_type_id === existingStatusColor.status_type_id
    ) {
      if (existingStatus.is_deleted === 1) {
        existingStatus.is_deleted = 0;
        existingStatus.is_active = 1;
        existingStatus.status_color_code = color;

        const updated = await this.assetsStatusRepository.save(existingStatus);
        return {
          status: 200,
          message: `Status '${name}' restored successfully.`,
          data: updated,
        };
      }

      return {
        status: 409,
        message: `This entry already exists.`,
        data: null,
      };
    }

    // STEP 5: Block name-only conflict
    if (existingStatus) {
      return {
        status: 409,
        message: `This entry already exists.`,
        data: null,
      };
    }

    // STEP 6: (Optional) Block color-only conflict
    /*
  if (existingStatusColor) {
    return {
      status: 409,
      message: `Color '${color}' is already used for another status.`,
      data: null,
    };
  }
  */

    // STEP 7: Create new status
    const newStatus = this.assetsStatusRepository.create({
      status_type_name: name,
      status_color_code: color,
      asset_status_description: description,
      is_active: 1,
      is_deleted: 0,
      created_at: new Date()
    });

    const saved = await this.assetsStatusRepository.save(newStatus);

    return {
      status: 201,
      message: 'Status created successfully.',
      data: saved,
    };
  }

  async bulkCreateAssetStatuses(dtos: CreateAssetsStatusDto[]) {
    const statusNames = dtos.map((dto) => dto.status_type_name);
    const statusColors = dtos.map((dto) => dto.status_color_code);

    // Fetch existing statuses
    const existingStatuses = await this.assetsStatusRepository.find({
      where: [
        { status_type_name: In(statusNames) },
        { status_color_code: In(statusColors) },
      ],
    });

    const existingNameColorMap = new Map<string, string>();
    existingStatuses.forEach((status) => {
      existingNameColorMap.set(
        status.status_type_name,
        status.status_color_code,
      );
    });

    const alreadyExistEntries: any[] = [];
    const nameConflictEntries: any[] = [];
    const colorConflictEntries: any[] = [];

    const newStatuses = dtos
      .filter((dto) => {
        const existingColor = existingNameColorMap.get(dto.status_type_name);

        if (existingColor !== undefined) {
          if (existingColor === dto.status_color_code) {
            alreadyExistEntries.push(dto);
            return false; // Exact match - skip from creation
          } else {
            nameConflictEntries.push(dto);
            return false; // Name match but different color - skip
          }
        }

        const colorConflict = existingStatuses.find(
          (status) =>
            status.status_color_code === dto.status_color_code &&
            status.status_type_name !== dto.status_type_name,
        );
        if (colorConflict) {
          colorConflictEntries.push(dto);
          return false; // Color match but different name - skip
        }

        return true; // New valid entry
      })
      .map((dto) => ({
        status_type_name: dto.status_type_name,
        status_color_code: dto.status_color_code,
        is_active: 1,
        is_deleted: 0,
      }));

    // If no new statuses, return conflict
    if (newStatuses.length === 0) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'No new statuses created. Conflicts found.',
        data: {
          created_count: 0,
          created_statuses: [],
          already_exist_entries: alreadyExistEntries,
          name_conflict_entries: nameConflictEntries,
          color_conflict_entries: colorConflictEntries,
        },
      };
    }

    // Save new statuses
    const savedStatuses = await this.assetsStatusRepository.save(newStatuses);

    return {
      status: HttpStatus.CREATED,
      message: 'Bulk statuses created successfully with some conflicts.',
      data: {
        created_count: savedStatuses.length,
        created_statuses: savedStatuses,
        already_exist_entries: alreadyExistEntries,
        name_conflict_entries: nameConflictEntries,
        color_conflict_entries: colorConflictEntries,
      },
    };
  }

  async findAll() {
  try {
    const qb = this.assetsStatusRepository
      .createQueryBuilder('status')
      .leftJoin('asset_mapping', 'mapping', 'mapping.status_type_id = status.status_type_id')
      .select([
        'status.status_type_id AS status_type_id',
        'status.status_type_name AS status_type_name',
        'status.status_color_code AS status_color_code',
        'status.is_active AS is_active',
        'status.is_deleted AS is_deleted',
        'status.asset_status_description AS asset_status_description',
        'status.created_at AS created_at',
      ])
      .addSelect('COUNT(mapping.mapping_id)', 'usageCount')
      .groupBy('status.status_type_id')
      .orderBy('status.status_type_name', 'ASC');

    const rawResults = await qb.getRawMany();

    // Map back to objects with correct field names
    return rawResults.map(r => ({
      status_type_id: r.status_type_id,
      status_type_name: r.status_type_name,
      status_color_code: r.status_color_code,
      is_active: r.is_active,
      is_deleted: r.is_deleted,
      asset_status_description: r.asset_status_description,
      created_at: r.created_at,
      usageCount: Number(r.usageCount),
    }));
  } catch (error) {
    console.error('Error in findAll (asset statuses):', error);
    throw new Error('An error occurred while fetching asset statuses.');
  }
}

  async countAll() {
    try {
      return this.assetsStatusRepository.countBy({
        is_active: 1,
        is_deleted: 0,
      });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching statuses.');
    }
  }

  async getAllStatuses(
    page: number,
    limit: number,
    searchQuery: string,
  ): Promise<any> {
    try {
      let whereCondition = { is_active: 1, is_deleted: 0 };
      if (searchQuery && searchQuery.trim() !== '') {
        whereCondition['status_type_name'] = ILike(`%${searchQuery}%`);
      }
      const [results, total] = await this.assetsStatusRepository
        .createQueryBuilder('asset_status')
        .where(whereCondition)
        .orderBy('asset_status.status_type_name', 'ASC')
        .skip((page - 1) * limit) // Skip items for the current page
        .take(limit) // Limit the number of items per page
        .getManyAndCount();

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching asset statuses: ${error.message}`,
      );
    }
  }

  async fetchSingleAssetStatusData(
    deleteAssetStatusDto: DeleteAssetsStatusDto,
  ) {
    const { status_type_id } = deleteAssetStatusDto;

    // Validate if status_type_id is provided
    if (!status_type_id) {
      throw new BadRequestException('Status ID is required');
    }

    try {
      const statusData = await this.assetsStatusRepository
        .createQueryBuilder('asset_status')
        .where('asset_status.status_type_id = :status_type_id', {
          status_type_id,
        })
        .andWhere('asset_status.is_active = :is_active', { is_active: 1 })
        .andWhere('asset_status.is_deleted = :is_deleted', { is_deleted: 0 })
        .getOne();

      // Check if the status exists
      if (!statusData) {
        return {
          status: 404,
          message: `Status with ID ${status_type_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Status fetched successfully',
        data: { statusData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the status',
        error: error.message,
      };
    }
  }

  async updateStatusData(updateAssetStatusDto: UpdateAssetsStatusDto) {
    const { status_type_name, status_type_id, status_color_code, asset_status_description } =
      updateAssetStatusDto;

    const rawName = status_type_name || '';
    const name = rawName.trim().replace(/\s+/g, ' ').toUpperCase();
    const color = status_color_code.toUpperCase();
  const description = updateAssetStatusDto.asset_status_description?.trim() || '';

    // Fetch the status data
    const existingStatus = await this.assetsStatusRepository.findOne({
      where: { status_type_id },
    });

    if (!existingStatus) {
      return {
        status: 404,
        message: `Status with ID ${status_type_id} not found.`,
        data: null,
      };
    }

    // Update the status data
    existingStatus.status_type_name = name;
    existingStatus.status_color_code = color;
    existingStatus.asset_status_description= description
    const updatedStatus =
      await this.assetsStatusRepository.save(existingStatus);

    // Return the success response
    return {
      status: 200,
      message: 'Status Updated Successfully',
      data: {
        status: updatedStatus,
      },
    };
  }

  async deleteStatusData(deleteAssetStatusDto: DeleteAssetsStatusDto) {
    const { status_type_id } = deleteAssetStatusDto;

    // Fetch the status data to ensure it exists
    const existingStatus = await this.assetsStatusRepository.findOne({
      where: { status_type_id },
    });

    if (!existingStatus) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: `Status with ID ${status_type_id} not found`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Set the status as inactive and deleted
    existingStatus.is_active = 0;
    existingStatus.is_deleted = 1;

    // Save the updated status
    await this.assetsStatusRepository.save(existingStatus);
    return {
      status: HttpStatus.OK,
      message: `Status with ID ${status_type_id} has been deactivated and deleted`,
    };
  }
}
