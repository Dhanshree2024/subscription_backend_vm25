import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationalProfile } from './entity/organizational-profile.entity';
import { Department } from './entity/department.entity'; // Import Department entity
import { User } from './entity/organizational-user.entity'; // Import Department entity

import { OrganizationService  } from './organizational-profile.service';
import { OrganizationalProfileController } from './organizational-profile.controller';
// import { User } from '../user/user.entity'; // Import Department entity
import { IndustryTypes } from './public_schema_entity/industry-types.entity';
import { DepartmentConifg } from './public_schema_entity/department-config.entity';
import { DesignationsConfig } from './public_schema_entity/designations-config.entity';

import { UserRepository } from '../user/user.repository'; // Import your UserRepository
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../dynamic-schema/database.module'; // Import DatabaseModule

import * as dotenv from 'dotenv';
import { Branch } from './entity/branches.entity';
import { OrganizationVendors } from './entity/organizational-vendors.entity';
import { Designations } from './entity/designations.entity';
import { Roles } from './entity/roles.entity';
import { AssetDatum } from 'src/assets-data/asset-data/entities/asset-datum.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
import { RegisterOrganization } from 'src/organization_register/entities/register-organization.entity';

import { MailModule } from 'src/common/mail/mail.module';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { RolesPermissionsModule } from 'src/roles_permissions/roles_permissions.module';
import { Locations } from './entity/locations.entity';
import { Pincodes } from './public_schema_entity/pincode.entity';
import { Session } from './public_schema_entity/sessions.entity';
import { RolesPermission } from 'src/roles_permissions/entities/roles_permission.entity';

import { Plan } from 'src/subscription_pricing/entity/plan.entity';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';
import { PlanFeatureMapping } from 'src/subscription_pricing/entity/plan-feature-mapping.entity';
import { PaymentMode } from 'src/subscription_pricing/entity/payment_mode.entity';
import { BillingInfo } from 'src/subscription_pricing/entity/billing_info.entity';
import { OfflinePaymentRequest } from 'src/subscription_pricing/entity/offline_payment_requests.entity';
import { PaymentTransaction } from 'src/subscription_pricing/entity/payment_transaction.entity';
import { OrgFeatureOverride } from 'src/subscription_pricing/entity/org_feature_overrides.entity';
import { ContactSalesRequest } from 'src/subscription_pricing/entity/contact_sales_requests.entity';
dotenv.config(); // Load the .env file

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Use environment variable
      signOptions: { expiresIn:process.env.JWT_EXPIRATION },
    }),
    TypeOrmModule.forFeature([OrganizationalProfile,Branch, OrganizationVendors,
      Department,Designations,Roles, User, IndustryTypes, RolesPermission,
      DepartmentConifg, DesignationsConfig, AssetDatum, RegisterUserLogin, RegisterOrganization, Locations, Pincodes,Session,Plan,OrgSubscription,PlanFeatureMapping,PaymentMode,BillingInfo,OfflinePaymentRequest, PaymentTransaction, OrgFeatureOverride, ContactSalesRequest
    ]), DatabaseModule, MailModule, AuthModule, RolesPermissionsModule
  ],
  controllers: [OrganizationalProfileController],
  providers: [ OrganizationService , UserRepository],
  exports:[OrganizationService]
})
export class OrganizationalProfileModule { }

