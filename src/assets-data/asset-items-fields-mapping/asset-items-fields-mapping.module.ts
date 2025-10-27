import { Module } from '@nestjs/common';
import { AssetItemsFieldsMappingService } from './asset-items-fields-mapping.service';
import { AssetItemsFieldsMappingController } from './asset-items-fields-mapping.controller';
import { AssetItemsFieldsMapping } from './entities/asset-items-fields-mapping.entity';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetField } from '../asset-fields/entities/asset-field.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { AssetFieldCategory } from '../asset-fields/entities/asset-field-category.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';

@Module({
    imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use environment variable
        signOptions: { expiresIn:process.env.JWT_EXPIRATION },
      }),
    TypeOrmModule.forFeature([AssetItemsFieldsMapping, AssetField, User, AssetFieldCategory, Session, RegisterUserLogin]),DatabaseModule
    ],
    controllers: [AssetItemsFieldsMappingController],
    providers: [AssetItemsFieldsMappingService,UserRepository],
    exports:[AssetItemsFieldsMappingService]
})
export class AssetItemsFieldsMappingModule {}
