
import { Controller,Body, Post, Req,UsePipes, ValidationPipe, UseGuards, HttpException, HttpStatus, Get, Query, Param, Put, BadRequestException, Res } from '@nestjs/common';


import { CreateStockDto } from './dto/create-stock.dto';
import { StocksService } from './stocks.service';

import { ApiKeyGuard } from 'src/auth/api-key.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { Stock } from './entities/stocks.entity';
import { StockListDto } from './dto/stock-list.dto';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';

import { CreateAssetStockSerialsDto } from "./dto/create-assetstock-serial.dto"
import { AssetMappingService } from 'src/asset-mapping/asset-mapping.service';
import { ItemLicenceType } from './entities/item_licence_type.entity';

@Controller('stocks')
export class StocksController {
  constructor(
    private readonly stockService: StocksService,
    private readonly assetMappingService: AssetMappingService,
  ) {}

  @Post('create-stock')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createStocks(
    @Body() createStockDto: CreateStockDto,
    @Req() req: Request,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id; // Extract userId from cookies
      const decrypted_system_user_id = decrypt(system_user_id.toString());
      const userId = await this.stockService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );

      createStockDto.created_by = userId; // Assign the user ID

      const result = await this.stockService.createStocks(createStockDto);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to create stock.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-stock2')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createStocks2(
    @Body() createStockDto: CreateStockDto,
    @Req() req: Request,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;

      if (!system_user_id) {
        throw new HttpException(
          'Unauthorized: No user ID found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const decrypted_system_user_id = decrypt(system_user_id.toString());
      const userId = await this.stockService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );

      createStockDto.created_by = userId;

      const result = await this.stockService.createStocks2(createStockDto);

      return result;
    } catch (error) {
      console.error('Error creating stock:', error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to create stock.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // stock.controller.ts

@Get('validate-serial-license')
async validateSerialOrLicense(
  @Query('serial') serial?: string,
  @Query('license') license?: string,
): Promise<{ isDuplicate: boolean }> {
  return this.stockService.validateSerialOrLicense(serial, license);
}


  @Get('export-stocks-excel')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportStocksToExcel(
    @Res() res: Response,
       @Query('page') page: number = 1,
       @Query('limit') limit: number = 10,
       @Query('search') searchQuery: string = '',
       @Query('customFilters') customFiltersStr?: string,
       @Query('asset_id') asset_id?: number, 
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

     const { data } = await this.stockService.findAllStocks(
       page,
      limit,
      searchQuery,
      customFilters,
      asset_id,
      );

    const buffer =
      await this.stockService.exportFilteredExcelForStocks(data);

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stock-list_${dateStamp}.xlsx"`,
    );
    res.end(buffer);
  }

  @Get('stocklist')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllStocks(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('customFilters') customFiltersStr?: string,
    @Query('asset_id') assetId?: number,
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

      const result = await this.stockService.findAllStocks(
        page,
        limit,
        searchQuery,
        customFilters,
        assetId,
      );

      const { data, total, currentPage, totalPages, message } = result;

      return {
        success: true,
        message: message || 'Stocks fetched successfully',
        data,
        total,
        currentPage,
        totalPages,
      };
    } catch (error) {
      console.error('Error in getAllStocks controller:', error);
      return {
        success: false,
        message: 'An error occurred while fetching stock list',
        error: error.message,
      };
    }
  }

  /// software count
  // asset-stock-serials.controller.ts
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  @Get('get-softwares')
  async getSoftwares() {
    return this.stockService.getSoftwares();
  }

  ///VKs code  adding again
  @Get('stocklist-with-unique-ids')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAllWithUniqueIds(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('stock_id') stock_id: number,
  ) {
    try {
      return this.stockService.fetchStockListWithUniqueIds(
        page,
        limit,
        searchQuery,
        stock_id,
      );
    } catch (error) {
      return false;
    }
  }

  @Get('stocklist-with-unique-ids2')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAllWithUniqueIds2(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Query('asset_id') asset_id: number,
  ) {
    try {
      //console.log('Received asset_id:', asset_id);

      return this.stockService.fetchStockListWithUniqueIds2(
        page,
        limit,
        searchQuery,
        asset_id,
      );
    } catch (error) {
      return false;
    }
  }

  // get-asset-serials-with-vendor
  @Get('get-asset-serials-with-vendor')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAssetSerialsWithVendorController(
    @Query('asset_id') asset_id: number,
    @Query('stock_id') stock_id: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!asset_id || !stock_id) {
      throw new BadRequestException('Both asset_id and stock_id are required');
    }

