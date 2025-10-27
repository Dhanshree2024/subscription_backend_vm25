import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

import { UserRepository } from '../user/user.repository';
// import { User } from '../user/user.entity';
import { RegisterUserLogin } from '../organization_register/entities/register-user-login.entity';
import { ConfigModule } from '../config/config.module';
import { ConfigRepository } from '../config/config.repository'; // Import ConfigRepository
import * as fs from 'fs';
import * as path from 'path';
import { Subscription } from 'src/organization_register/entities/public_subscription.entity';
import { MailModule } from 'src/common/mail/mail.module';  // ✅ Import MailModule
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';
import { Plan } from 'src/subscription_pricing/entity/plan.entity';

// import { OrganizationRolesPermissionModule } from 'src/organization_roles_permission/organization_roles_permission.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, UserRepository, ApiKeyGuard, RegisterUserLogin, Session],
  imports: [
    ConfigModule, // Import ConfigModule to use ConfigRepository
    JwtModule.registerAsync({
      imports: [ConfigModule,

      ], // Ensure ConfigModule is available
      inject: [ConfigRepository], // Inject ConfigRepository
      useFactory: async (configRepository: ConfigRepository) => {
        const secret = await configRepository.getJwtSecret(); // Fetch secret dynamically
        // console.log('Dynamic JWT Secret:', secret); // Log to verify
        // Write to .env file (if needed)
        // Update JWT_SECRET in .env file
        const envPath = path.resolve(__dirname, '../../.env'); // Adjust path as necessary
        let envContent = '';
        try {
          envContent = fs.readFileSync(envPath, 'utf-8');
          if (/^JWT_SECRET=/m.test(envContent)) {
            envContent = envContent.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${secret}`);
          } else {
            envContent += `\nJWT_SECRET=${secret}`;
          }
          fs.writeFileSync(envPath, envContent, 'utf-8');
          console.log('JWT_SECRET updated in .env file');
        } catch (error) {
          console.error('Error updating .env file', error);
        }
        return {
          secret: process.env.JWT_ACCESS_SECRET_KEY, // Secret for JWT signing
          signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRATION }, // Set token expiration
        };
      },

    }),
    TypeOrmModule.forFeature([UserRepository, RegisterUserLogin, Subscription, Session, User,OrgSubscription, Plan]), MailModule
  ],
  exports: [AuthService, Session, JwtAuthGuard],
})
export class AuthModule { }
