import { Module } from '@nestjs/common';
import { AssetDepreciationService } from './asset-depreciation.service';
import { AssetDepreciationController } from './asset-depreciation.controller';
import { Stock } from 'src/assets-data/stocks/entities/stocks.entity';
import { AssetItem } from 'src/assets-data/asset-items/entities/asset-item.entity';
import { StocksModule } from 'src/assets-data/stocks/stocks.module';  
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/dynamic-schema/database.module';
import { AssetStockSerialsRepository } from 'src/assets-data/stocks/entities/asset_stock_serials.entity';
import { AssetDepreciationViewEntity } from './entities/asset-depreciation-view.entity';
@Module({
  controllers: [AssetDepreciationController],
  providers: [AssetDepreciationService],
  exports:[AssetDepreciationService],
  imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use environment variable
        signOptions: { expiresIn:process.env.JWT_EXPIRATION },
      }),
      TypeOrmModule.forFeature([
        AssetItem,
        AssetStockSerialsRepository,AssetDepreciationViewEntity
      ]),
      DatabaseModule,
      StocksModule,
    ],
})
export class AssetDepreciationModule {}
