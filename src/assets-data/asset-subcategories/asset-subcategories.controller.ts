import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, Query, HttpStatus, BadRequestException, HttpException } from '@nestjs/common';
import { AssetSubcategoriesService } from './asset-subcategories.service';
import { CreateAssetSubcategoryDto } from './dto/create-asset-subcategory.dto';
import { UpdateAssetSubcategoryDto } from './dto/update-asset-subcategory.dto';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { decrypt } from 'src/common/encryption_decryption/crypto-utils';
import { DeleteAssetSubCategoryDto } from './dto/delete-asset-subcategory.dto';
import { exit } from 'process';




@UseGuards(ApiKeyGuard, JwtAuthGuard)
@Controller('assetSubCategories')
export class AssetSubcategoriesController {
  constructor(
    private readonly assetSubcategoriesService: AssetSubcategoriesService,
  ) {}

  @Post('addAssetSubCategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  create(@Body() createAssetSubcategoryDto: CreateAssetSubcategoryDto) {
    return this.assetSubcategoriesService.create(createAssetSubcategoryDto);
  }

  // GET ALL SUB CATEGORIES WITH PAGINATION FOR LIST VIEW
  @Get('export-subcategory-excel')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportToExcel(
    @Query('search') search: string = '',
    @Query('customFilters') customFiltersStr: string = '{}',
    @Res() res: Response,
  ) {
    let parsedFilters: Record<string, any> = {};
    console.log('1');

    try {
      parsedFilters = JSON.parse(customFiltersStr);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in customFilters');
    }

    const buffer =
      await this.assetSubcategoriesService.exportFilteredExcelForSubCategories({
        search,
        filters: parsedFilters,
      });

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="asset-sub-categories_${dateStamp}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('getAllSubCategories')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllSubCategories(
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

      return this.assetSubcategoriesService.getAllSubCategories(
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
  // @Get('export-subcategory-excel')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // async exportSubCategoriesToExcel(
  //   @Res() res: Response,
  //   @Query('search') search = '',
  //   @Query('customFilters') customFilters?: string,
  // ) {
  //   let parsedFilters: Record<string, any> = {};

  //   if (customFilters) {
  //     try {
  //       parsedFilters = JSON.parse(customFilters);
  //     } catch (err) {
  //       console.error('Invalid customFilters JSON:', err);
  //       throw new BadRequestException('Invalid filters format');
  //     }
  //   }

  //   const buffer =
  //     await this.assetSubcategoriesService.exportFilteredExcelForSubCategories({
  //       search,
  //       filters: parsedFilters,
  //     });

  //   const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  //   res.setHeader(
  //     'Content-Type',
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //   );
  //   res.setHeader(
  //     'Content-Disposition',
  //     `attachment; filename="asset-sub-categories_${dateStamp}.xlsx"`,
  //   );
  //   res.end(buffer);
  // }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.assetSubcategoriesService.findAll();

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

  @Get('exportSubCatCSV')
  async exportUsersCSV() {
    return this.assetSubcategoriesService.exportSubcategoryCSV();
  }

  @Get('countAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countAll() {
    return this.assetSubcategoriesService.countAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.assetSubcategoriesService.findOne(+id);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.assetSubcategoriesService.remove(+id);
  // }

  @Post('insert-new-asset-subcategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createNewAssetItem(
    @Body() dto: CreateAssetSubcategoryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      const decrypted_system_user_id = decrypt(system_user_id.toString());

      const userId = await this.assetSubcategoriesService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );
      dto.added_by = userId;

      const result =
        await this.assetSubcategoriesService.createNewAssetSubCategory(dto);

      return res.status(result.status).json(result);
    } catch (error) {
      console.error('Error in createNewAssetItem:', error);

      if (error instanceof HttpException) {
        const response = error.getResponse();
        return res.status(error.getStatus()).json(response);
      }

      return res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
      });
    }
  }

  @Get('download-subcategory-template')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async generateSubcategoryTemplateController(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Generate the Excel template buffer
      const buffer =
        await this.assetSubcategoriesService.generateSubCategoryExcleTemplate();

      // Set headers for the file download
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=template.xlsx',
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      // Send the buffer as the response to trigger the download
      res.send(buffer);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).send('Failed to generate Excel template');
    }
  }

  @Post('bulkSubcategories')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateSubcategories(@Body() dtos: any[], @Req() req: any) {
    const system_user_id = req.cookies.system_user_id;
    const decrypted_system_user_id = decrypt(system_user_id.toString());

    if (decrypted_system_user_id) {
      const result =
        await this.assetSubcategoriesService.bulkCreateSubcategories(
          dtos,
          +decrypted_system_user_id,
        );

      return {
        statusCode: result.status,
        message: result.message,
        data: result.data,
      };
    } else {
      return {
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing user ID.',
        data: null,
      };
    }
  }

  @Post('fetch-single-asset-subcategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetSubCategoryData(
    @Body() deleteAssetItemDto: DeleteAssetSubCategoryDto,
    @Res() res: Response,
  ) {
    const response =
      await this.assetSubcategoriesService.fetchSingleAssetSubCategoryData(
        deleteAssetItemDto,
      );
    return res.status(response.status).json(response);
  }

  @Post('update-asset-subcategory')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateSubCategoryData(
    @Body() updateItemDto: UpdateAssetSubcategoryDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const updatedItem =
        await this.assetSubcategoriesService.updateSubCategoryData(
          updateItemDto,
        );

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'SubCategory updated successfully',
        data: updatedItem.data,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('bulkDeleteSubCategories')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkDeleteSubCategories(
    @Body('sub_category_ids') subCategoryIds: number[],
    @Res() res: Response,
  ) {
    try {
      if (!Array.isArray(subCategoryIds) || subCategoryIds.length === 0) {
        throw new BadRequestException(
          'No subcategory IDs provided for deletion.',
        );
      }

      const result =
        await this.assetSubcategoriesService.bulkDeleteSubCategories(
          subCategoryIds,
        );

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Subcategories deleted successfully',
        data: result,
      });
    } catch (error) {
      console.error('Bulk Delete Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: HttpStatus.BAD_REQUEST,
        message: error.message || 'Error occurred while deleting subcategories',
        details: error.response?.details || null,
      });
    }
  }

  @Get('filterable-subcategory-columns')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getFilterableSubCategoryColumns() {
    return {
      success: true,
      data: this.assetSubcategoriesService.getFilterableColumns(),
    };
  }

  @Get('subcategories-for-dropdown-of-filter')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getSubCategoryDropdown() {
    const data = await this.assetSubcategoriesService.getSubCategoryDropdown();
    return {
      success: true,
      data,
    };
  }
}


  
    

