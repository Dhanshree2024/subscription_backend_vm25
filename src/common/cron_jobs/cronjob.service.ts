import { Injectable, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, DataSource, Between, MoreThan } from 'typeorm';

import { addDays, subDays, format } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from 'src/common/mail/mail.service';
import { renderEmail, EmailTemplate } from 'src/common/mail/render-email';
import { MailConfigService } from '../../common/mail/mail-config.service';
import * as nodemailer from 'nodemailer';
import { getTenantRepository } from './utils/tenant.util';
import { DateFormatService } from 'src/common/date_format/date-utils';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';

@Injectable()
export class CronJobService {
    private readonly logger = new Logger(CronJobService.name);
    private isRunning = false;

    private lastSyncedMap: Map<string, number> = new Map();
    private isAttendanceReminderRunning = false;
    private istodaysAttendanceReminderRunning = false;
    constructor(

        @InjectRepository(OrgSubscription)
        private readonly subscriptionRepo: Repository<OrgSubscription>,

        @InjectRepository(RegisterUserLogin)
        private readonly userRepo: Repository<RegisterUserLogin>,

        private readonly mailConfigService: MailConfigService, // Inject service

        private readonly mailService: MailService,

        private readonly dataSource: DataSource,

        private readonly dateFormatService: DateFormatService,


    ) { }

    // @Cron(CronExpression.EVERY_DAY_AT_10AM)
    // async handleCronReminder() {
    //   console.log('⏰ Running cron: Checking subscription reminders...');
    //   await this.sendRenewalReminderEmails();
    //   await this.logRepo.save({
    //     job_name: 'RENEWAL_REMINDER',
    //     status: 'SUCCESS',
    //     description: 'Sent renewal reminders to all primary users.',
    //   });
    // }

    async sendRenewalReminderEmails(): Promise<void> {
        // const today = new Date();
        // const fiveDay = format(addDays(today, 5), 'yyyy-MM-dd');
        // const twoDay = format(addDays(today, 2), 'yyyy-MM-dd');
        const today = new Date();
        const fiveDay = addDays(today, 5);
        const twoDay = addDays(today, 2);
        console.log('--- Starting Subscription Renewal Reminder Job ---');
        console.log('Today:', today);
        console.log('Checking subscriptions for dates:', format(twoDay, 'yyyy-MM-dd'), 'and', format(fiveDay, 'yyyy-MM-dd'));
        // Step 1: Setup ZeptoMail transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.zeptomail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD_NORBIK,
            },
        });

        // Step 2: Fetch subscriptions due
        // const subscriptions = await this.subscriptionRepo.find({
        //   where: {
        //     renewal_date: Raw(alias => `${alias} IN (:...dates)`, {
        //       dates: [fiveDay, twoDay],
        //     }),
        //   },
        // });
        const subscriptions = await this.subscriptionRepo.find({
            where: [
                { renewal_date: Raw(alias => `DATE(${alias}) = :twoDay`, { twoDay: format(twoDay, 'yyyy-MM-dd') }) },
                { renewal_date: Raw(alias => `DATE(${alias}) = :fiveDay`, { fiveDay: format(fiveDay, 'yyyy-MM-dd') }) },
            ],
            relations: ['organization'],
        });
        console.log(`Found ${subscriptions.length} subscription(s) due for reminder.`);

        // Step 3: Send emails to each primary user
        for (const sub of subscriptions) {
            console.log('Processing subscription:', sub.subscription_id, 'Org:', sub.organization_profile_id);

            const primaryUsers = await this.userRepo.find({
                where: {
                    organization_id: sub.organization_profile_id,
                    is_primary_user: 'Y',
                },
            });

            console.log('primaryUsers', primaryUsers);
            if (!primaryUsers.length) {
                console.log(`No primary users found for organization ${sub.organization_profile_id}. Skipping email.`);
                continue;
            }
            console.log(`Found ${primaryUsers.length} primary user(s) for organization ${sub.organization_profile_id}:`, primaryUsers.map(u => u.business_email));

            for (const user of primaryUsers) {
                // const daysLeft =
                //   format(sub.renewal_date, 'yyyy-MM-dd') === fiveDay ? 5 : 2;

                const daysLeft = format(sub.renewal_date, 'yyyy-MM-dd') === format(fiveDay, 'yyyy-MM-dd') ? 5 : 2;
                console.log(`Sending email to ${user.business_email}. Days left: ${daysLeft}. Renewal date: ${sub.renewal_date}`);

                const mailOptions = {
                    from: process.env.FROM_EMAIL, // Your sender email
                    to: user.business_email,
                    // to: "dhanshree.konde@spitsolutions.com",

                    subject: '⏰ Subscription Renewal Reminder',
                    html: `
            <p>Hello ${user.first_name},</p>
            <p>Your organization's subscription will expire in <strong>${daysLeft}</strong> day(s), on <strong>${sub.renewal_date}</strong>.</p>
            <p>Please renew to avoid service interruptions.</p>
            <p>Thank you,<br/>Support Team</p>
          `,
                };

                await transporter.sendMail(mailOptions);
                console.log(`Reminder sent to ${user.business_email} for org ${sub.organization_profile_id}`);
            }
        }
    }
}