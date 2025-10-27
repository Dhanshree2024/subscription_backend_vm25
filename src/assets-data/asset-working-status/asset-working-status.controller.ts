import { Controller, Get, Post, Body, UseGuards, Req, Res, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AssetWorkingStatusService } from './asset-working-status.service';
import { CreateAssetWorkingStatusDto } from './dto/create-asset-working-status.dto';
import { UpdateAssetWorkingStatusDto } from './dto/update-asset-working-status.dto';
import { DeleteAssetWorkingStatusDto } from './dto/delete-asset-working-status.dto';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';

@Controller('assetWorkingStatus')
export class AssetWorkingStatusController {
  constructor(private readonly assetWorkingStatusService: AssetWorkingStatusService) {}

  @Post('addWorkingStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createNewAssetWorkingStatus(@Body() createAssetWorkingStatusDto: CreateAssetWorkingStatusDto) {
    try {
      return this.assetWorkingStatusService.createNewAssetWorkingStatus(createAssetWorkingStatusDto);
    } catch (error) {
      console.log(error);
    }
  }


  @Post('addAssetWorkingStatusesBulk')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async addAssetStatusBulk(@Body() bulkData: CreateAssetWorkingStatusDto[]) 
    {
      try {
        return await this.assetWorkingStatusService.bulkCreateAssetWorkingStatuses(bulkData);
        
      } catch (error) {
        console.log(error)
      }
    }


    

  @Get('getAllWorkingStatuses')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllWorkingStatuses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      return this.assetWorkingStatusService.getAllWorkingStatuses(page, limit, searchQuery);
    } catch (error) {
      return false;
    }
  }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.assetWorkingStatusService.findAll();

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

  @Post('fetch-single-working-status')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetWorkingStatusData(
    @Body() deleteAssetWorkingStatusDto: DeleteAssetWorkingStatusDto,
    @Res() res: Response,
  ) {
    const response = await this.assetWorkingStatusService.fetchSingleAssetWorkingStatusData(deleteAssetWorkingStatusDto);
    return res.status(response.status).json(response);
  }

  @Post('update-working-status')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateWorkingStatusData(@Body() updateWorkingStatusDto: UpdateAssetWorkingStatusDto, @Req() req, @Res() res) {
    try {
      const updatedStatus = await this.assetWorkingStatusService.updateWorkingStatusData(updateWorkingStatusDto);

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Working status updated successfully',
        data: updatedStatus.data,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('deleteWorkingStatus')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteWorkingStatusData(@Body() deleteWorkingStatusDto: DeleteAssetWorkingStatusDto, @Res() res) {
    console.log('deleteWorkingStatusDto :- ' + JSON.stringify(deleteWorkingStatusDto));

    const deletedStatus = await this.assetWorkingStatusService.deleteWorkingStatusData(deleteWorkingStatusDto);

    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Working status deleted successfully',
      data: deletedStatus,
    });
  }
}