import { Module } from '@nestjs/common';
import { RolesPermissionsService } from './roles_permissions.service';
import { RolesPermissionsController } from './roles_permissions.controller';
import { RolesPermission } from './entities/roles_permission.entity';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../dynamic-schema/database.module'; // Import DatabaseModule
import * as dotenv from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from 'src/user/user.repository';
import { PermissionsRoles } from './entities/permissions.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from '../organization_register/entities/register-user-login.entity';


dotenv.config(); // Load the .env file

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([RolesPermission, User, UserRepository, PermissionsRoles, Session, RegisterUserLogin]),DatabaseModule
  ],
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService], 
  exports:[RolesPermissionsService]
})
export class RolesPermissionsModule {}
