import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Req, Res,Patch,Query, HttpStatus, HttpException, BadRequestException } from '@nestjs/common';
import { AssetFieldsService } from './asset-fields.service';
import { CreateAssetFieldDto } from './dto/create-asset-field.dto';
import { UpdateAssetFieldDto } from './dto/update-asset-field.dto';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { DeleteAssetFieldDto } from './dto/delete-asset-field.dto';


@Controller('assetFields')
export class AssetFieldsController {
  constructor(private readonly assetFieldsService: AssetFieldsService) {}

@Get('getOrganizationAssetFields')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async fetchOrganizationAllAssetFields(
  @Query('search') searchQuery: string = '',
  @Query('customFilters') customFiltersStr?: string, // customFilters sent as string
) {
  let customFilters: Record<string, any> = {};

  try {
    if (customFiltersStr) {
      customFilters = JSON.parse(customFiltersStr);
    }
  } catch (err) {
    console.warn('Invalid customFilters string');
  }

  return this.assetFieldsService.fetchOrganizationAllAssetFields(
    searchQuery,
    customFilters,
  );
}

@Get('filterable-asset-field-columns')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
getFilterableAssetFieldColumns() {
  return {
    success: true,
    data: this.assetFieldsService.getFilterableColumns(),
  };
}

@Get('field-categories-for-dropdown-of-filter')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async getAssetFieldCategoryDropdown() {
  const data = await this.assetFieldsService.getAssetFieldCategoryDropdown();
  return {
    success: true,
    data,
  };
}

@Get('export-asset-fields-excel')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async exportAssetFieldsToExcel(
  @Res() res: Response,
  @Query('search') search?: string,
  @Query('filters') filtersStr?: string,
) {
  try {
    const filters = filtersStr ? JSON.parse(filtersStr) : {};

    const buffer = await this.assetFieldsService.exportFilteredExcelForAssetFields({
      search,
      filters,
    });

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=asset-fields.xlsx',
    });

    res.end(buffer);
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw new BadRequestException('Failed to export asset fields');
  }
}



































  @Get('getAssetStatusTypes')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getAssetStatusTypes() {
    return this.assetFieldsService.getAssetStatusTypes();
  }

  @Get('getAssetWorkingStatusType')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getAssetWorkingStatusType() {
    return this.assetFieldsService.getAssetWorkingStatusType();
  }

  @Get('getAssetOwnershipStatusType')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getAssetOwnershipStatusType() {
    return this.assetFieldsService.getAssetOwnershipStatusType();
  }

  @Post('fetch-single-field-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleFieldData(
    @Query('asset_field_id') asset_field_id: number,
    @Body() deleteAssetFieldDto: DeleteAssetFieldDto,
    @Res() res: Response,
  ) {
    deleteAssetFieldDto.asset_field_id = asset_field_id;
    const response =
      await this.assetFieldsService.fetchSingleFieldData(deleteAssetFieldDto);
    return res.status(response.status).json(response);
  }

  @Post('addAssetField')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  create(@Body() createAssetFieldDto: CreateAssetFieldDto) {
    return this.assetFieldsService.create(createAssetFieldDto);
  }

  @Post('insert-new-asset-field')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createNewVendor(@Body() dto: CreateAssetFieldDto, @Req() req) {
    return this.assetFieldsService.create(dto);
  }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  findAll() {
    return this.assetFieldsService.findAll();
  }

  @Get('getAllFieldCategories')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAllFieldCategories(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.assetFieldsService.findAllFieldCategories();

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


  
 

  @Get('countAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countAll() {
    return this.assetFieldsService.countAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetFieldsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssetFieldDto: UpdateAssetFieldDto,
  ) {
    return this.assetFieldsService.update(+id, updateAssetFieldDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetFieldsService.remove(+id);
  }











 
}
