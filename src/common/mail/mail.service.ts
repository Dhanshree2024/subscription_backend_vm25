import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { MailConfig } from './entities/email-config.entity';
import { MailConfigService } from './mail-config.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly mailConfigService: MailConfigService,
  ) {}

  async initializeTransporter() {
    const mailConfig = await this.mailConfigService.getMailConfig();
    
    if (!mailConfig) {
      throw new InternalServerErrorException('Mail configuration not found in the database.');
    }

    // Create transporter using database configuration
    this.transporter = nodemailer.createTransport({
      host: mailConfig.smtpHost,
      port: mailConfig.smtpPort,
      secure: mailConfig.useSSL, // SSL/TLS
      auth: {
        user: mailConfig.smtpUsername,
        pass: mailConfig.smtpPassword, // Ensure this is decrypted if stored encrypted
      },
    });
  }

  async sendEmail(to: string, subject: string, emailHtml: string) {
    if (!this.transporter) {
      await this.initializeTransporter();
    }

    const mailConfig = await this.mailConfigService.getMailConfig();

    if (!mailConfig) {
      return { success: false, message: 'Mail configuration not found' };
    }

    const mailOptions = {
      from: `"${mailConfig.smtpFromName || 'No Reply'}" <${mailConfig.smtpFromEmail}>`,
      to: to,
      subject: subject,
      html: emailHtml,
    };

    console.log("mailConfig :-",mailConfig);
    console.log("mailOptions :-",mailOptions);
    

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email sent successfully!' };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, message: 'Failed to send email', error: error.message };
    }
  }
}
