import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { OrganizationalProfileCommonData } from 'src/common/organizational-info/organizational-profile';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entity/feature.entity';
import { PlanBilling } from './entity/plan-billing.entity';
import { PlanFeatureMapping } from './entity/plan-feature-mapping.entity';
import { Plan } from './entity/plan.entity';
import { SubscriptionType } from './entity/subscription-type.entity';
import { OrgSubscription } from './entity/org_subscription.entity'
import { DatabaseModule } from 'src/dynamic-schema/database.module';
import { MailModule } from 'src/common/mail/mail.module';
import { OrganizationalProfileModule } from 'src/organizational-profile/organizational-profile.module';
import { Branch } from 'src/organizational-profile/entity/branches.entity';
import { UserRepository } from '../user/user.repository'; // Import your UserRepository
import { SubscriptionLog } from './entity/subscription-log.entity';
import { Subscription } from 'src/organization_register/entities/public_subscription.entity';
import { BillingInfo } from './entity/billing_info.entity';
import { PaymentTransaction } from './entity/payment_transaction.entity';
import{ OrgFeatureOverride } from './entity/org_feature_overrides.entity';
import { OrgOverride } from 'src/organization_register/entities/org_overrides.entity';
import { RegisterOrganization } from 'src/organization_register/entities/register-organization.entity';
import { OrgFeatureOverrideLog } from './entity/org_feature_override_logs.entity';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
import { PlanSetting } from './entity/plan_setting.entity';
import { OfflinePaymentRequest } from './entity/offline_payment_requests.entity';
import { PaymentMethod } from './entity/payment_methods.entity';
import { PaymentMode } from './entity/payment_mode.entity';
import { Product } from './entity/product.entity';
import { RenewalStatus } from './entity/renewal.entity';

@Module({ 


  imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET, // Use environment variable
          signOptions: { expiresIn:process.env.JWT_EXPIRATION },
        }),
          TypeOrmModule.forFeature([Branch, Subscription,OrgSubscription,SubscriptionType,Plan,PlanFeatureMapping,PlanBilling,Feature,SubscriptionLog,BillingInfo,PaymentTransaction,OrgFeatureOverride,OrgOverride,RegisterOrganization,OrgFeatureOverrideLog, Session,  RegisterUserLogin,PlanSetting,OfflinePaymentRequest,PaymentMethod, PaymentMode, Product, RenewalStatus ]),DatabaseModule,MailModule,OrganizationalProfileModule
      ],

  controllers: [SubscriptionController],
  providers: [SubscriptionService, UserRepository, OrganizationalProfileCommonData],
  exports:[SubscriptionService]
})
export class SubscriptionModule {}
