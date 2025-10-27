import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { Stock } from './entities/stocks.entity';
import { DatabaseModule } from 'src/dynamic-schema/database.module';
import { UserRepository } from 'src/user/user.repository';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity';
import { AssetStockSerialsRepository } from './entities/asset_stock_serials.entity';
import { AssetDatum } from '../asset-data/entities/asset-datum.entity'
import { AssetMappingModule } from 'src/asset-mapping/asset-mapping.module';
import {OrganizationVendors} from "src/organizational-profile/entity/organizational-vendors.entity"
import { ItemLicenceType } from './entities/item_licence_type.entity';
import { AssetDataModule } from '../asset-data/asset-data.module';
import { AssetItem } from '../asset-items/entities/asset-item.entity';



@Module({
 
   imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use environment variable
        signOptions: { expiresIn:process.env.JWT_EXPIRATION },
      }),
      
      TypeOrmModule.forFeature([Stock,UserRepository,AssetMappingRepository,AssetStockSerialsRepository,
        AssetDatum,AssetMappingRepository,OrganizationVendors,ItemLicenceType]),
        DatabaseModule, AssetMappingModule,AssetItem
    
    ],

  controllers: [StocksController],
  providers: [StocksService],
  exports:[StocksService, TypeOrmModule]

})
export class StocksModule {}