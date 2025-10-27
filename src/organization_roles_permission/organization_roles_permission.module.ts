import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { JwtModule } from '@nestjs/jwt';

import { OrganizationRolesPermissionService } from './organization_roles_permission.service';
import { OrganizationRolesPermissionController } from './organization_roles_permission.controller';
import { Roles } from './entity/role.entity';
import { Permission } from './entity/permissions.entity';
import { DatabaseModule } from '../dynamic-schema/database.module'; // Import DatabaseModule
import { UserRepository } from '../user/user.repository'; // Import your UserRepository
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([User, Roles, Permission, Session, RegisterUserLogin ]),DatabaseModule
  ],
  providers: [OrganizationRolesPermissionService, UserRepository],
  controllers: [OrganizationRolesPermissionController],
  exports: [OrganizationRolesPermissionService], // Export it so other modules can use it

})
export class OrganizationRolesPermissionModule {}
