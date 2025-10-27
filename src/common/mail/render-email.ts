import * as React from "react";
import { render } from "@react-email/render";
import { MailConfigService } from './mail-config.service';
import { LoginVerificationEmail } from "./mail_templates/login-verification-email";
import { OnboardingConfirmationEmail } from "./mail_templates/onboarding-confirmation-email";
import { NewUserInvitationEmail } from "./mail_templates/new-user-invitation-email";
import { AuthLoginVerificationEmail } from "./mail_templates/auth-otp-email";
import { PasswordResetEmail } from "./mail_templates/password-reset-mail";
import { PasswordUpdatedEmail } from "./mail_templates/password-updated-mail";
import { PasswordSetNotificationEmail } from "./mail_templates/generate-password";
import { UserPasswordResetAdminEmail } from "./mail_templates/user-password-reset-by-admin";
import { OrderPlacedEmail } from "./mail_templates/subscription-order-places";
import { OpenRegistrationEmail } from "./mail_templates/subscription-registration-email";
import { POConfirmationEmail } from "./mail_templates/PO-confirmation-email";
import { OfflinePaymentEmail } from "./mail_templates/Offline-payment-email";
export interface EmailProps {
  name?: string;
  otp?: string;
  email?: string;
  companyName?: string;
  subject?: string;
  [key: string]: any; // Supports additional dynamic parameters
}

export enum EmailTemplate {
  LOGIN_VERIFICATION = "login_verification",
  ONBOARDING_CONFIRMATION = "onboarding_confirmation",
  NEW_USER_INVITATION = "new_user_invitation",
  AUTH_LOGIN_VERIFICATION = "auth_login_verification",
  PASSWORD_RESET = "password_reset",
  PASSWORD_RESET_BY_ADMIN = "password_reset_by_admin",

  PASSWORD_UPDATED_SUCCESS = "password-update",
  PASSWORD_GENERATED_SUCCESS = "password-generate",

  ORDER_PLACED = "order-placed",
  ONLINE_REGISTRATION_EMAIL = "online-registration-email",
  PO_CONFIRMATION_EMAIL = "po-confirmation-email",
  OFFLINE_PAYMENT_EMAIL = "offline-payment-email",

}

export async function renderEmail(
  template: EmailTemplate,
  props: EmailProps,
  mailConfigService: MailConfigService // Pass the service
): Promise<string> {
  // Fetch mailReply and companyLogo from the database
  const mailConfig = await mailConfigService.getMailConfig();
  const defaultMailReply = mailConfig?.smtpReplyMail || "support@yourcompany.com";
  // const defaultCompanyLogo = companySettings?.companyLogo || "https://yourcompany.com/default-logo.png";

  let EmailComponent;
  switch (template) {
    case EmailTemplate.LOGIN_VERIFICATION:
      EmailComponent = LoginVerificationEmail;
      break;
    case EmailTemplate.ONBOARDING_CONFIRMATION:
      EmailComponent = OnboardingConfirmationEmail;
      break;
    case EmailTemplate.NEW_USER_INVITATION:
      EmailComponent = NewUserInvitationEmail;
      break;
    case EmailTemplate.AUTH_LOGIN_VERIFICATION:
      EmailComponent = AuthLoginVerificationEmail;
      break;
    case EmailTemplate.PASSWORD_RESET:
      EmailComponent = PasswordResetEmail;
      break;
    case EmailTemplate.PASSWORD_RESET_BY_ADMIN:
      EmailComponent = UserPasswordResetAdminEmail;
      break;
    case EmailTemplate.PASSWORD_UPDATED_SUCCESS:
      EmailComponent = PasswordUpdatedEmail;
      break;
    case EmailTemplate.PASSWORD_GENERATED_SUCCESS:
      EmailComponent = PasswordSetNotificationEmail;
      break;
    case EmailTemplate.ORDER_PLACED:
      EmailComponent = OrderPlacedEmail;
      break;
    case EmailTemplate.ONLINE_REGISTRATION_EMAIL:
      EmailComponent = OpenRegistrationEmail;
      break;
    case EmailTemplate.PO_CONFIRMATION_EMAIL:
      EmailComponent = POConfirmationEmail;
      break;
    case EmailTemplate.OFFLINE_PAYMENT_EMAIL:
      EmailComponent = OfflinePaymentEmail;
      break;
    default:
      throw new Error("Invalid email template");
  }

  // Include common properties before rendering
  const emailProps = {
    ...props,
    mailReply: props.mailReply || defaultMailReply, // Use provided value or default
    companyName: mailConfig.smtpFromName,
    // companyLogo: props.companyLogo || defaultCompanyLogo,
  };

  return render(React.createElement(EmailComponent, emailProps));
}
