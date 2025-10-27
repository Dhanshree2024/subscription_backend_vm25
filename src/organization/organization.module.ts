import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigRepository } from '../config/config.repository'; // Import ConfigRepository

import * as dotenv from 'dotenv';
dotenv.config(); // Load the .env file

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, ApiKeyGuard],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([]),
  ],
  // imports: [
  //   ConfigModule, // Import ConfigModule to use ConfigRepository
  //   JwtModule.registerAsync({
  //     imports: [ConfigModule], // Ensure ConfigModule is available
  //     inject: [ConfigRepository], // Inject ConfigRepository
  //     useFactory: async (configRepository: ConfigRepository) => {
  //       const secret = await configRepository.getJwtSecret(); // Fetch secret dynamically
  //       console.log(secret);
  //       return {
  //         secret, // Set the secret for JwtModule
  //         signOptions: { expiresIn: '2m' }, // Set token expiration
  //       };
  //     },
  //   }),
  //   TypeOrmModule.forFeature([User, Organization]),
  // ],

  exports: [OrganizationService],
})
export class OrganizationModule {}
