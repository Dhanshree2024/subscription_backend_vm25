import { Module } from '@nestjs/common';
import { AssetDataService } from './asset-data.service';
import { AssetDataController } from './asset-data.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetSubcategory } from '../asset-subcategories/entities/asset-subcategory.entity';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { AssetField } from '../asset-fields/entities/asset-field.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { AssetDatum } from './entities/asset-datum.entity';
import { AssetStatusTypes } from '../asset-fields/entities/asset-status-types.entity';
import { AssetWorkingStatusTypes } from '../asset-fields/entities/asset-working-status-types.entity';
import { AssetOwnershipStatusTypes } from '../asset-fields/entities/asset-ownership-status-types.entity';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service';
import { AssetSubcategoriesService } from '../asset-subcategories/asset-subcategories.service';
import { AssetItemsService } from '../asset-items/asset-items.service';
import { OrganizationService } from 'src/organizational-profile/organizational-profile.service';
import { OrganizationalProfileModule } from 'src/organizational-profile/organizational-profile.module';
import { StocksModule } from '../stocks/stocks.module';
import { AssetOwnershipStatusModule } from '../asset-ownership-status/asset-ownership-status.module';
import { AssetsStatusModule } from '../assets-status/assets-status.module';
import { AssetWorkingStatusModule } from '../asset-working-status/asset-working-status.module';
import { Stock } from '../stocks/entities/stocks.entity';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity'; 
import { AssetMappingModule } from 'src/asset-mapping/asset-mapping.module';
import { AssetItemsFieldsMappingModule } from '../asset-items-fields-mapping/asset-items-fields-mapping.module';
import { AssetItemsFieldsMapping } from '../asset-items-fields-mapping/entities/asset-items-fields-mapping.entity';
import { AssetStockSerialsRepository } from '../stocks/entities/asset_stock_serials.entity';

@Module({
    imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use environment variable
        signOptions: { expiresIn:process.env.JWT_EXPIRATION },
      }),
      TypeOrmModule.forFeature([AssetCategory,AssetSubcategory,AssetItem,
        AssetField,AssetDataModule,User,AssetDatum,AssetStatusTypes,AssetStockSerialsRepository,
        AssetWorkingStatusTypes,AssetOwnershipStatusTypes,Stock,AssetMappingRepository,AssetItemsFieldsMapping])
        ,DatabaseModule,OrganizationalProfileModule,StocksModule,AssetOwnershipStatusModule,AssetsStatusModule,AssetWorkingStatusModule,AssetMappingModule,AssetItemsFieldsMappingModule
    ],
    controllers: [AssetDataController],
    providers: [AssetDataService,UserRepository,AssetCategoriesService,AssetSubcategoriesService,AssetItemsService],
  
})
export class AssetDataModule {}
