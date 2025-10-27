// src/subscription/subscription.controller.ts
import { Controller, Get, Post } from '@nestjs/common';
import { CronJobService } from './cronjob.service';

@Controller('cronjob')
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) { }

  @Get('test-reminder')
  async testReminder() {
    await this.cronJobService.sendRenewalReminderEmails();
    return { success: true, message: 'Reminder function executed manually' };
  }
}