import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAssetWorkingStatusDto } from './dto/create-asset-working-status.dto';
import { UpdateAssetWorkingStatusDto } from './dto/update-asset-working-status.dto';
import { DeleteAssetWorkingStatusDto } from './dto/delete-asset-working-status.dto';
import { AssetWorkingStatus } from './entities/asset-working-status.entity';
import { ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { exit } from 'process';

@Injectable()
export class AssetWorkingStatusService {
  constructor(
    @InjectRepository(AssetWorkingStatus)
    private assetWorkingStatusRepository: Repository<AssetWorkingStatus>,
  ) {}

  
  async createNewAssetWorkingStatus(dto: CreateAssetWorkingStatusDto) {
    // Validate if the working status already exists
    const existingStatus = await this.assetWorkingStatusRepository.findOne({
      where: { working_status_type_name: dto.working_status_type_name },
    });
    if (existingStatus) {
      throw new HttpException(
        { status: HttpStatus.CONFLICT, message: `Working status '${dto.working_status_type_name}' already exists` },
        HttpStatus.CONFLICT,
      );
    }

    // Create the new working status
    const newStatus = this.assetWorkingStatusRepository.create({
      working_status_type_name: dto.working_status_type_name,
      working_status_color:dto.working_status_color,
      working_status_description:dto.working_status_description,
      is_active: 1,
      is_deleted: 0,
      created_at: new Date()
    });

    // Save the new working status
    const savedStatus = await this.assetWorkingStatusRepository.save(newStatus);

    // Return the success response in REST API format
    return {
      status: HttpStatus.CREATED,
      message: 'Working status created successfully',
      data: {
        status: savedStatus,
      },
    };
  }


  async bulkCreateAssetWorkingStatuses(dtos: CreateAssetWorkingStatusDto[]) {
    const workingStatusNames = dtos.map(dto => dto.working_status_type_name);
    const workingStatusColors = dtos.map(dto => dto.working_status_color);
  
    // Fetch existing working statuses
    const existingStatuses = await this.assetWorkingStatusRepository.find({
      where: [
        { working_status_type_name: In(workingStatusNames) },
        { working_status_color: In(workingStatusColors) },
      ],
    });
  
    const existingNameColorMap = new Map<string, string>();
    existingStatuses.forEach(status => {
      existingNameColorMap.set(status.working_status_type_name, status.working_status_color);
    });
  
    const alreadyExistEntries: any[] = [];
    const nameConflictEntries: any[] = [];
    const colorConflictEntries: any[] = [];
  
    const newWorkingStatuses = dtos.filter(dto => {
      const existingColor = existingNameColorMap.get(dto.working_status_type_name);
  
      if (existingColor !== undefined) {
        if (existingColor === dto.working_status_color) {
          alreadyExistEntries.push(dto);
          return false; // Exact match - skip from creation
        } else {
          nameConflictEntries.push(dto);
          return false; // Name match but different color - skip
        }
      }
  
      const colorConflict = existingStatuses.find(
        status => status.working_status_color === dto.working_status_color && status.working_status_type_name !== dto.working_status_type_name
      );
      if (colorConflict) {
        colorConflictEntries.push(dto);
        return false; // Color match but different name - skip
      }
  
      return true; // New valid entry
    }).map(dto => ({
      working_status_type_name: dto.working_status_type_name,
      working_status_color: dto.working_status_color,
      is_active: 1,
      is_deleted: 0,
    }));
  
    if (newWorkingStatuses.length === 0) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'No new working statuses created. Conflicts found.',
        data: {
          created_count: 0,
          created_statuses: [],
          already_exist_entries: alreadyExistEntries,
          name_conflict_entries: nameConflictEntries,
          color_conflict_entries: colorConflictEntries,
        },
      };
    }
  
    // Save new working statuses
    const savedStatuses = await this.assetWorkingStatusRepository.save(newWorkingStatuses);
  
    return {
      status: HttpStatus.CREATED,
      message: 'Bulk working statuses created successfully with some conflicts.',
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
      return this.assetWorkingStatusRepository.find({
        order: {
          working_status_type_name: 'ASC',
        },
        // where: { is_active: 1, is_deleted: 0 },
      });
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching working statuses.');
    }
  }

  async countAll() {
    try {
      return this.assetWorkingStatusRepository.countBy({ is_active: 1, is_deleted: 0 });
    } catch (error) {
      console.error('Error in countAll:', error);
      throw new Error('An error occurred while fetching working statuses.');
    }
  }

  async getAllWorkingStatuses(page: number, limit: number, searchQuery: string): Promise<any> {
    try {
      let whereCondition = { is_active: 1, is_deleted: 0 };
      if (searchQuery && searchQuery.trim() !== '') {
        whereCondition['working_status_type_name'] = ILike(`%${searchQuery}%`);
      }
      const [results, total] = await this.assetWorkingStatusRepository
        .createQueryBuilder('asset_working_status')
        // .where(whereCondition)
        .orderBy('asset_working_status.working_status_type_name', 'ASC')
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
      throw new BadRequestException(`Error fetching working statuses: ${error.message}`);
    }
  }

  async fetchSingleAssetWorkingStatusData(deleteAssetWorkingStatusDto: DeleteAssetWorkingStatusDto) {
    const { working_status_type_id } = deleteAssetWorkingStatusDto;

    // Validate if working_status_type_id is provided
    if (!working_status_type_id) {
      throw new BadRequestException('Working status ID is required');
    }

    try {
      const statusData = await this.assetWorkingStatusRepository
        .createQueryBuilder('asset_working_status')
        .where('asset_working_status.working_status_type_id = :working_status_type_id', { working_status_type_id })
        .andWhere('asset_working_status.is_active = :is_active', { is_active: 1 })
        .andWhere('asset_working_status.is_deleted = :is_deleted', { is_deleted: 0 })
        .getOne();

      // Check if the working status exists
      if (!statusData) {
        return {
          status: 404,
          message: `Working status with ID ${working_status_type_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Working status fetched successfully',
        data: { statusData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the working status',
        error: error.message,
      };
    }
  }

  async updateWorkingStatusData(updateAssetWorkingStatusDto: UpdateAssetWorkingStatusDto) {
   
    const { working_status_type_name, working_status_type_id, working_status_color , working_status_description} = updateAssetWorkingStatusDto;

    // Fetch the working status data
    const existingStatus = await this.assetWorkingStatusRepository.findOne({
      where: { working_status_type_id },
    });



    if (!existingStatus) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: `Working status with ID ${working_status_type_id} not found.` },
        HttpStatus.NOT_FOUND,
      );
    }

    // Update the working status data
    existingStatus.working_status_type_name = working_status_type_name;
    existingStatus.working_status_color = working_status_color;
    existingStatus.working_status_description = working_status_description
    const updatedStatus = await this.assetWorkingStatusRepository.save(existingStatus);

    // Return the success response
    return {
      status: HttpStatus.OK,
      message: 'Working status updated successfully',
      data: {
        status: updatedStatus,
      },
    };
  }

  async deleteWorkingStatusData(deleteAssetWorkingStatusDto: DeleteAssetWorkingStatusDto) {
    const { working_status_type_id } = deleteAssetWorkingStatusDto;

    // Fetch the working status data to ensure it exists
    const existingStatus = await this.assetWorkingStatusRepository.findOne({
      where: { working_status_type_id },
    });

    console.log(existingStatus);

    if (!existingStatus) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: `Working status with ID ${working_status_type_id} not found` },
        HttpStatus.NOT_FOUND,
      );
    }
    console.log(existingStatus);
    // Set the working status as inactive and deleted
    existingStatus.is_active = 0;
    existingStatus.is_deleted = 1;


    console.log("existingStatus",existingStatus);

    // Save the updated working status
    await this.assetWorkingStatusRepository.save(existingStatus);
    return {
      status: HttpStatus.OK,
      message: `Working status with ID ${working_status_type_id} has been deactivated and deleted`,
    };
  }
}