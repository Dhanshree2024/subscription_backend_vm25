

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetOwnershipStatus } from "./entities/asset-ownership-status.entity"

import { AssetOwnershipStatusService } from './asset-ownership-status.service';
import { AssetOwnershipStatusController } from './asset-ownership-status.controller';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';


@Module({
  imports:[
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([AssetOwnershipStatus, Session, RegisterUserLogin]),DatabaseModule],
  controllers: [AssetOwnershipStatusController],
  providers: [AssetOwnershipStatusService,UserRepository],
  exports:[AssetOwnershipStatusService]
})
export class AssetOwnershipStatusModule {}
