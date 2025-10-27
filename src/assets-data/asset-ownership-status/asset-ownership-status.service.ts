import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAssetOwnershipStatusDto } from './dto/create-asset-ownership-status.dto';
import { UpdateAssetOwnershipStatusDto } from './dto/update-asset-ownership-status.dto';
import { DeleteAssetOwnershipStatusDto } from './dto/delete-asset-ownership-status.dto';
import { AssetOwnershipStatus } from './entities/asset-ownership-status.entity';

import { ILike, Repository,In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AssetOwnershipStatusService {
  constructor(
    @InjectRepository(AssetOwnershipStatus)
    private assetOwnershipStatusRepository: Repository<AssetOwnershipStatus>,
  ) {}

  async createAssetOwnershipStatus(dto: CreateAssetOwnershipStatusDto) {


    const ownershipStatusName = dto.ownership_status_type_name.trim().toUpperCase();
    // Validate if the ownership status already exists
    const existingOwnershipStatus = await this.assetOwnershipStatusRepository.findOne({
      where: { ownership_status_type_name: ownershipStatusName },
    });
    
    if (existingOwnershipStatus) {
      throw new HttpException(
        { status: HttpStatus.CONFLICT, message: `Ownership status '${dto.ownership_status_type_name}' already exists` },
        HttpStatus.CONFLICT,
      );
    }

    // Create the new ownership status
    const newOwnershipStatus = this.assetOwnershipStatusRepository.create({
      ownership_status_type_name: ownershipStatusName,
      asset_ownership_status_color:dto.asset_ownership_status_color,
      ownership_status_description: dto.ownership_status_description,
      ownership_status_type: dto.ownership_status_type,
      is_active: 1,
      is_deleted: 0,
      created_at: new Date()
    });

    // Save the new ownership status
    const savedOwnershipStatus = await this.assetOwnershipStatusRepository.save(newOwnershipStatus);

    // Return the success response in REST API format
    return {
      status: HttpStatus.CREATED,
      message: 'Ownership status created successfully',
      data: {
        ownership_status: savedOwnershipStatus,
      },
    };
  }

  async bulkCreateAssetOwnershipStatuses(dtos: CreateAssetOwnershipStatusDto[]) {
    const ownershipStatusNames = dtos.map(dto => dto.ownership_status_type_name.trim().toUpperCase());
    const ownershipStatusColors = dtos.map(dto => dto.asset_ownership_status_color.trim());
  
    // Fetch existing ownership statuses
    const existingStatuses = await this.assetOwnershipStatusRepository.find({
      where: [
        { ownership_status_type_name: In(ownershipStatusNames) },
        { asset_ownership_status_color: In(ownershipStatusColors) },
      ],
    });
  
    const existingNameColorMap = new Map<string, string>();
    existingStatuses.forEach(status => {
      existingNameColorMap.set(status.ownership_status_type_name, status.asset_ownership_status_color);
    });
  
    const alreadyExistEntries: any[] = [];
    const nameConflictEntries: any[] = [];
    const colorConflictEntries: any[] = [];
  
    const newOwnershipStatuses = dtos.filter(dto => {
      const existingColor = existingNameColorMap.get(dto.ownership_status_type_name);
  
      if (existingColor !== undefined) {
        if (existingColor === dto.asset_ownership_status_color) {
          alreadyExistEntries.push(dto);
          return false; // Exact match - skip
        } else {
          nameConflictEntries.push(dto);
          return false; // Name match but color different - skip
        }
      }
  
      const colorConflict = existingStatuses.find(
        status => status.asset_ownership_status_color === dto.asset_ownership_status_color && status.ownership_status_type_name !== dto.ownership_status_type_name
      );
      if (colorConflict) {
        colorConflictEntries.push(dto);
        return false; // Color match but name different - skip
      }
  
      return true; // New valid entry
    }).map(dto => ({
      ownership_status_type_name: dto.ownership_status_type_name,
      asset_ownership_status_color: dto.asset_ownership_status_color,
      is_active: 1,
      is_deleted: 0,
    }));
  
    if (newOwnershipStatuses.length === 0) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'No new ownership statuses created. Conflicts found.',
        data: {
          created_count: 0,
          created_statuses: [],
          already_exist_entries: alreadyExistEntries,
          name_conflict_entries: nameConflictEntries,
          color_conflict_entries: colorConflictEntries,
        },
      };
    }
  
    // Save new ownership statuses
    const savedStatuses = await this.assetOwnershipStatusRepository.save(newOwnershipStatuses);
  
    return {
      status: HttpStatus.CREATED,
      message: 'Bulk ownership statuses created successfully with some conflicts.',
      data: {
        created_count: savedStatuses.length,
        created_statuses: savedStatuses,
        already_exist_entries: alreadyExistEntries,
        name_conflict_entries: nameConflictEntries,
        color_conflict_entries: colorConflictEntries,
      },
    };
  }
  

  

  async getAllAssetOwnershipStatuses() {
    try {
      return this.assetOwnershipStatusRepository.find({
        order: {
          ownership_status_type_name: 'ASC',
        },
        // where: { is_active: 1, is_deleted: 0 },
      });
    } catch (error) {
      console.error('Error in getAllAssetOwnershipStatuses:', error);
      throw new Error('An error occurred while fetching ownership statuses.');
    }
  }

  async countAllAssetOwnershipStatuses() {
    try {
      return this.assetOwnershipStatusRepository.countBy({ is_active: 1, is_deleted: 0 });
    } catch (error) {
      console.error('Error in countAllAssetOwnershipStatuses:', error);
      throw new Error('An error occurred while counting ownership statuses.');
    }
  }

 async getAssetOwnershipStatusesPaginated(
  page: number,
  limit: number,
  searchQuery: string
): Promise<any> {
  try {
    const qb = this.assetOwnershipStatusRepository
      .createQueryBuilder("aos")
      .leftJoin("stocks", "s", "s.asset_ownership_status = aos.ownership_status_type_id")
      .addSelect("COALESCE(SUM(s.total_available_quantity), 0)", "usageCount")
      // .where("aos.is_active = :isActive AND aos.is_deleted = :isDeleted", {
      //   isActive: 1,
      //   isDeleted: 0,
      // })
      .groupBy("aos.ownership_status_type_id")
      .orderBy("aos.ownership_status_type_name", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    if (searchQuery && searchQuery.trim() !== "") {
      qb.andWhere("aos.ownership_status_type_name ILIKE :search", {
        search: `%${searchQuery}%`,
      });
    }

    // ✅ Works in all versions: returns both entities + raw
    const { entities, raw } = await qb.getRawAndEntities();

    // Merge usageCount from raw into entities
    const data = entities.map((entity, idx) => ({
      ...entity,
      usageCount: Number(raw[idx]?.usageCount || 0),
    }));

    const total = await this.assetOwnershipStatusRepository.count({
      where: { is_active: 1, is_deleted: 0 },
    });

    return {
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.log(error);
    throw new BadRequestException(
      `Error fetching asset ownership statuses: ${error.message}`,
    );
  }
}


  async getAssetOwnershipStatusById(deleteAssetOwnershipStatusDto: DeleteAssetOwnershipStatusDto) {
    const { ownership_status_type_id } = deleteAssetOwnershipStatusDto;

    // Validate if ownership_status_type_id is provided
    if (!ownership_status_type_id) {
      throw new BadRequestException('Ownership status ID is required');
    }

    try {
      const ownershipStatusData = await this.assetOwnershipStatusRepository
        .createQueryBuilder('asset_ownership_status')
        .where('asset_ownership_status.ownership_status_type_id = :ownership_status_type_id', { ownership_status_type_id })
        .andWhere('asset_ownership_status.is_active = :is_active', { is_active: 1 })
        .andWhere('asset_ownership_status.is_deleted = :is_deleted', { is_deleted: 0 })
        .getOne();

      // Check if the ownership status exists
      if (!ownershipStatusData) {
        return {
          status: 404,
          message: `Ownership status with ID ${ownership_status_type_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Ownership status fetched successfully',
        data: { ownershipStatusData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the ownership status',
        error: error.message,
      };
    }
  }

  async updateAssetOwnershipStatus(updateAssetOwnershipStatusDto: UpdateAssetOwnershipStatusDto) {
    const { ownership_status_type_id, ownership_status_type_name, asset_ownership_status_color , ownership_status_description} = updateAssetOwnershipStatusDto;

    // Fetch the ownership status data
    const existingOwnershipStatus = await this.assetOwnershipStatusRepository.findOne({
      where: { ownership_status_type_id },
    });

    if (!existingOwnershipStatus) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: `Ownership status with ID ${ownership_status_type_id} not found.` },
        HttpStatus.NOT_FOUND,
      );
    }

    // Update the ownership status data
    existingOwnershipStatus.ownership_status_type_name = ownership_status_type_name;
    existingOwnershipStatus.asset_ownership_status_color = asset_ownership_status_color;
    existingOwnershipStatus.ownership_status_description = ownership_status_description;
    const updatedOwnershipStatus = await this.assetOwnershipStatusRepository.save(existingOwnershipStatus);

    // Return the success response
    return {
      status: HttpStatus.OK,
      message: 'Ownership status updated successfully',
      data: {
        ownership_status: updatedOwnershipStatus,
      },
    };
  }

  async deleteAssetOwnershipStatus(deleteAssetOwnershipStatusDto: DeleteAssetOwnershipStatusDto) {
    const { ownership_status_type_id } = deleteAssetOwnershipStatusDto;

    // Fetch the ownership status data to ensure it exists
    const existingOwnershipStatus = await this.assetOwnershipStatusRepository.findOne({
      where: { ownership_status_type_id },
    });

    if (!existingOwnershipStatus) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: `Ownership status with ID ${ownership_status_type_id} not found` },
        HttpStatus.NOT_FOUND,
      );
    }

    // Set the ownership status as inactive and deleted
    existingOwnershipStatus.is_active = 0;
    existingOwnershipStatus.is_deleted = 1;

    // Save the updated ownership status
    await this.assetOwnershipStatusRepository.save(existingOwnershipStatus);
    return {
      status: HttpStatus.OK,
      message: `Ownership status with ID ${ownership_status_type_id} has been deactivated and deleted`,
    };
  }



  async exportOwnershipCSV() {
    try {
      const ownershipStatus = await this.assetOwnershipStatusRepository.find({
        where: { is_active: 1, is_deleted: 0 },
      });
  
      return ownershipStatus.map((OwnershipStatus) => ({
        "Asset Ownership Status Name": OwnershipStatus.ownership_status_type_name,
        "Asset Ownership Status Color Hex":OwnershipStatus.asset_ownership_status_color

      }));
    } catch (error) {
      console.error("Error exporting Asset Ownership Status CSV data:", error);
      throw new Error("An error occurred while exporting Asset Ownership Status Data");
    }
  }

}






