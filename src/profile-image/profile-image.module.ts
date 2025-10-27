import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileImageService } from './profile-image.service';
import { ProfileImageController } from './profile-image.controller';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { OrganizationalProfile } from 'src/organizational-profile/entity/organizational-profile.entity'; 
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from 'src/user/user.repository';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from '../organization_register/entities/register-user-login.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([User, OrganizationalProfile, UserRepository, Session, RegisterUserLogin  ]), 
  ],
  controllers: [ProfileImageController],
  providers: [ProfileImageService],
})
export class ProfileImageModule {}
