import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Req,
  Query,
  HttpStatus,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { AssetItemsService } from './asset-items.service';
import { CreateAssetItemNewDto } from './dto/create-asset-item.dto';
import { UpdateAssetItemDto } from './dto/update-asset-item.dto';
import { ApiKeyGuard } from 'src/auth/api-key.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { decrypt } from 'src/common/encryption_decryption/crypto-utils';
import { DeleteAssetItemDto } from './dto/delete-asset-item.dto';
import { GetAssetItemWithRelationsDto } from './dto/get-asset-item-with-relations.dto';
import { FetchAssetItemByIdDto } from './dto/fetch-asset-item-id.dto';

@Controller('assetItems')
export class AssetItemsController {
  constructor(private readonly assetItemsService: AssetItemsService) {}

  // @Post('addAssetItem')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // create(@Body() createAssetItemDto: CreateAssetItemDto) {
  //   return this.assetItemsService.create(createAssetItemDto);
  // }

   @Get('dep-items')
  async getDepreciationList() {
    return this.assetItemsService.getAllDepreciationItems();
  }
  
  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(@Req() req: Request, @Res() res: Response) {
    try {
      const { category_id, sub_category_id, item_id } = req.query;

      console.log('PAYLOAD IDs', category_id, sub_category_id, item_id);
      const result = await this.assetItemsService.findAll({
        category_id: typeof category_id === 'string' ? category_id : undefined,
        sub_category_id:
          typeof sub_category_id === 'string' ? sub_category_id : undefined,
        item_id: typeof item_id === 'string' ? item_id : undefined,
      });

      return res.status(200).json({ result });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Get('getAllItems')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationAllAssetItems(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string,
  ) {
    try {
      console.log('customFiltersStr:=================', customFiltersStr);
      console.log('page', page);
      console.log('limit', limit);

      let customFilters = {};
      if (customFiltersStr) {
        try {
          customFilters = JSON.parse(customFiltersStr);
          console.log('customFilters-point-2', customFilters);
        } catch (err) {
          throw new BadRequestException(
            'Invalid JSON in customFilters parameter',
          );
        }
      }

      const { data, total, currentPage, totalPages } =
        await this.assetItemsService.fetchOrganizationAllAssetItems(
          page,
          limit,
          searchQuery,
          customFilters,
        );

      if (!data || data.length === 0) {
        return {
          success: true,
          message: 'No items found',
          data: [],
        };
      }

      return {
        success: true,
        message: 'Items retrieved successfully',
        data,
        total,
        currentPage,
        totalPages,
      };
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching items',
        error: error.message,
      };
    }
  }

  @Get('export-asset-items-excel')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportAssetItemsToExcel(
    @Res() res: Response,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') filtersStr?: string,
  ) {
    let parsedFilters: Record<string, any> = {};

    if (filtersStr) {
      try {
        parsedFilters = JSON.parse(filtersStr);
      } catch (e) {
        throw new BadRequestException('Invalid customFilters JSON');
      }
    }

    const buffer =
      await this.assetItemsService.exportFilteredExcelForAssetItems({
        search: searchQuery,
        filters: parsedFilters,
      });

    const now = new Date();
    const dateStamp = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
      .getHours()
      .toString()
      .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="asset-items-` + dateStamp + `.xlsx"`,
    );
    res.end(buffer);
  }

  @Get('download-item-template')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async itemTemplate(@Req() req: Request, @Res() res: Response) {
    const buffer = await this.assetItemsService.generateItemTemplate();

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    // Send the buffer as the response
    res.send(buffer);
  }

  // @Post('fetch-asset-item-by-id')
  //   @UseGuards(ApiKeyGuard, JwtAuthGuard)
  //   async fetchAssetItemById(
  //     @Body() fetchAssetItemByIdDto: FetchAssetItemByIdDto,
  //     @Res() res: Response,
  //   ) {
  //     try {
  //       const result = await this.assetItemsService.fetchAssetItemById(fetchAssetItemByIdDto);
  //       return res.status(HttpStatus.OK).json({
  //         status: HttpStatus.OK,
  //         message: 'Asset item fetched successfully.',
  //         data: result.data,
  //       });
  //     } catch (error) {
  //       return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
  //         status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //         message: error.message || 'An error occurred while fetching the asset item.',
  //       });
  //     }
  //   }

  // @Post('deleteAssetItem')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  // deleteAssetItem(@Body() createAssetItemDto: CreateAssetItemDto) {
  //     return this.assetItemsService.deleteAssetItem(createAssetItemDto);
  // }

  @Post('bulk-create-item')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateAssetItems(@Body() dtos, @Req() req: Request) {
    console.log('dtos', dtos);
    const system_user_id = req.cookies.system_user_id;
    const decrypted_system_user_id = decrypt(system_user_id.toString());

    // ✅ This return will work correctly because NestJS handles it
    return await this.assetItemsService.bulkCreateItem(
      dtos,
      Number(decrypted_system_user_id),
    );
  }

  @Get('countAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countAll() {
    return this.assetItemsService.countAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.assetItemsService.findOne(+id);
  // }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssetItemDto: UpdateAssetItemDto,
  ) {
    return this.assetItemsService.update(+id, updateAssetItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetItemsService.remove(+id);
  }

  @Post('insert-new-asset-item')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createNewAssetItem(
    @Body() dto: CreateAssetItemNewDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      const decrypted_system_user_id = decrypt(system_user_id.toString());

      const userId = await this.assetItemsService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );
      dto.added_by = userId;

      const result = await this.assetItemsService.createNewAssetItem(dto);

      return res.status(result.status).json(result);
    } catch (error) {
      console.error('Error in createNewAssetItem controller:', error);

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

  @Post('fetch-single-asset-item')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetItemData(
    @Body() deleteAssetItemDto: DeleteAssetItemDto,
    @Res() res: Response,
  ) {
    const response =
      await this.assetItemsService.fetchSingleAssetItemData(deleteAssetItemDto);
    return res.status(response.status).json(response);
  }

  @Post('update-asset-item')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateItemData(
    @Body() updateItemDto: UpdateAssetItemDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id; // Extract `userId` from cookies
      const decrypted_system_user_id = decrypt(system_user_id.toString());
      this.assetItemsService
        .getUserByPublicID(Number(decrypted_system_user_id))
        .then((userId) => {
          updateItemDto.added_by = userId;
          const updatedItem =
            this.assetItemsService.updateItemData(updateItemDto);
          return res.status(HttpStatus.OK).json({
            status: HttpStatus.OK,
            message: 'Item updated successfully',
            data: updatedItem,
          });
        });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  @Post('bulk-delete-items')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkDeleteItems(
    @Body('asset_item_ids') itemIds: number[],
    @Req() req,
    @Res() res,
  ) {
    const deletedItems = await this.assetItemsService.bulkDeleteItems(itemIds);

    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Items deleted successfully',
      data: deletedItems,
    });
  }

  // asset-items.controller.ts
  @Post('get-asset-item-with-relations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAssetItemWithRelations(
    @Body() getAssetItemWithRelationsDto: GetAssetItemWithRelationsDto,
    @Res() res: Response,
  ) {
    try {
      const { asset_item_id } = getAssetItemWithRelationsDto;
      const result =
        await this.assetItemsService.getAssetItemWithRelations(asset_item_id);
      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Asset item and relations fetched successfully.',
        data: result,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error.message ||
          'An error occurred while fetching asset item details.',
      });
    }
  }

  @Get('filterable-item-columns')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getFilterableItemColumns() {
    return {
      success: true,
      data: this.assetItemsService.getFilterableItemColumns(),
    };
  }
}
