import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
import { CronJobService } from './cronjob.service';
import { CronJobController } from './cronjob.controller';
import { MailModule } from 'src/common/mail/mail.module';  // ✅ Import MailModule
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';

import { RegisterOrganization } from 'src/organization_register/entities/register-organization.entity';
import { DateFormatService } from '../date_format/date-utils';


@Module({
  imports: [
    TypeOrmModule.forFeature([OrgSubscription, RegisterUserLogin,  RegisterOrganization, ]),MailModule,
  ],
  providers: [CronJobService,DateFormatService],
  controllers: [CronJobController],
  exports: [CronJobService], // optional if used outside
})
export class CronJobModule {}
