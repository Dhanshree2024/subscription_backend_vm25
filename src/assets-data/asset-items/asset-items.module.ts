import { Module } from '@nestjs/common';
import { AssetItemsService } from './asset-items.service';
import { AssetItemsController } from './asset-items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetSubcategory } from '../asset-subcategories/entities/asset-subcategory.entity';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { AssetField } from '../asset-fields/entities/asset-field.entity';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; 
import { AssetDataModule } from '../asset-data/asset-data.module';
import { AssetItemsRelation } from '../asset-items/entities/asset-item-relations.entity';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service';
import { AssetCategoriesModule } from '../asset-categories/asset-categories.module';
import { AssetSubcategoriesService } from '../asset-subcategories/asset-subcategories.service';
import { AssetStockSerialsRepository } from '../stocks/entities/asset_stock_serials.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
// Import DatabaseModule
@Module({
 
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([AssetCategory,AssetSubcategory,
      AssetStockSerialsRepository, 
      AssetItem, AssetItemsRelation, AssetField, AssetDataModule, User, Session, RegisterUserLogin]),
    DatabaseModule,AssetCategoriesModule
  ],
  controllers: [AssetItemsController],
  providers: [AssetItemsService,UserRepository,AssetCategoriesService,
    AssetSubcategoriesService],
  exports: [AssetItemsService], // <-- Exporting AssetItemsService

})
export class AssetItemsModule {}
