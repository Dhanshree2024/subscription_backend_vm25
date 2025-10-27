import { Module } from '@nestjs/common';
import { AssetFieldsService } from './asset-fields.service';
import { AssetFieldsController } from './asset-fields.controller';
import { AssetField } from './entities/asset-field.entity';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from 'src/user/user.repository';
import { AssetFieldCategory } from './entities/asset-field-category.entity';
import { AssetStatusTypes } from './entities/asset-status-types.entity';
import { AssetWorkingStatusTypes } from './entities/asset-working-status-types.entity';
import { AssetOwnershipStatusTypes } from './entities/asset-ownership-status-types.entity';
import { AssetCategory } from '../asset-categories/entities/asset-category.entity';
import { AssetSubcategory } from '../asset-subcategories/entities/asset-subcategory.entity';
import { AssetItem } from '../asset-items/entities/asset-item.entity';
import { AssetDataModule } from '../asset-data/asset-data.module';
import { User } from 'src/user/user.entity';
import { AssetDatum } from '../asset-data/entities/asset-datum.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';


@Module({

   imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET, // Use environment variable
          signOptions: { expiresIn:process.env.JWT_EXPIRATION },
        }),
    TypeOrmModule.forFeature([AssetField, AssetStatusTypes, AssetWorkingStatusTypes, AssetOwnershipStatusTypes, AssetFieldCategory, Session, RegisterUserLogin]),DatabaseModule
      ],
      controllers: [AssetFieldsController],
      providers: [AssetFieldsService,UserRepository],
})
export class AssetFieldsModule {}
