import { Controller, Get, Post,Put,  Body, Patch, Param, Delete ,Req, Res, Query, UseGuards, BadRequestException} from '@nestjs/common';
import { AssetMappingService } from './asset-mapping.service';
import { CreateAssetMappingDto } from './dto/create-asset-mapping.dto';
import { UpdateAssetMappingDto } from './dto/update-asset-mapping.dto';
import { ApiKeyGuard } from 'src/auth/api-key.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';
import { Request, Response } from 'express';
import { exit } from 'process';
import { AssetToAssetMapDto } from './dto/asset-to-asset-map.dto';


@Controller('asset-mapping')
export class AssetMappingController {
  constructor(private readonly assetMappingService: AssetMappingService) {}

  @Post()
  create(@Body() CreateAssetMappingDto: CreateAssetMappingDto) {
    return this.assetMappingService.create(CreateAssetMappingDto);
  }

  // @Post()
  // create(@Body() CreateAssetMappingDto: CreateAssetMappingDto) {
  //   return this.assetMappingService.create(CreateAssetMappingDto);
  // }

  @Get('mappedlist')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async mappedlist(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string,
    @Query('asset_id') asset_id?: number,
    @Query('status') status?: string, // NEW
  ) {
    console.log('Received Query Params:', {
      page,
      limit,
      searchQuery,
      customFiltersStr,
      asset_id,
      status,
    });
    try {
      let customFilters = {};
      if (customFiltersStr) {
        try {
          customFilters = JSON.parse(customFiltersStr);
        } catch (err) {
          throw new BadRequestException(
            'Invalid JSON in customFilters parameter',
          );
        }
      }

      return this.assetMappingService.findAll(
        page,
        limit,
        searchQuery,
        customFilters,
        asset_id,
        status,
      );
    } catch (error) {
      // You might want to throw or handle the error properly here
      throw error;
    }
  }

  @Get('export-asset-mapping')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportAssetsMappingToExcel(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string,
    @Query('asset_id') asset_id?: number,
    @Query('status') status?: string,
  ) {
    let customFilters = {};
    if (customFiltersStr) {
      try {
        customFilters = JSON.parse(customFiltersStr);
      } catch (err) {
        throw new BadRequestException(
          'Invalid JSON in customFilters parameter',
        );
      }
    }

    // Step 1: Get the filtered data using the same logic as `findAll`
    const { data } = await this.assetMappingService.findAll(
      page,
      limit,
      searchQuery,
      customFilters,
      asset_id,
      status,
    );

    // Step 2: Pass that filtered data to the export function
    const buffer =
      await this.assetMappingService.exportFilteredExcelForAssetsMapping(data);

    res.setHeader(
      'Content-Disposition',
      `attachment;filename=asset-mapping.xlsx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  

  // fectch all asset mapping
  @Get('fetch-all-mapping')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllmapping() {
    console.log('');
    return await this.assetMappingService.getAllmapping();
  }

  @Post('add-map')
  @UseGuards(ApiKeyGuard, JwtAuthGuard) // Ensure the user is authenticated
  async addAssetMapping(
    @Body() createAssetMappingDto: CreateAssetMappingDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;

      if (!system_user_id) {
        return res
          .status(401)
          .json({ message: 'Unauthorized: No user ID found' });
      }

      const decrypted_system_user_id = decrypt(system_user_id.toString());

      // Fetch actual user ID from system_user_id
      const userId = await this.assetMappingService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );

      // Assign the extracted user ID to `created_by`
      createAssetMappingDto.created_by = userId;

      const result = await this.assetMappingService.addAssetMapping(
        createAssetMappingDto,
      );

      return res.status(200).json({
        status: 'success',
        message: 'Asset Mapping added successfully.',
        data: result,
      });
    } catch (error) {
      console.error('Error in asset mapping:', error);
      return res
        .status(500)
        .json({ message: 'An error occurred while mapping the asset.' });
    }
  }

  @Get('getSingleAssetMapping')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  findSingleAsset(@Query('mapping_id') mapping_id: number) {
    return this.assetMappingService.findSingleAssetMapping(mapping_id);
  }

  @Get('get-used-unused-counts')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getUsedUnusedCounts(@Query('asset_id') asset_id: number) {
    return this.assetMappingService.getUsedUnusedAssetCounts(asset_id);
  }

  @Get('timeline')
  getAssetTimeline(@Query('system_code') systemCode: string) {
    return this.assetMappingService.getTimelineBySystemCode(systemCode);
  }

  @Get('get-single-asset-available-assigned-qtyy')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetAvailableQty(@Query('asset_id') asset_id) {
    return this.assetMappingService.fetchSingleAssetAvailableQty(asset_id);
  }

  @Patch()
  async updateAssetMapping(
    @Body() updateAssetMappingDto: UpdateAssetMappingDto,
  ) {
    return await this.assetMappingService.updateAssetMapping(
      updateAssetMappingDto,
    );
  }

  @Put('update/:mapping_id')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateMapping(
    @Param('mapping_id') mapping_id: number,
    @Body() updateAssetMappingDto: UpdateAssetMappingDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      if (!system_user_id)
        return res.status(401).json({ message: 'Unauthorized' });

      const decryptedId = decrypt(system_user_id.toString());
      const userId = await this.assetMappingService.getUserByPublicID(
        Number(decryptedId),
      );

      updateAssetMappingDto.updated_by = userId;
      updateAssetMappingDto.mapping_id = mapping_id; // Set mapping_id from URL

      const result = await this.assetMappingService.updateAssetMapping(
        updateAssetMappingDto,
      );
      return res
        .status(200)
        .json({ status: 'success', message: 'Mapping updated.', data: result });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Update failed.' });
    }
  }

  @Put('transfer')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async TransferAssetMapping(
    @Query('mapping_id') mapping_id: number,
    @Body() updateAssetMappingDto: UpdateAssetMappingDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      if (!system_user_id)
        return res.status(401).json({ message: 'Unauthorized' });

      const decryptedId = decrypt(system_user_id.toString());
      const userId = await this.assetMappingService.getUserByPublicID(
        Number(decryptedId),
      );

      updateAssetMappingDto.updated_by = userId;
      updateAssetMappingDto.mapping_id = Number(mapping_id);

      const result = await this.assetMappingService.TransferAssetMapping(
        updateAssetMappingDto,
      );

      return res
        .status(200)
        .json({ status: 'success', message: 'Mapping updated.', data: result });
    } catch (error) {
      console.error('Error in updateMapping:', error);
      return res.status(500).json({ message: 'Update failed.' });
    }
  }

  @Get('count')
  async getAssetMappingCounts() {
    return await this.assetMappingService.countAllMappings();
  }

  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.assetMappingService.remove(+id);
  }

  // S: get single asset mapping by mapping_id mapping asset to user
  @Get('get-single-asset-mapping')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getSingleAssetMapping(@Query('mapping_id') mapping_id: number) {
    return this.assetMappingService.getSingleAssetMapping(mapping_id);
  }

  @Get('mapped-assets') // No path parameter anymore
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getMappedAssets(@Query('asset_id') assetId: number) {
    // Get asset_id from query params
    return this.assetMappingService.fetchAllAssetToAssetMappingAssets(assetId);
  }
}