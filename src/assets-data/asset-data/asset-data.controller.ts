import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Req, Res,Patch,Query, HttpStatus, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AssetDataService } from './asset-data.service';
import { CreateAssetDatumDto } from './dto/create-asset-datum.dto';
import { UpdateAssetDatumDto } from './dto/update-asset-datum.dto';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';

@Controller('asset-data')
export class AssetDataController {
  constructor(private readonly assetDataService: AssetDataService) {}

  // @Post()
  // create(@Body() createAssetDatumDto: CreateAssetDatumDto) {
  //   return this.assetDataService.create(createAssetDatumDto);
  // }

  @Get('filterable-columns')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getFilterableColumns() {
    return {
      success: true,
      data: this.assetDataService.getFilterableColumns(),
    };
  }

  // Controller
  @Get('export-assets-excel')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportAssetsToExcel(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string,
    @Query('asset_main_category_id') asset_main_category_id?: number,
    @Query('asset_sub_category_id') asset_sub_category_id?: number,
    @Query('asset_item_id') asset_item_id?: number,
    @Query('unused') unused?: boolean,
  ) {
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

      // Use the provided pagination parameters
      const { data } = await this.assetDataService.findAll(
        asset_main_category_id ?? null,
        asset_sub_category_id ?? null,
        asset_item_id ?? null,
        page,
        limit,
        searchQuery,
        unused,
        customFilters,
      );

      // Generate Excel
      const buffer =
        await this.assetDataService.exportFilteredExcelForAssets(data);

      // Set headers & return file
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=assets-page-${Date.now()}.xlsx`,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.send(buffer);
    } catch (error) {
      console.error('Error in export:', error);
      throw new InternalServerErrorException('Failed to generate Excel export');
    }
  }
  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(
    @Query('asset_main_category_id') asset_main_category_id: number,
    @Query('asset_sub_category_id') asset_sub_category_id: number,
    @Query('asset_item_id') asset_item_id: number,
    @Query('unused') unused: boolean = false,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string,
  ) {
    try {
      let customFilters = {};
      if (customFiltersStr) {
        try {
          customFilters = JSON.parse(customFiltersStr);
          console.log('Parsed customFilters:', customFilters);
        } catch (err) {
          throw new BadRequestException(
            'Invalid JSON in customFilters parameter',
          );
        }
      }

      const result = await this.assetDataService.findAll(
        asset_main_category_id,
        asset_sub_category_id,
        asset_item_id,
        page,
        limit,
        searchQuery,
        unused,
        customFilters,
      );

      const { data, total, currentPage, totalPages, message } = result;

      return {
        success: true,
        message: message || 'Assets fetched successfully',
        data,
        total,
        currentPage,
        totalPages,
      };
    } catch (error) {
      console.error('Error in getAll controller:', error);
      return {
        success: false,
        message: 'An error occurred while fetching data',
        error: error.message,
      };
    }
  }

  @Post('insertAsset')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async insertAsset(
    @Body() createAssetDatumDto: CreateAssetDatumDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      const decrypted_system_user_id = decrypt(system_user_id.toString());
      const userId = await this.assetDataService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );

      createAssetDatumDto.asset_added_by = userId;

      const result = await this.assetDataService.addAsset(createAssetDatumDto); // ✅ await here

      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Asset insert failed.' });
    }
  }

  @Get('download-Asset-template')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async generateAssetTemplate(
    @Query('categoryId') categoryId: number,
    @Query('subCategoryId') subCategoryId: number,
    @Query('asset_item_id') asset_item_id: number,
    @Query('licence_id') licence_id: number,
    @Req()
    req: Request,
    @Res() res: Response,
  ) {
    console.log('contoller==:', asset_item_id);
    console.log('contoller==:', subCategoryId);
    console.log('contoller==:', categoryId);
    console.log('contoller==:', licence_id);

    const buffer = await this.assetDataService.generateAssetTemplate(
      +categoryId,
      +subCategoryId,
      +asset_item_id,
      +licence_id,
    );
    res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  // @Post('bulk-create-asset')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // async bulkCreateAssets(
  //   @Body() dtos,
  //   @Req() req: Request,
  //   @Res() res: Response
  // ) {
  //   try {
  //     const system_user_id = req.cookies.system_user_id;
  //     if (!system_user_id) {
  //       return res.status(401).json({ message: 'Unauthorized: Missing user ID in cookies' });
  //     }

  //     const user_id = decrypt(system_user_id.toString());

  //     this.assetDataService.getUserByPublicID(Number(user_id))
  //     .then((userId) => {

  //       const result = this.assetDataService.bulkCreateAssets(dtos,userId);
  //       return res.status(200).json({
  //         result
  //       });

  //     })

  //     // Access the properties within the returned object
  //     // const { created_count, created_items, error_items } = result.data;

  //     // return res.status(result.status).json({
  //     //   message: result.message,
  //     //   successCount: created_count,
  //     //   errorCount: error_items.length,
  //     //   successItems: created_items,
  //     //   errorItems: error_items,
  //     // });

  //   } catch (error) {
  //     return res.status(500).json({
  //       message: 'Server error during bulk asset creation',
  //       error: error.message,
  //     });
  //   }
  // }

  @Post('bulk-create-asset1')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateAssets1(
    @Body() dtos,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      if (!system_user_id) {
        return res
          .status(401)
          .json({ message: 'Unauthorized: Missing user ID in cookies' });
      }

      const user_id = decrypt(system_user_id.toString());

      const userId = await this.assetDataService.getUserByPublicID(
        Number(user_id),
      );
      const result = await this.assetDataService.bulkCreateAssets(dtos, userId);

      return res.status(200).json({ result });
    } catch (error) {
      return res.status(500).json({
        message: 'Server error during bulk asset creation',
        error: error.message,
      });
    }
  }
  // s:Updated bulk asset create service for both licencable and non licencable item
  @Post('bulk-create-asset')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateAssets(
    @Body() dtos,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      if (!system_user_id) {
        return res
          .status(401)
          .json({ message: 'Unauthorized: Missing user ID in cookies' });
      }

      const user_id = decrypt(system_user_id.toString());
      const userId = await this.assetDataService.getUserByPublicID(
        Number(user_id),
      );

      const result = await this.assetDataService.bulkCreateAssets(dtos, userId);

      // ✅ Use the status code provided by the service
      return res.status(result.status).json(result);
    } catch (error) {
      // ✅ Keep error format consistent
      return res.status(500).json({
        message: 'Server error during bulk asset creation',
        error: error.message,
      });
    }
  }

  @Get('getAllAssets')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllAssets(
    @Query('asset_main_category_id') asset_main_category_id: number,
    @Query('asset_sub_category_id') asset_sub_category_id: number,
    @Query('asset_item_id') asset_item_id: number,
  ) {
    try {
      return this.assetDataService.getAllAssets(
        asset_main_category_id,
        asset_sub_category_id,
        asset_item_id,
      );
    } catch (error) {
      return false;
    }
  }

  @Get('exportAssetList')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportAssetList(
    @Query('asset_main_category_id') asset_main_category_id: number,
    @Query('asset_sub_category_id') asset_sub_category_id: number,
    @Query('asset_item_id') asset_item_id: number,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      const responseData = this.assetDataService.exportCSVData(
        asset_main_category_id,
        asset_sub_category_id,
        asset_item_id,
        searchQuery,
      );
      return responseData;
    } catch (error) {
      return false;
    }
  }

  @Get('countAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countAll() {
    return this.assetDataService.countAll();
  }

  @Post('bulkdeleteAsset')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteAsset(
    @Body() assetIds: number[],
    @Req() req: Request,
    @Res() res: Response,
  ) {

    try {
      
      console.log('assetIds', assetIds);

      if (!Array.isArray(assetIds) || assetIds.length === 0) {
        throw new BadRequestException('No asset IDs provided.');
      }

      const result = await this.assetDataService.bulkDeleteAssets(assetIds);

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error('Error in deleteAsset controller:', error);
      return res
        .status(
          error instanceof BadRequestException
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR,
        )
        .json({
          status:
            error instanceof BadRequestException
              ? HttpStatus.BAD_REQUEST
              : HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during asset deletion.',
        });
    }
  }


  @Get('getAssetByItemCategorySubCategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  findItemFields(
    @Query('asset_item_id') asset_item_id: number,
    @Query('asset_category_id') asset_category_id: number,
    @Query('asset_subcategory_id') asset_subcategory_id: number,
  ) {
    return this.assetDataService.findItemByItemCategorySubCategory(
      asset_item_id,
      asset_category_id,
      asset_subcategory_id,
    );
  }

  @Get('countAssetByCategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async countByCategory(@Query('asset_category_id') asset_category_id: number) {
    return this.assetDataService.countByCategory(asset_category_id);
  }

  @Get('countByCategoryy')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countByCategoryy() {
    return this.assetDataService.countByCategoryy();
  }

  @Get('getAssetCategorySubCategoryItemName')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getAssetCategorySubCategoryItemName(
    @Query('asset_item_id') asset_item_id: number,
  ) {
    return this.assetDataService.getAssetCategorySubCategoryItemName(
      asset_item_id,
    );
  }

  @Get('getSingleAsset')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  findSingleAsset(@Query('asset_id') asset_id: number) {
    return this.assetDataService.findSingleAsset(asset_id);
  }

  @Post('updateAssetInfo')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  updateAssetInfo(
    @Body() updateAssetsDatumDto: UpdateAssetDatumDto,
    @Req() req,
    @Res() res,
  ) {
    //console.log(createAssetsDatumDto);
    const updatedAsset =
      this.assetDataService.updateAssetInfo(updateAssetsDatumDto);
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Asset Updated successfully',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetDataService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssetDatumDto: UpdateAssetDatumDto,
  ) {
    return this.assetDataService.update(+id, updateAssetDatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetDataService.remove(+id);
  }

  // Asset detail page controllers
  // passs id in body later
  @Get(':asset_id')
  async getAssetsByAssetId(@Param('asset_id') asset_id: number) {
    return this.assetDataService.getAssetsByAssetId(asset_id);
  }

  // @Get('getAllAssets-iD')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // async getAllAssets(@Query('asset_main_category_id') asset_main_category_id: number,@Query('asset_sub_category_id') asset_sub_category_id: number,
  // @Query('asset_item_id') asset_item_id: number) {

  //   try {
  //     return this.assetDataService.getAllAssets(asset_main_category_id,asset_sub_category_id,asset_item_id);
  //   } catch (error) {
  //     return false
  //   }
  // }
}
