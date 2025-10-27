import { Controller, Post, Body} from '@nestjs/common';
import { renderEmail, EmailTemplate  } from './render-email';
import { EmailProps } from "./render-email";
import { MailService } from './mail.service';
import { MailConfigService } from './mail-config.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailerService: MailService,
        private readonly mailConfigService: MailConfigService,  
  ) {}

  @Post('send-verification')
  async sendVerificationEmail(@Body() body: EmailProps) {
    try {
      console.log('s');
      if (!body.name || !body.email) {
        throw new Error("Missing required email fields");
      }

      const mailConfig = await this.mailConfigService.getMailConfig();

      // Await the rendered HTML
      const emailHtml = await renderEmail(EmailTemplate.PASSWORD_RESET, {
        name: 'Ram',
        otp: "123453",
        companyName: 'SP IT Solutions LLP',
        mailReply: mailConfig.smtpReplyMail
      }, this.mailConfigService) // Pass database connection
      
  
      await this.mailerService.sendEmail(body.email,body.subject, emailHtml);

      return { message: "Verification email sent successfully" };
    } catch (error) {
      console.error("Error sending email:", error);
      return { message: "Failed to send email", error: error.message };
    }
  }

}
