import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Req, Res,Patch, Query, BadRequestException } from '@nestjs/common';
import { AssetItemsFieldsMappingService } from './asset-items-fields-mapping.service';
import { CreateAssetItemsFieldsMappingDto } from './dto/create-asset-items-fields-mapping.dto';
import { UpdateAssetItemsFieldsMappingDto } from './dto/update-asset-items-fields-mapping.dto';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { AssetItemsFieldsMapping } from './entities/asset-items-fields-mapping.entity';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';

@Controller('assetItemsFieldsMapping')
export class AssetItemsFieldsMappingController {
  constructor(
    private readonly assetItemsFieldsMappingService: AssetItemsFieldsMappingService,
  ) {}

  @Post()
  create(
    @Body() createAssetItemsFieldsMappingDto: CreateAssetItemsFieldsMappingDto,
  ) {
    return this.assetItemsFieldsMappingService.create(
      createAssetItemsFieldsMappingDto,
    );
  }

  @Post('insertItemFields')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async insertItemFields(
    @Body() createAssetItemFieldsMappingDto: CreateAssetItemsFieldsMappingDto[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id; // Extract user ID from cookies

      if (!system_user_id) {
        return res
          .status(400)
          .json({ message: 'User ID not found in cookies' });
      }

      const decrypted_system_user_id = decrypt(system_user_id.toString());

      console.log('userId Check Item ', decrypted_system_user_id);

      // ✅ Fix: Call getUserByPublicID() from the correct service
      const userId =
        await this.assetItemsFieldsMappingService.getUserByPublicID(
          Number(decrypted_system_user_id),
        );

      console.log('userId', userId);

      // Assign userId to each item in the DTO array
      createAssetItemFieldsMappingDto.forEach((item) => {
        if (item && typeof item === 'object') {
          item.aif_added_by = userId;
        }
      });

      const result = await this.assetItemsFieldsMappingService.addItemFields(
        createAssetItemFieldsMappingDto,
      );

      return res.status(200).json({ result });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  findAll() {
    return this.assetItemsFieldsMappingService.findAll();
  }

  @Get('countAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  countAll() {
    return this.assetItemsFieldsMappingService.countAll();
  }

  @Get('findItemFields')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  findItemFields(
    @Query('asset_item_id') asset_item_id: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('customFilters') customFiltersStr?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    let parsedFilters = {};
    if (customFiltersStr) {
      try {
        parsedFilters = JSON.parse(customFiltersStr);
      } catch (err) {
        throw new BadRequestException('Invalid customFilters JSON');
      }
    }

    return this.assetItemsFieldsMappingService.findItemFields(
      asset_item_id,
      searchQuery,
      parsedFilters,
      sortOrder,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetItemsFieldsMappingService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssetItemsFieldsMappingDto: UpdateAssetItemsFieldsMappingDto,
  ) {
    return this.assetItemsFieldsMappingService.update(
      +id,
      updateAssetItemsFieldsMappingDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetItemsFieldsMappingService.remove(+id);
  }
}
