import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetMappingService } from './asset-mapping.service';
import { AssetMappingController } from './asset-mapping.controller';
import { AssetMappingRepository } from './entities/asset-mapping.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { UserRepository } from 'src/user/user.repository';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/dynamic-schema/database.module';
import { AssetStockSerialsRepository } from 'src/assets-data/stocks/entities/asset_stock_serials.entity';
import { AssetItem } from 'src/assets-data/asset-items/entities/asset-item.entity';
import { Stock } from 'src/assets-data/stocks/entities/stocks.entity';
import { AssetTransferHistory } from './entities/asset_transfer_history.entity';
import { AssetDatum } from 'src/assets-data/asset-data/entities/asset-datum.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
@Module({
 
 imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([User,AssetMappingRepository,
      AssetStockSerialsRepository,AssetItem,Stock,
      AssetTransferHistory, AssetDatum, Session, RegisterUserLogin]),DatabaseModule
  ],
  controllers: [AssetMappingController],
  providers: [AssetMappingService,UserRepository],
  exports:[ AssetMappingService,TypeOrmModule.forFeature([AssetMappingRepository])]

})
export class AssetMappingModule {}