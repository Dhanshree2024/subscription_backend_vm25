import { Module } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service';
import { AssetCategoriesController } from './asset-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository

import { AssetDataModule } from '../asset-data/asset-data.module';
import { AssetCategory } from './entities/asset-category.entity';
import { AssetSubcategory } from '../asset-subcategories/entities/asset-subcategory.entity';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { AssetField } from '../asset-fields/entities/asset-field.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';


@Module({

  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([AssetCategory, AssetSubcategory, AssetItem, AssetField, AssetDataModule, User, Session, RegisterUserLogin]) ,DatabaseModule,
  ],
  controllers: [AssetCategoriesController],
  providers: [AssetCategoriesService,UserRepository],
  exports:[AssetCategoriesService]
})
export class AssetCategoriesModule {}
