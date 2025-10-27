import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigRepository } from '../config/config.repository'; // Import ConfigRepository

import * as dotenv from 'dotenv';
import { RegisterUserLogin } from './entities/register-user-login.entity';
import { RegisterOrganization } from './entities/register-organization.entity';
import { Subscription } from './entities/public_subscription.entity';
import { Plan } from './entities/public_plan.entity';
import { MailModule } from 'src/common/mail/mail.module';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';

dotenv.config(); // Load the .env file

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, ApiKeyGuard],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([RegisterUserLogin, RegisterOrganization, Subscription , Plan, OrgSubscription]),
    MailModule],
 
  exports: [OrganizationService],
})
export class OrganizationModule {}
