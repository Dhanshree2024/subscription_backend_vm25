import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigRepository } from '../config/config.repository'; // Import ConfigRepository
import { UserRepository } from '../user/user.repository'; // Import your UserRepository
import { User } from '../user/user.entity'; // Path to User entity


import * as dotenv from 'dotenv';
dotenv.config(); // Load the .env file

@Module({
  providers: [EmployeeService, ApiKeyGuard, UserRepository],
  controllers: [EmployeeController],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([User]),
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
  //   // TypeOrmModule.forFeature([User]),
  // ],
  exports: [EmployeeService],
})
export class EmployeeModule {}
