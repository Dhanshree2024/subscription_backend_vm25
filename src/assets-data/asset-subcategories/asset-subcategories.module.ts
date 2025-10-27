import { Module } from '@nestjs/common';
import { AssetSubcategoriesService } from './asset-subcategories.service';
import { AssetSubcategoriesController } from './asset-subcategories.controller';
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { AssetSubcategory } from './entities/asset-subcategory.entity';
import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetField } from '../asset-fields/entities/asset-field.entity';
import { AssetDataModule } from '../asset-data/asset-data.module';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetCategoriesModule } from '../asset-categories/asset-categories.module';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';

@Module({
   imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use environment variable
        signOptions: { expiresIn:process.env.JWT_EXPIRATION },
      }),
    TypeOrmModule.forFeature([AssetCategory, AssetSubcategory, AssetItem, AssetField, AssetDataModule, User, Session, RegisterUserLogin]),DatabaseModule,AssetCategoriesModule
    ],
    controllers: [AssetSubcategoriesController],
    providers: [AssetSubcategoriesService,UserRepository,AssetCategoriesService],
})
export class AssetSubcategoriesModule {}
