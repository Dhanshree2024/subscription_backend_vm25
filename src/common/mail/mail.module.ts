import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';  // Ensure it's imported
import { MailConfigService } from './mail-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailConfig } from './entities/email-config.entity';
@Module({
  imports: [TypeOrmModule.forFeature([MailConfig])],
  providers: [MailService, MailConfigService],
  controllers: [MailController],  // Ensure it's included here
  exports: [MailService,MailConfigService],
})
export class MailModule {}
