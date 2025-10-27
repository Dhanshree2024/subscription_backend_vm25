import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../../user/user.repository'; // Import your UserRepository
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsStatusService } from './assets-status.service';
import { AssetStatusController } from './assets-status.controller';
import { AssetsStatus } from "./entities/assets-status.entity"
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([AssetsStatus, Session, RegisterUserLogin]),DatabaseModule],
  controllers: [AssetStatusController],
  providers: [AssetsStatusService,UserRepository],
  exports:[AssetsStatusService]
})
export class AssetsStatusModule {}
