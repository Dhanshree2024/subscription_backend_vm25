import { Module } from '@nestjs/common';
import { AssetWorkingStatusService } from './asset-working-status.service';
import { AssetWorkingStatusController } from './asset-working-status.controller';

import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { AssetWorkingStatus } from './entities/asset-working-status.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';


@Module({

   imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET, // Use environment variable
        signOptions: { expiresIn:process.env.JWT_EXPIRATION },
      }),
    TypeOrmModule.forFeature([AssetWorkingStatus, UserRepository, Session, RegisterUserLogin]),DatabaseModule
    ],

  controllers: [AssetWorkingStatusController],
  providers: [AssetWorkingStatusService],
  exports:[AssetWorkingStatusService]
})
export class AssetWorkingStatusModule {}