    try {
      return await this.stockService.getAssetSerialsWithVendor(
        +asset_id,
        +stock_id,
        +page,
        +limit,
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch asset serials with vendor',
      );
    }
  }

  @Get('get-single-asset-stock-qty')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetStockQty(@Query('asset_id') asset_id) {
    return this.stockService.fetchSingleAssetStockQty(asset_id);
  }

  @Get('get-single-asset-available-assigned-qty')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleAssetAvailableQty(@Query('asset_id') asset_id) {
    return this.stockService.fetchSingleAssetAvailableQty(asset_id);
  }

  // S: Get all stock serials for a specific asset

  @Get('get-asset-stock-serials')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllAssetStockSerials(
    @Query('asset_id') asset_id: number,
    @Query('stock_id') stock_id: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!asset_id || !stock_id) {
      throw new BadRequestException('Both asset_id and stock_id are required');
    }

    try {
      return await this.stockService.getAllAssetStockSerials(
        asset_id,
        stock_id,
        page,
        limit,
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch asset stock serials',
      );
    }
  }

  // S: get all stock info of single stock-table
  @Get('get-single-stock-information')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getSingleStockInformation(@Query('stock_id') stock_id: number) {
    return this.stockService.getAllStockInformation(stock_id);
  }

  // S: get all information of stock serials for a specific asset
  @Get('get-single-unique-asset-stock-information')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getSingleAssetStockSerials(
    @Query('asset_stocks_unique_id') asset_stocks_unique_id: number,
  ) {
    return this.stockService.getSingleAssetStockSerials(asset_stocks_unique_id);
  }

  // unique asset information
  @Get('get-single-unique-asset-information')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getSingleAssetInformation(
    @Query('stock_id') stock_id: number,
    @Query('mapping_id') mapping_id: number,
    @Query('asset_stocks_unique_id') asset_stocks_unique_id: number,
  ) {
    // const single_stock_information = this.stockService.getAllStockInformation(stock_id);
    // const unique_asset_information = this.stockService.getSingleAssetStockSerials(asset_stocks_unique_id);
    // const single_asset_mapping_information = this.assetMappingService.getSingleAssetMapping(mapping_id);
    try {
      const [
        single_stock_information,
        unique_asset_information,
        single_asset_mapping_information,
      ] = await Promise.all([
        this.stockService.getAllStockInformation(stock_id),
        this.stockService.getSingleAssetStockSerials(asset_stocks_unique_id),
        this.assetMappingService.getSingleAssetMapping(mapping_id),
      ]);

      return {
        status: 200,
        message: 'Data fetched successfully',
        data: {
          single_stock_information,
          unique_asset_information,
          single_asset_mapping_information,
        },
      };
    } catch (error) {
      console.error('Error fetching asset data:', error);
      return {
        status: 500,
        message: 'Failed to fetch asset data',
        error: error.message || 'Internal Server Error',
      };
    }
  }

  // S:mapping controllers
  @Post('create-asset-to-asset-mapping')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async mapAssetToAsset(
    @Body()
    body: {
      asset_id: number;
      asset_stocks_unique_id: number;
      mapped_ids: number[];
    },
  ) {
    console.log('Mapping body:', body);

    const updatedRecord = await this.stockService.createAssetToAssetMapping(
      body.asset_id,
      body.asset_stocks_unique_id,
      body.mapped_ids,
    );

    return {
      message: 'Mapping updated successfully',
      data: updatedRecord, // This should return the updated row
    };
  }


  @Post('detach-asset-to-asset')
async detachAssetFromAsset(
  @Body() body: { asset_id: number; asset_stocks_unique_id: number; detached_ids: number[] },
) {
  const result = await this.stockService.detachAssetFromAsset(
    body.asset_id,
    body.asset_stocks_unique_id,
    body.detached_ids,
  );

  return {
    message: 'Mapping(s) detached successfully',
    data: result,
  };
}


  @Get('get-all-asset-to-asset-mapping')
  async getMapping(
    @Query('asset_id') assetId: number,
    @Query('asset_stocks_unique_id') assetStocksUniqueId: number,
  ) {
    const result = await this.stockService.getMappingWithNames(
      assetId,
      assetStocksUniqueId,
    );
    return {
      message: 'Mapping fetched successfully',
      data: result,
    };
  }

  @Get('get-all-licence-type')
  async getAllLicences(): Promise<ItemLicenceType[]> {
    return this.stockService.findAllLicenceType();
  }

  // ===================
}
