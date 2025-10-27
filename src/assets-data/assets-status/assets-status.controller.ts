import { Controller, Get, Post, Param, Body, Patch, Delete, UseGuards, Req, Res, Query, HttpException, HttpStatus,  } from '@nestjs/common';
import { AssetsStatusService } from './assets-status.service';
import { CreateAssetsStatusDto } from './dto/create-assets-status.dto';
import { UpdateAssetsStatusDto } from './dto/update-assets-status.dto';

import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { DeleteAssetsStatusDto } from './dto/delete-assets-status.dto';
import { exit } from 'process';

@Controller('assetStatus')
export class AssetStatusController {
  constructor(private readonly assetStatusService: AssetsStatusService) {}

@Post('addAssetStatus')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async createNewAssetStatus(@Body() createAssetsStatusDto: CreateAssetsStatusDto){
  try {
    return this.assetStatusService.createNewAssetStatus(createAssetsStatusDto);
  } catch (error) {
    console.log(`CREATE STATUS:${error}`);
  }
}

@Post('addAssetStatusBulk')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async addAssetStatusBulk(@Body() bulkData: CreateAssetsStatusDto[]) 
{
    try {
      return await this.assetStatusService.bulkCreateAssetStatuses(bulkData);
      
    } catch (error) {
      console.log(error)
    }
  }

  

  @Get('getAllStatuses')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllStatuses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      return this.assetStatusService.getAllStatuses(page, limit, searchQuery);
    } catch (error) {
      return false;
    }
  }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.assetStatusService.findAll();

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



  @Post('fetch-single-asset-status')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetStatusData(
    @Body() deleteAssetStatusDto: DeleteAssetsStatusDto,
    @Res() res: Response,
  ) {
    const response = await this.assetStatusService.fetchSingleAssetStatusData(deleteAssetStatusDto);
    return res.status(response.status).json(response);
  }

  @Post('update-asset-status')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateStatusData(@Body() updateStatusDto: UpdateAssetsStatusDto, @Req() req, @Res() res) {
    try {
      const updatedStatus = await this.assetStatusService.updateStatusData(updateStatusDto);

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Status updated successfully',
        data: updatedStatus.data,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('deleteStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteStatusData(@Body() deleteStatusDto: DeleteAssetsStatusDto, @Req() req, @Res() res) {
    console.log('deleteStatusDto :- ' + JSON.stringify(deleteStatusDto));
    exit;

    const deletedStatus = await this.assetStatusService.deleteStatusData(deleteStatusDto);

    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Status deleted successfully',
      data: deletedStatus,
    });
  }
  
  
  // Updated
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
}
