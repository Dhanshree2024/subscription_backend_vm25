import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Req, Res, Patch, Query, HttpStatus } from '@nestjs/common';
import { AssetOwnershipStatusService } from './asset-ownership-status.service';
import { CreateAssetOwnershipStatusDto } from './dto/create-asset-ownership-status.dto';
import { UpdateAssetOwnershipStatusDto } from './dto/update-asset-ownership-status.dto';

import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { DeleteAssetOwnershipStatusDto } from './dto/delete-asset-ownership-status.dto';
import { exit } from 'process';

@Controller('assetOwnershipStatus')
export class AssetOwnershipStatusController {
  constructor(
    private readonly assetOwnershipStatusService: AssetOwnershipStatusService,
  ) {}

  @Post('addAssetOwnershipStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createAssetOwnershipStatus(
    @Body() createAssetOwnershipStatusDto: CreateAssetOwnershipStatusDto,
  ) {
    try {
      return this.assetOwnershipStatusService.createAssetOwnershipStatus(
        createAssetOwnershipStatusDto,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @Post('assetOwnershipStatusBulk')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateAssetOwnershipStatuses(@Body() bulkData: CreateAssetOwnershipStatusDto[]) 
    {
      try {
        return await this.assetOwnershipStatusService.bulkCreateAssetOwnershipStatuses(bulkData);
        
      } catch (error) {
        console.log(error)
      }
    }

  @Get('getAllAssetOwnershipStatuses')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllAssetOwnershipStatuses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      return this.assetOwnershipStatusService.getAssetOwnershipStatusesPaginated(
        page,
        limit,
        searchQuery,
      );
    } catch (error) {
      return false;
    }
  }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAllAssetOwnershipStatuses(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.assetOwnershipStatusService.getAllAssetOwnershipStatuses();

      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }


  

  @Post('fetchSingleAssetOwnershipStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetOwnershipStatus(
    @Body() deleteAssetOwnershipStatusDto: DeleteAssetOwnershipStatusDto,
    @Res() res: Response,
  ) {
    const response =
      await this.assetOwnershipStatusService.getAssetOwnershipStatusById(
        deleteAssetOwnershipStatusDto,
      );
    return res.status(response.status).json(response);
  }

  @Post('updateAssetOwnershipStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateAssetOwnershipStatus(
    @Body() updateAssetOwnershipStatusDto: UpdateAssetOwnershipStatusDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const updatedStatus =
        await this.assetOwnershipStatusService.updateAssetOwnershipStatus(
          updateAssetOwnershipStatusDto,
        );

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Ownership status updated successfully',
        data: updatedStatus.data,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('deleteAssetOwnershipStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteAssetOwnershipStatus(
    @Body() deleteAssetOwnershipStatusDto: DeleteAssetOwnershipStatusDto,
    @Req() req,
    @Res() res,
  ) {
    console.log(
      'deleteAssetOwnershipStatusDto :- ' +
        JSON.stringify(deleteAssetOwnershipStatusDto),
    );
    exit;

    const deletedStatus =
      await this.assetOwnershipStatusService.deleteAssetOwnershipStatus(
        deleteAssetOwnershipStatusDto,
      );

    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Ownership status deleted successfully',
      data: deletedStatus,
    });
  }

  
  @Get('exportOwnershipCSV')
  async exportOwnershipCSV() {
    return this.assetOwnershipStatusService.exportOwnershipCSV();
  }

}