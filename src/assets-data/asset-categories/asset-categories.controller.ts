import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Req, Res, Patch, Query, BadRequestException } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';
import { async } from 'rxjs';


@Controller('assetCategories')
export class AssetCategoriesController {
  constructor(
    private readonly assetCategoriesService: AssetCategoriesService,
  ) {}

  // CREATE MAIN CATEGORY
  // CREATE MAIN CATEGORY
  @Post('insert-new-asset-category')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async create(
    @Body() createAssetCategoryDto: CreateAssetCategoryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const system_user_id = req.cookies.system_user_id;
    const decrypted_system_user_id = decrypt(system_user_id.toString());

    // ✅ Await user ID
    const userId = await this.assetCategoriesService.getUserByPublicID(
      Number(decrypted_system_user_id),
    );
    createAssetCategoryDto.added_by = userId;

    console.log('createAssetCategoryDto :- ', createAssetCategoryDto);

    // ✅ Now create
    const result = await this.assetCategoriesService.create(
      createAssetCategoryDto,
    );

    return res.status(result.status).json(result);
  }

  // GET ALL MAIN CATEGORY
  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.assetCategoriesService.findAll();

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

  // GET ALL MAIN CATEGORY WITH PAGINATION
  // @Get('getAllCategories')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // async getAllCategories(
  //   @Query('page') page: number = 1,
  //   @Query('limit') limit: number = 10,
  //   @Query('search') searchQuery: string = '',
  // ) {
  //   try {
  //     return this.assetCategoriesService.getAllCategories(
  //       page,
  //       limit,
  //       searchQuery,
  //     );
  //   } catch (error) {
  //     return false;
  //   }
  // }

  @Get('getAllCategories')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllCategories(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string, // new param
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

      return this.assetCategoriesService.getAllCategories(
        page,
        limit,
        searchQuery,
        customFilters,
      );
    } catch (error) {
      // You might want to throw or handle the error properly here
      throw error;
    }
  }

  @Get('filterable-columns')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getFilterableColumns() {
    return {
      success: true,
      data: this.assetCategoriesService.getFilterableColumns(),
    };
  }

  // UPDATE/EDIT MAIN CATEGORY
  @Post('update-asset-category')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  updateassetCategory(@Body() updateAssetCategoryDto: UpdateAssetCategoryDto) {
    return this.assetCategoriesService.update(
      updateAssetCategoryDto.main_category_id,
      updateAssetCategoryDto,
    );
  }

  // DELETE MAIN CATEGORY
  @Post('deleteCategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  deleteCategory(@Body() createAssetCategoryDto: CreateAssetCategoryDto) {
    return this.assetCategoriesService.deleteCategory(createAssetCategoryDto);
  }

  @Post('bulkDelete')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkDelete(@Body('main_category_ids') categoryIds: number[]) {
    return this.assetCategoriesService.bulkDeleteCategories(categoryIds);
  }

  // FETCH SINGLE CATEGORY
  @Post('fetch-single-asset-category')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetSubCategoryData(
    @Body() deleteAssetCategoryDto: CreateAssetCategoryDto,
    @Res() res: Response,
  ) {
    const response =
      await this.assetCategoriesService.fetchSingleAssetCategoryData(
        deleteAssetCategoryDto,
      );
    return res.status(response.status).json(response);
  }

  // COUNT ALL CATEGORY
  @Get('countAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countAll() {
    return this.assetCategoriesService.countAll();
  }

  @Get('download-main-category-template')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async downloadMainCategoryTemplate(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const buffer =
        await this.assetCategoriesService.generateCategoryTemplate();
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=main_category_template.xlsx',
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.send(buffer);
    } catch (error) {
      console.error('Error generating main category template:', error);
      res.status(500).send('Failed to generate Excel template');
    }
  }

  @Post('bulkCategories')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateCategories(@Body() dtos: any[], @Req() req: any) {
    const system_user_id = req.cookies.system_user_id;
    const decrypted_system_user_id = decrypt(system_user_id.toString());

    if (decrypted_system_user_id) {
      const result = await this.assetCategoriesService.bulkCreateCategories(
        dtos,
        +decrypted_system_user_id,
      );
      return {
        statusCode: result.status,
        message: result.message,
        data: result.data,
      };
    }
  }

  @Get('exportCatCSV')
  async exportCatCSV() {
    return this.assetCategoriesService.exportCategoryCSV();
  }

  @Get('export-category-excel')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportToExcel(
    @Res() res: Response,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') filtersStr?: string,
  ) {
    let parsedFilters: Record<string, any> = {};

    if (filtersStr) {
      try {
        parsedFilters = JSON.parse(filtersStr);
      } catch (err) {
        throw new BadRequestException('Invalid JSON in customFilters');
      }
    }

    const buffer =
      await this.assetCategoriesService.exportFilteredExcelFromFilters(
        searchQuery,
        parsedFilters,
      );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=asset-categories.xlsx',
    });

    res.end(buffer);
  }

  // main categories for Dropdown
  @Get('categories-for-dropdown-of-filter')
  async getCategoryDropdown() {
    const data = await this.assetCategoriesService.getMainCategoryDropdown();
    return {
      success: true,
      data,
    };
  }

  // ===================================================================

  // @Get('getTitles')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // getTitles() {
  //   return this.assetCategoriesService.getTitles();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.assetCategoriesService.findOne(+id);
  // }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssetCategoryDto: UpdateAssetCategoryDto,
  ) {
    return this.assetCategoriesService.update(+id, updateAssetCategoryDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.assetCategoriesService.remove(+id);
  // }
}
