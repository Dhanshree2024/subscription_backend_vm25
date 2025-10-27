import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  ExecutionContext,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource,InjectRepository } from '@nestjs/typeorm';
import { Any, DataSource, Repository } from 'typeorm';
import { CreateOrganizationDto } from './create-organization.dto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { VerifyOtpDto } from './verify-otp.dto';
import { RegisterOrganization } from './entities/register-organization.entity';
import { RegisterUserLogin } from './entities/register-user-login.entity';
import { exit } from 'process';
import { ResendOtpDto } from './dto/resend-otp.dto'; // Assuming you create a DTO for the request
import { UserScript } from './onboarding_sql_scripts/users';
import { OrganizationProfileScript } from './onboarding_sql_scripts/organization_profile';
import { BranchesScript } from './onboarding_sql_scripts/branches';
import { DepartmentsScript } from './onboarding_sql_scripts/departments';
import { OrganizationPermissionScript } from './onboarding_sql_scripts/organization_permissions';
import { OrganizationRolesScript } from './onboarding_sql_scripts/organization_roles';
import { DesignationScript } from './onboarding_sql_scripts/designation';
import { MailService } from 'src/common/mail/mail.service';
import { MailConfigService } from 'src/common/mail/mail-config.service';
import { EmailTemplate, renderEmail } from 'src/common/mail/render-email';
import { assetFieldCategoryScript } from './onboarding_sql_scripts/assetfieldcategory';
import { ItemFieldsScript } from './onboarding_sql_scripts/assetitemfields';
import { SubCategoryScript } from './onboarding_sql_scripts/subcategory';
import { ItemsScript } from './onboarding_sql_scripts/items';
import { ItemFieldsMappingScript } from './onboarding_sql_scripts/assetitemfieldmapping';
import { CategoryScript } from './onboarding_sql_scripts/category';
import { AssetItemRelationScript } from './onboarding_sql_scripts/assetitemrelations';
import { AssetsScript } from './onboarding_sql_scripts/assets';
import { AssetStatusTypesScript } from './onboarding_sql_scripts/assetStatsutypes';
import { AssetOwnershipStatusTypesScript } from './onboarding_sql_scripts/assetOwnershipstatsutypes';
import { AssetWorkingStatusScript } from './onboarding_sql_scripts/assetWorkingstatus';
import { AssetMappingRelations } from './onboarding_sql_scripts/assetmapping';
import { StocksScript } from './onboarding_sql_scripts/stocks';
import { AssetStockSerialsScript } from './onboarding_sql_scripts/stockserial';
import { LicenceTypesScript } from './onboarding_sql_scripts/licencetypes';
import { AssetTransferHistoryScript } from './onboarding_sql_scripts/transferhistory';
import { VendersScript } from './onboarding_sql_scripts/venders';
import { userDefaultPermission } from './default_permissions/UserDefaultPermission';
import { adminDefaultPermission } from './default_permissions/AdminDefaultPermission';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { orgStatsScriptScript } from './onboarding_sql_scripts/assetsorgstats';
import { assetProjectScript } from './onboarding_sql_scripts/assetproject';
import { assetCostCenterScript } from './onboarding_sql_scripts/assetcostcenter';
import { assetLocationScript } from './onboarding_sql_scripts/assetlocation';
import { assetDepreciationMethodsScript } from './onboarding_sql_scripts/assetdepreciationmethods';
import { OrgSubscription } from '../subscription_pricing/entity/org_subscription.entity';
import { OrgFeatureOverride } from 'src/subscription_pricing/entity/org_feature_overrides.entity';
import { PlanFeatureMapping } from 'src/subscription_pricing/entity/plan-feature-mapping.entity';
import { OrgOverride } from './entities/org_overrides.entity';
import { Plan } from 'src/subscription_pricing/entity/plan.entity';

@Injectable()
export class OrganizationService {
  constructor(
    
    @InjectDataSource() private readonly dataSource: DataSource,
  @InjectRepository(OrgSubscription)
    private readonly subscriptionRepository: Repository<OrgSubscription>,
    

    private readonly mailService: MailService,

    private readonly mailConfigService: MailConfigService,
  ) {}

  // async createOrganization(
  //   createOrganizationDto: CreateOrganizationDto,
  //   context: any,
  // ): Promise<any> {
  //   const {
  //     companyName,
  //     firstName,
  //     lastName,
  //     businessEmail,
  //     phoneNumber,
  //     industryName,
  //     industryId,
  //   } = createOrganizationDto;

  //   console.log('createOrganizationDto', createOrganizationDto);
  //   // Validate required fields
  //   if (
  //     !companyName ||
  //     !firstName ||
  //     !lastName ||
  //     !businessEmail ||
  //     !phoneNumber ||
  //     !industryId
  //   ) {
  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: 'Validation failed: Missing required fields.',
  //     });
  //   }

  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(businessEmail)) {
  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: 'Invalid email format.',
  //     });
  //   }

  //   const [localPart, domain] = businessEmail.trim().toLowerCase().split('@');
  //   const normalizedEmail =
  //     domain === 'gmail.com' || domain === 'googlemail.com'
  //       ? `${localPart.split('+')[0].replace(/\./g, '')}@${domain}`
  //       : `${localPart}@${domain}`;

  //   console.log(
  //     'businessEmail, normalizedEmail',
  //     businessEmail,
  //     normalizedEmail,
  //   );

  //   try {
  //     // 🔍 Check for existing email globally (across all orgs)
  //     const existingUserGlobal = await this.dataSource
  //       .getRepository(RegisterUserLogin)
  //       .findOne({
  //         where: { business_email: normalizedEmail },
  //         relations: ['organization'],
  //       });

  //     // 🔍 Check for existing organization name
  //     const existingOrg = await this.dataSource
  //       .getRepository(RegisterOrganization)
  //       .findOne({
  //         where: { organization_name: companyName },
  //         relations: ['users'],
  //       });

  //     console.log(
  //       'existingUserGlobal,existingOrg',
  //       existingUserGlobal,
  //       existingOrg,
  //     );
  //     // ✅ CASE 1: Existing Org + Existing Email
  //     if (
  //       existingOrg &&
  //       existingUserGlobal &&
  //       existingUserGlobal.organization.organization_name === companyName
  //     ) {
  //       if (!existingUserGlobal.verified) {
  //         const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  //         const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);

  //         existingUserGlobal.otp = newOtp;
  //         existingUserGlobal.otp_expiry = otpExpiry;

  //         await this.dataSource
  //           .getRepository(RegisterUserLogin)
  //           .save(existingUserGlobal);

  //         await this.mailService.sendEmail(
  //           normalizedEmail,
  //           'OTP for NORBIK Account Verification',
  //           await renderEmail(
  //             EmailTemplate.LOGIN_VERIFICATION,
  //             {
  //               name: `${firstName} ${lastName}`,
  //               otp: newOtp,
  //               email: normalizedEmail,
  //             },
  //             this.mailConfigService,
  //           ),
  //         );

  //         return {
  //           statusCode: 200,
  //           message: 'OTP resent. Please check your email for verification.',
  //           data: {
  //             userId: existingUserGlobal.user_id,
  //           },
  //         };
  //       } else {
  //         return {
  //           statusCode: 200,
  //           message: 'Email already verified. Please log in.',
  //           data: {
  //             redirectToLogin: true,
  //             userId: existingUserGlobal.user_id,
  //           },
  //         };
  //       }
  //     }

  //     // ❌ CASE 2: New Org + Existing Email → Reject
  //     // ⚠️ CASE 2: New Org + Existing Email → Allow update only if not verified
  //     if (!existingOrg && existingUserGlobal) {
  //       if (existingUserGlobal.verified) {
  //         // Already verified → Reject
  //         throw new BadRequestException({
  //           statusCode: 400,
  //           message:
  //             'You already started registration with this email. Your details were updated and a new OTP has been sent to continue verification.',
  //         });
  //       } else {
  //         // Not verified → Update existing record and resend OTP
  //         existingUserGlobal.first_name = firstName;
  //         existingUserGlobal.last_name = lastName;
  //         existingUserGlobal.phone_number = phoneNumber;

  //         const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  //         const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);

  //         existingUserGlobal.otp = newOtp;
  //         existingUserGlobal.otp_expiry = otpExpiry;

  //         await this.dataSource
  //           .getRepository(RegisterUserLogin)
  //           .save(existingUserGlobal);

  //         await this.mailService.sendEmail(
  //           normalizedEmail,
  //           'OTP for NORBIK Account Verification',
  //           await renderEmail(
  //             EmailTemplate.LOGIN_VERIFICATION,
  //             {
  //               name: `${firstName} ${lastName}`,
  //               otp: newOtp,
  //               email: normalizedEmail,
  //             },
  //             this.mailConfigService,
  //           ),
  //         );

  //         return {
  //           statusCode: 200,
  //           message:
  //             'Email exists but not yet verified. User details updated. OTP resent for verification.',
  //           data: {
  //             userId: existingUserGlobal.user_id,
  //           },
  //         };
  //       }
  //     }

  //     // ✅ CASE 3: Existing Org + New Email → Add user under existing org
  //     if (existingOrg && !existingUserGlobal) {
  //       const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //       const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);

  //       const newUser = this.dataSource
  //         .getRepository(RegisterUserLogin)
  //         .create({
  //           organization: existingOrg,
  //           first_name: firstName,
  //           last_name: lastName,
  //           business_email: normalizedEmail,
  //           phone_number: phoneNumber,
  //           otp,
  //           otp_expiry: otpExpiry,
  //           is_primary_user: 'Y', // optional: change to 'N' if needed
  //         });

  //       const savedUser = await this.dataSource
  //         .getRepository(RegisterUserLogin)
  //         .save(newUser);

  //       await this.mailService.sendEmail(
  //         normalizedEmail,
  //         'OTP for NORBIK Account Verification',
  //         await renderEmail(
  //           EmailTemplate.LOGIN_VERIFICATION,
  //           {
  //             name: `${firstName} ${lastName}`,
  //             otp,
  //             email: normalizedEmail,
  //           },
  //           this.mailConfigService,
  //         ),
  //       );
  //       const orgSubscriptionRepo = this.dataSource.getRepository(OrgSubscription);
  //       const today = new Date();
  //       const renewalDate = new Date(today);
  //       renewalDate.setMonth(today.getMonth() + 1);
  //       const orgSub = orgSubscriptionRepo.create({
  //         organization_profile_id: savedOrg.organization_id,   // from RegisterOrganization
  //         plan_id: 1,                             // default plan (replace with real plan_id)
  //         billing_id: 1,                          // default billing cycle (replace as needed)
  //         subscription_type_id: 1,                // e.g. "Trial" subscription type
  //         start_date: today,
  //         renewal_date: renewalDate,
  //         payment_status: 'pending',              // not paid yet
  //         payment_mode: null,                     // not applicable
  //         price: 0,                               // trial = free
  //         discounted_price: 0,
  //         grand_total: 0,
  //         license_no: null,
  //         invoice_number: null,
  //         is_active: true,
  //         is_deleted: false,
  //         created_by: savedUser.user_id,          // primary user
  //         purchase_date: today,
  //         auto_renewal: false,
  //       });
    
  //       await orgSubscriptionRepo.save(orgSub);
  //       return {
  //         statusCode: 200,
  //         message:
  //           'User added under existing organization. Verify the OTP sent to the email.',
  //         data: {
  //           schema: existingOrg.organization_schema_name,
  //           userId: savedUser.user_id,
  //         },
  //       };
  //     }

  //     // ✅ CASE 4: New Org + New Email → Create org and user
  //     if (!existingOrg && !existingUserGlobal) {
  //       const schemaName = companyName.toLowerCase().replace(/\s+/g, '_');

  //       const organization = this.dataSource
  //         .getRepository(RegisterOrganization)
  //         .create({
  //           organization_name: companyName,
  //           organization_schema_name: schemaName,
  //           industry_type_id: industryId,
  //         });

  //       const savedOrg = await this.dataSource
  //         .getRepository(RegisterOrganization)
  //         .save(organization);

  //       const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //       const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);

  //       const user = this.dataSource.getRepository(RegisterUserLogin).create({
  //         organization: savedOrg,
  //         first_name: firstName,
  //         last_name: lastName,
  //         business_email: normalizedEmail,
  //         phone_number: phoneNumber,
  //         otp,
  //         otp_expiry: otpExpiry,
  //         is_primary_user: 'Y',
  //       });

  //       const savedUser = await this.dataSource
  //         .getRepository(RegisterUserLogin)
  //         .save(user);

  //       await this.mailService.sendEmail(
  //         normalizedEmail,
  //         'OTP for NORBIK Account Verification',
  //         await renderEmail(
  //           EmailTemplate.LOGIN_VERIFICATION,
  //           {
  //             name: `${firstName} ${lastName}`,
  //             otp,
  //             email: normalizedEmail,
  //           },
  //           this.mailConfigService,
  //         ),
  //       );

  //       return {
  //         statusCode: 200,
  //         message:
  //           'Organization created successfully. Verify the OTP sent to the email.',
  //         data: {
  //           schema: schemaName,
  //           userId: savedUser.user_id,
  //         },
  //       };
  //     }

  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: 'Unexpected registration condition encountered.',
  //     });
  //   } catch (error) {
  //     console.error('Error creating organization:', error);

  //     if (error instanceof HttpException) {
  //       throw error;
  //     }

  //     throw new HttpException(
  //       {
  //         statusCode: 500,
  //         message: 'Internal server error.',
  //         details: error.message,
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  ////////////////////
  // async createOrganization(
  //   createOrganizationDto: CreateOrganizationDto,
  //   context: any,
  // ): Promise<any> {
  //   const {
  //     companyName,
  //     firstName,
  //     lastName,
  //     businessEmail,
  //     phoneNumber,
  //     industryName,
  //     industryId,
  //   } = createOrganizationDto;
  
  //   console.log('createOrganizationDto', createOrganizationDto);
  
  //   if (!companyName || !firstName || !lastName || !businessEmail || !phoneNumber || !industryId) {
  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: 'Validation failed: Missing required fields.',
  //     });
  //   }
  
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(businessEmail)) {
  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: 'Invalid email format.',
  //     });
  //   }
  
  //   const [localPart, domain] = businessEmail.trim().toLowerCase().split('@');
  //   const normalizedEmail =
  //     domain === 'gmail.com' || domain === 'googlemail.com'
  //       ? `${localPart.split('+')[0].replace(/\./g, '')}@${domain}`
  //       : `${localPart}@${domain}`;
  
  //   console.log('businessEmail, normalizedEmail', businessEmail, normalizedEmail);
  
  //   try {
  //     const userRepo = this.dataSource.getRepository(RegisterUserLogin);
  //     const orgRepo = this.dataSource.getRepository(RegisterOrganization);
  //     const orgSubscriptionRepo = this.dataSource.getRepository(OrgSubscription);
  
  //     const existingUserGlobal = await userRepo.findOne({
  //       where: { business_email: normalizedEmail },
  //       relations: ['organization'],
  //     });
  
  //     const existingOrg = await orgRepo.findOne({
  //       where: { organization_name: companyName },
  //       relations: ['users'],
  //     });
  
  //     // CASE 1: Existing Org + Existing Email
  //     if (
  //       existingOrg &&
  //       existingUserGlobal &&
  //       existingUserGlobal.organization.organization_name === companyName
  //     ) {
  //       if (!existingUserGlobal.verified) {
  //         const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  //         const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);
  
  //         existingUserGlobal.otp = newOtp;
  //         existingUserGlobal.otp_expiry = otpExpiry;
  
  //         await userRepo.save(existingUserGlobal);
  
  //         await this.mailService.sendEmail(
  //           normalizedEmail,
  //           'OTP for NORBIK Account Verification',
  //           await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
  //             name: `${firstName} ${lastName}`,
  //             otp: newOtp,
  //             email: normalizedEmail,
  //           }, this.mailConfigService),
  //         );
  
  //         return {
  //           statusCode: 200,
  //           message: 'OTP resent. Please check your email for verification.',
  //           data: { userId: existingUserGlobal.user_id },
  //         };
  //       }
  
  //       return {
  //         statusCode: 200,
  //         message: 'Email already verified. Please log in.',
  //         data: { redirectToLogin: true, userId: existingUserGlobal.user_id },
  //       };
  //     }
  
  //     // CASE 2: New Org + Existing Email
  //     if (!existingOrg && existingUserGlobal) {
  //       if (existingUserGlobal.verified) {
  //         throw new BadRequestException({
  //           statusCode: 400,
  //           message: 'You already registered with this email. Please log in.',
  //         });
  //       }
  
  //       existingUserGlobal.first_name = firstName;
  //       existingUserGlobal.last_name = lastName;
  //       existingUserGlobal.phone_number = phoneNumber;
  
  //       const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  //       const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);
  
  //       existingUserGlobal.otp = newOtp;
  //       existingUserGlobal.otp_expiry = otpExpiry;
  
  //       await userRepo.save(existingUserGlobal);
  
  //       await this.mailService.sendEmail(
  //         normalizedEmail,
  //         'OTP for NORBIK Account Verification',
  //         await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
  //           name: `${firstName} ${lastName}`,
  //           otp: newOtp,
  //           email: normalizedEmail,
  //         }, this.mailConfigService),
  //       );
  
  //       return {
  //         statusCode: 200,
  //         message: 'Email exists but not verified. User details updated. OTP resent.',
  //         data: { userId: existingUserGlobal.user_id },
  //       };
  //     }
  
  //     // CASE 3: Existing Org + New Email
  //     if (existingOrg && !existingUserGlobal) {
  //       const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //       const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);
  
  //       const newUser = userRepo.create({
  //         organization: existingOrg,
  //         first_name: firstName,
  //         last_name: lastName,
  //         business_email: normalizedEmail,
  //         phone_number: phoneNumber,
  //         otp,
  //         otp_expiry: otpExpiry,
  //         is_primary_user: 'Y',
  //       });
  
  //       const savedUser = await userRepo.save(newUser);
  
  //       await this.mailService.sendEmail(
  //         normalizedEmail,
  //         'OTP for NORBIK Account Verification',
  //         await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
  //           name: `${firstName} ${lastName}`,
  //           otp,
  //           email: normalizedEmail,
  //         }, this.mailConfigService),
  //       );
  
  //       // ✅ Add subscription for existing org
  //       const today = new Date();
  //       const renewalDate = new Date(today);
  //       renewalDate.setMonth(today.getMonth() + 1);
  
  //       const orgSub = orgSubscriptionRepo.create({
  //         organization_profile_id: existingOrg.organization_id,
  //         plan_id: 1,
  //         billing_id: 1,
  //         subscription_type_id: 1,
  //         start_date: today,
  //         renewal_date: renewalDate,
  //         payment_status: 'pending',
  //         payment_mode: null,
  //         price: 0,
  //         discounted_price: 0,
  //         grand_total: 0,
  //         license_no: null,
  //         invoice_number: null,
  //         is_active: true,
  //         is_deleted: false,
  //         created_by: savedUser.user_id,
  //         purchase_date: today,
  //         auto_renewal: false,
  //       });
  
  //       await orgSubscriptionRepo.save(orgSub);
  
  //       return {
  //         statusCode: 200,
  //         message: 'User added under existing organization. Verify OTP.',
  //         data: { schema: existingOrg.organization_schema_name, userId: savedUser.user_id },
  //       };
  //     }
  
  //     // CASE 4: New Org + New Email
  //     if (!existingOrg && !existingUserGlobal) {
  //       const schemaName = companyName.toLowerCase().replace(/\s+/g, '_');
  
  //       const organization = orgRepo.create({
  //         organization_name: companyName,
  //         organization_schema_name: schemaName,
  //         industry_type_id: industryId,
  //       });
  
  //       const savedOrg = await orgRepo.save(organization);
  
  //       const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //       const otpExpiry = new Date(new Date().getTime() + 5 * 60 * 1000);
  
  //       const user = userRepo.create({
  //         organization: savedOrg,
  //         first_name: firstName,
  //         last_name: lastName,
  //         business_email: normalizedEmail,
  //         phone_number: phoneNumber,
  //         otp,
  //         otp_expiry: otpExpiry,
  //         is_primary_user: 'Y',
  //       });
  
  //       const savedUser = await userRepo.save(user);
  
  //       await this.mailService.sendEmail(
  //         normalizedEmail,
  //         'OTP for NORBIK Account Verification',
  //         await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
  //           name: `${firstName} ${lastName}`,
  //           otp,
  //           email: normalizedEmail,
  //         }, this.mailConfigService),
  //       );
  
  //       // ✅ Add subscription for new org (pricing schema)
  //       const today = new Date();
  //       const renewalDate = new Date(today);
  //       renewalDate.setMonth(today.getMonth() + 1);
  
  //       const orgSub = orgSubscriptionRepo.create({
  //         organization_profile_id: savedOrg.organization_id,
  //         plan_id: 1,
  //         billing_id: 1,
  //         subscription_type_id: 1,
  //         start_date: today,
  //         renewal_date: renewalDate,
  //         payment_status: 'pending',
  //         payment_mode: null,
  //         price: 0,
  //         discounted_price: 0,
  //         grand_total: 0,
  //         license_no: null,
  //         invoice_number: null,
  //         is_active: true,
  //         is_deleted: false,
  //         created_by: savedUser.user_id,
  //         purchase_date: today,
  //         auto_renewal: false,
  //       });
  
  //       await orgSubscriptionRepo.save(orgSub);
  
  //       return {
  //         statusCode: 200,
  //         message: 'Organization created successfully. Verify OTP.',
  //         data: { schema: schemaName, userId: savedUser.user_id },
  //       };
  //     }
  
  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: 'Unexpected registration condition encountered.',
  //     });
  //   } catch (error) {
  //     console.error('Error creating organization:', error);
  
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  
  //     throw new HttpException(
  //       { statusCode: 500, message: 'Internal server error.', details: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  
  async createOrganization(
    createOrganizationDto: CreateOrganizationDto,
    context: any,
  ): Promise<any> {
    const {
      companyName,
      firstName,
      lastName,
      businessEmail,
      phoneNumber,
      industryId,
      selectedPlanId, // make sure your frontend sends this
    } = createOrganizationDto;
  
    // Validate required fields
    if (!companyName || !firstName || !lastName || !businessEmail || !phoneNumber || !industryId || !selectedPlanId) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Missing required fields.',
      });
    }
      const assignedProductId =  1;

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid email format.',
      });
    }
  
    // Normalize Gmail addresses
    const [localPart, domain] = businessEmail.trim().toLowerCase().split('@');
    const normalizedEmail =
      domain === 'gmail.com' || domain === 'googlemail.com'
        ? `${localPart.split('+')[0].replace(/\./g, '')}@${domain}`
        : `${localPart}@${domain}`;
  
    const userRepo = this.dataSource.getRepository(RegisterUserLogin);
    const orgRepo = this.dataSource.getRepository(RegisterOrganization);
    const orgSubscriptionRepo = this.dataSource.getRepository(OrgSubscription);
    const planFeatureMappingRepo = this.dataSource.getRepository(PlanFeatureMapping);
    const orgFeatureOverrideRepo = this.dataSource.getRepository(OrgFeatureOverride); // pricing schema
    const orgOverrideRepo = this.dataSource.getRepository(OrgOverride);               // public schema
    const planrepo = this.dataSource.getRepository(Plan);
  
    try {
      // Check if org exists
      const existingOrg = await orgRepo.findOne({
        where: { organization_name: companyName },
        relations: ['users'],
      });
  
      // Check if email exists globally
      const existingUserGlobal = await userRepo.findOne({
        where: { business_email: normalizedEmail },
        relations: ['organization'],
      });
  
      // CASE: Existing org + existing user under same org
      if (existingOrg && existingUserGlobal && existingUserGlobal.organization.organization_name === companyName) {
        if (!existingUserGlobal.verified) {
          const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  
          existingUserGlobal.otp = newOtp;
          existingUserGlobal.otp_expiry = otpExpiry;
          await userRepo.save(existingUserGlobal);
  
          await this.mailService.sendEmail(
            normalizedEmail,
            'OTP for NORBIK Account Verification',
            await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
              name: `${firstName} ${lastName}`,
              otp: newOtp,
              email: normalizedEmail,
            }, this.mailConfigService),
          );
  
          return {
            statusCode: 200,
            message: 'OTP resent. Please check your email for verification.',
            data: { userId: existingUserGlobal.user_id },
          };
        }
  
        return {
          statusCode: 200,
          message: 'Email already verified. Please log in.',
          data: { redirectToLogin: true, userId: existingUserGlobal.user_id },
        };
      }
  
      // CASE: Existing user but new org
      if (!existingOrg && existingUserGlobal) {
        if (existingUserGlobal.verified) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'You already registered with this email. Please log in.',
          });
        }
  
        // Not verified: update user info and resend OTP
        existingUserGlobal.first_name = firstName;
        existingUserGlobal.last_name = lastName;
        existingUserGlobal.phone_number = phoneNumber;
  
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        existingUserGlobal.otp = newOtp;
        existingUserGlobal.otp_expiry = otpExpiry;
        await userRepo.save(existingUserGlobal);
  
        await this.mailService.sendEmail(
          normalizedEmail,
          'OTP for NORBIK Account Verification',
          await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
            name: `${firstName} ${lastName}`,
            otp: newOtp,
            email: normalizedEmail,
          }, this.mailConfigService),
        );
  
        return {
          statusCode: 200,
          message: 'Email exists but not verified. OTP resent.',
          data: { userId: existingUserGlobal.user_id },
        };
      }
  
      // CASE: New organization
      const schemaName = companyName.toLowerCase().replace(/\s+/g, '_');
      const organization = orgRepo.create({
        organization_name: companyName,
        organization_schema_name: schemaName,
        industry_type_id: industryId,
      });
  
      const savedOrg = await orgRepo.save(organization);
  
      // Create primary user
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  
      const user = userRepo.create({
        organization: savedOrg,
        first_name: firstName,
        last_name: lastName,
        business_email: normalizedEmail,
        phone_number: phoneNumber,
        otp,
        otp_expiry: otpExpiry,
        is_primary_user: 'Y',
      });
  
      const savedUser = await userRepo.save(user);
  
      await this.mailService.sendEmail(
        normalizedEmail,
        'OTP for NORBIK Account Verification',
        await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
          name: `${firstName} ${lastName}`,
          otp,
          email: normalizedEmail,
        }, this.mailConfigService),
      );
      const SubbillingId = await this.generateBillingId();
      const subOrderId = await this.generateOrderId();

      // Fetch plan details
      const selectedPlan = await planrepo.findOne({
        where: { plan_id: selectedPlanId },
      });

      // Handle trial check
      const isTrial = selectedPlan?.set_trial === true;
      // Create subscription in pricing schema
      const today = new Date();
      const renewalDate = new Date(today);
      renewalDate.setMonth(today.getMonth() + 1);
  
      const orgSub = orgSubscriptionRepo.create({
        organization_profile_id: savedOrg.organization_id,
        plan_id: selectedPlanId,
        // billing_id: 1,
        subscription_type_id: 1,
        start_date: today,
        renewal_date: renewalDate,
        payment_status: 'pending',
        price: 0,
        discounted_price: 0,
        grand_total: 0,
        is_active: true,
        is_deleted: false,
        created_by: savedUser.user_id,
        purchase_date: today,
        auto_renewal: false,
        is_trial_period: isTrial,
        productId: assignedProductId,
        sub_billing_id: SubbillingId,
        sub_order_id: subOrderId,
      });
  
      const savedSub = await orgSubscriptionRepo.save(orgSub);
  
      // Fetch plan feature mappings for selected plan
      const planFeatures = await planFeatureMappingRepo.find({
        where: { plan_id: selectedPlanId },
        relations: ['feature'],
      });

      // Insert into pricing schema limitations
      const pricingLimitations = planFeatures.map(mapping =>
        orgFeatureOverrideRepo.create({
          org_id: savedOrg.organization_id,
          plan_id: selectedPlanId,
          feature_id: mapping.feature_id,
          mapping_id: mapping.mapping_id,
          override_value: mapping.feature_value ?? '0',
          default_value: mapping.feature_value ?? '0',
          is_active: true,
          is_deleted: false,
        }),
      );
      await orgFeatureOverrideRepo.save(pricingLimitations);
  
      // Insert into public schema overrides
      const publicOverrides = planFeatures.map(mapping =>
        orgOverrideRepo.create({
          org_id: savedOrg.organization_id,
          plan_id: selectedPlanId,
          feature_id: mapping.feature_id,
          mapping_id: mapping.mapping_id,
          override_value: mapping.feature_value ?? '0',
          default_value: mapping.feature_value ?? '0',
          is_active: true,
          is_deleted: false,
        }),
      );
      await orgOverrideRepo.save(publicOverrides);
  
      return {
        statusCode: 200,
        message: 'Organization created successfully. Verify OTP.',
        data: { schema: schemaName, userId: savedUser.user_id, subscriptionId: savedSub.subscription_id,organizationId: savedOrg.organization_id,   },
      };
  
    } catch (error) {
      console.error('Error creating organization:', error);
  
      if (error instanceof HttpException) throw error;
  
      throw new HttpException(
        { statusCode: 500, message: 'Internal server error.', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  async resendOtp(resendOtpDto: ResendOtpDto, context: any): Promise<any> {
    try {
      const { userId, required_for } = resendOtpDto;

      if (!userId) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'User ID is required.',
        });
      }

      // Validate if the user exists
      const userRepo = this.dataSource.getRepository(RegisterUserLogin);
      const user = await userRepo.findOne({ where: { user_id: userId } });

      if (!user) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'User not found.',
        });
      }

      // Generate a new OTP and set the expiry time
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // OTP expires in 5 minutes

      // Update user record with the new OTP and expiry
      user.otp = newOtp;
      user.otp_expiry = otpExpiry;

      try {
        await userRepo.save(user);
      } catch (error) {
        throw new InternalServerErrorException({
          statusCode: 500,
          message: 'Failed to update OTP in database.',
          error: error.message,
        });
      }

      const fullname = `${user.first_name} ${user.last_name}`;

      const emailSubject =
        required_for === 'Password Reset'
          ? 'OTP for Reset Password'
          : required_for === '2Auth OTP Resend'
            ? 'OTP for Login Verification'
            : 'OTP for NORBIK Account Verification';

      const emailTemplate =
        required_for === 'Password Reset'
          ? EmailTemplate.PASSWORD_RESET
          : required_for === '2Auth OTP Resend'
            ? EmailTemplate.AUTH_LOGIN_VERIFICATION
            : EmailTemplate.LOGIN_VERIFICATION;

      try {
        await this.mailService.sendEmail(
          user.business_email,
          emailSubject,
          await renderEmail(
            emailTemplate,
            { name: fullname, otp: newOtp },
            this.mailConfigService, // Ensure correct mail config
          ),
        );
      } catch (error) {
        throw new InternalServerErrorException({
          statusCode: 500,
          message: 'Failed to send OTP email.',
          error: error.message,
        });
      }

      return {
        status: 200,
        message: 'New OTP sent successfully.',
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException({
            statusCode: 500,
            message: 'An unexpected error occurred.',
            error: error.message,
          });
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, context: any): Promise<any> {
    const { otp, user_id } = verifyOtpDto;
    console.log('verifyOtpDto', verifyOtpDto);

    // Validate OTP with the database entity
    const userRepo = this.dataSource.getRepository(RegisterUserLogin);
    const user = await userRepo.findOne({
      where: { otp, verified: false, user_id },
      relations: ['organization'], // Ensure organization relation is loaded
    });
    console.log("user", user)
    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'No user found !',
        details: { otp },
      });
    }

    if (new Date() > user.otp_expiry) {
      throw new HttpException(
        {
          statusCode: 410,
          message: 'OTP has expired.',
          details: { otp, expiryTime: user.otp_expiry },
        },
        HttpStatus.GONE,
      );
    }

    // Generate a random plain-text password
    const randomPassword = Math.random().toString(36).slice(-8);
 console.log("randomPassword:",randomPassword);
    // Hash the password
    const hashedPassword = await this.hashPassword(randomPassword);

    // Update user entity to mark as verified and update the password
    user.verified = true;
    user.otp = null; // Clear OTP
    user.otp_expiry = null;
    user.password = hashedPassword;

    await userRepo.save(user);
    console.log("hashedPassword:",hashedPassword);

    // Create schema for the organization
    const schemaName = `org_${user.organization.organization_schema_name}`;
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    console.log('1');

    // Create tables in the organization profile schema
    const script1 = new OrganizationProfileScript(this.dataSource);
    await script1.createOrganizationProfileTable(schemaName);
    await script1.insertOrganizationProfileTable(schemaName, user);

    // Create table department
    const departmentscript = new DepartmentsScript(this.dataSource);
    await departmentscript.createDepartmentsTable(schemaName);

    // Create table designation
    const designationcript = new DesignationScript(this.dataSource);
    await designationcript.createDesignationTable(schemaName);

    // Create table organization roles tables
    const organizationrolesscript = new OrganizationRolesScript(
      this.dataSource,
    );
    await organizationrolesscript.createOrganizationRolesTable(schemaName);

    // Create tables in the users schema
    const script = new UserScript(this.dataSource);
    await script.createUserTable(schemaName);

    console.log('2');
    // Create table branches
    const branchscript = new BranchesScript(this.dataSource);
    await branchscript.createBranchesTable(schemaName);

    console.log('3');

    const departmentData = [
      { department_name: 'Administration' },
      { department_name: 'Human Resources (HR)' },
      { department_name: 'Store' },
      { department_name: 'Sales' },
      { department_name: 'Support/ Customer Service' },
    ];

    await departmentscript.insertOrganizationDepartmentTable(
      schemaName,
      departmentData,
    );

    console.log('4');

    const rolesData = [
      { role_id: 1, role_name: 'Admin' },
      { role_id: 2, role_name: 'User' },
    ];

    await organizationrolesscript.insertOrganizationRolesTable(
      schemaName,
      rolesData,
    );

    console.log('5');
    // Create table organization permission tables
    const organizationpermissionsscript = new OrganizationPermissionScript(
      this.dataSource,
    );
    await organizationpermissionsscript.createOrganizationPermissionTable(
      schemaName,
    );

    const rolesPermissionData = [
      { role_id: 1, permission: adminDefaultPermission },
      { role_id: 2, permission: userDefaultPermission },
    ];

    await organizationpermissionsscript.insertOrganizationRolesPermissionTable(
      schemaName,
      rolesPermissionData,
    );

    console.log('6');

    if (user) {
      // Dynamically add the property
      (user as any).role_id = 1;
      (user as any).department_id = 1;
    }

    const inserted = await script.insertUserTable(schemaName, user);

    console.log('8');

    // Create table designation
    const fieldCategoryScript = new assetFieldCategoryScript(this.dataSource);
    await fieldCategoryScript.createAssetFieldCategoryScriptTable(schemaName);

    const fieldCategoryData = [
      { asset_field_category_name: 'General Information' },
      { asset_field_category_name: 'Network & Domain Information' },
      { asset_field_category_name: 'System Specification' },
    ];

    await fieldCategoryScript.insertFieldCategoryTable(
      schemaName,
      fieldCategoryData,
    );

    const insertedFieldCategories = await this.dataSource.query(
      `SELECT asset_field_category_id, asset_field_category_name 
   FROM ${schemaName}.asset_field_category 
   WHERE asset_field_category_name IN ('General Information', 'Network & Domain Information', 'System Specification')`,
    );

    const categoryMap: Record<string, number> = {};
    insertedFieldCategories.forEach((cat) => {
      categoryMap[cat.asset_field_category_name] = cat.asset_field_category_id;
    });

    console.log('9');

    // Create table Fields
    const fieldScript = new ItemFieldsScript(this.dataSource);
    await fieldScript.createItemFieldsTable(schemaName);

    const fieldData = [
      {
        asset_field_name: 'Location',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Location',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Expiry Date',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Expiry Date',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Port',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Port',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Contract Type',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Contract Type',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Firmware Version',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Firmware Version',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Processor',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Processor',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'RAM',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'RAM',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'HDD',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'HDD',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Graphics',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Graphics',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Screen Size',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Screen Size',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Screen',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Screen',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Pixel',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Pixel',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Product Description',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Product Description',
        asset_field_type: 'text',
      },
       {
        asset_field_name: 'Type',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Type',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Capacity',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Capacity',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Host Name',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Host Name',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Domain Name',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'Domain Name',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Carrier',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'Carrier',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'IMEI No.',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'IMEI No.',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'IPv4',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'IPv4',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Platform',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'Platform',
        asset_field_type: 'text',
      },
    ];

    await fieldScript.insertAssetFieldsTable(schemaName, fieldData);

    console.log('10');

    // Create table designation
    const itemfieldMappingScript = new ItemFieldsMappingScript(this.dataSource);
    await itemfieldMappingScript.createItemFieldsMappingTable(schemaName);

    console.log('11');

    // Create table designation

    /// STEP 1: Create Main Category Table
    const assetCategoryScript = new CategoryScript(this.dataSource);
    await assetCategoryScript.createCategoryTable(schemaName);

    // STEP 1.1: Insert Main Categories (only name, using helper method)
    const assetMainCategoryData = [
      { main_category_name: 'IT' },
      { main_category_name: 'Non IT' },
    ];
    await assetCategoryScript.insertAssetMainCategoryTable(
      schemaName,
      assetMainCategoryData,
    );

    // Fetch inserted categories to get their generated IDs
    const insertedMainCategories = await this.dataSource.query(
      `SELECT main_category_id, main_category_name FROM ${schemaName}.asset_main_category WHERE main_category_name IN ('IT', 'Non IT')`,
    );

    const mainCatMap: Record<string, number> = {};
    insertedMainCategories.forEach((cat) => {
      mainCatMap[cat.main_category_name] = cat.main_category_id;
    });

    if (!mainCatMap['IT'] || !mainCatMap['Non IT']) {
      throw new Error('Main category IDs not found.');
    }

    console.log('12');

    // STEP 2: Create and Insert Subcategories
    const assetSubCategoryScript = new SubCategoryScript(this.dataSource);
    await assetSubCategoryScript.createSubCategoryTable(schemaName);

    const assetSubCategoryData = [
      { main_category_id: mainCatMap['IT'], sub_category_name: 'Hardware' },
      { main_category_id: mainCatMap['IT'], sub_category_name: 'Software' },
      { main_category_id: mainCatMap['IT'], sub_category_name: 'Cloud' },
      { main_category_id: mainCatMap['IT'], sub_category_name: 'Data' },
      {
        main_category_id: mainCatMap['IT'],
        sub_category_name: 'Consumable Inventory',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Electrical Equipment',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Scientific Equipment',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Office Equipment',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Furniture',
      },
    ];

    await assetSubCategoryScript.insertAssetSubCategoryTable(
      schemaName,
      assetSubCategoryData,
    );

    console.log('13');

    // Fetch inserted subcategories to build mapping
    const insertedSubCategories = await this.dataSource.query(
      `SELECT sub_category_id, sub_category_name, main_category_id FROM ${schemaName}.asset_sub_category`,
    );

    const subCatMap: Record<string, Record<string, number>> = {};
    insertedSubCategories.forEach((sub) => {
      const mainName = Object.keys(mainCatMap).find(
        (key) => mainCatMap[key] === sub.main_category_id,
      );
      if (mainName) {
        if (!subCatMap[mainName]) subCatMap[mainName] = {};
        subCatMap[mainName][sub.sub_category_name] = sub.sub_category_id;
      }
    });

    // STEP 3: Create and Insert Items
    const assetItemScript = new ItemsScript(this.dataSource);
    await assetItemScript.createItemsTable(schemaName);

    const assetItemRawData = [
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Computer',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Server',
        is_licensable: true,
        item_type: 'Physical',
      },
       {
        main: 'IT',
        sub: 'Hardware',
        name: 'Mobile',
        is_licensable: true,
        item_type: 'Physical',
      },
       {
        main: 'IT',
        sub: 'Hardware',
        name: 'Keyboard',
        is_licensable: false,
        item_type: 'Physical',
      },
       {
        main: 'IT',
        sub: 'Hardware',
        name: 'Mouse',
        is_licensable: false,
        item_type: 'Physical',
      },
       {
        main: 'IT',
        sub: 'Hardware',
        name: 'Webcam',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Router',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Switch',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Peripherals',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Printer and Scanners',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'IP Camera',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Access Point',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Monitors',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Headset',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Projector',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Tablet',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Videoconference Camera',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Storage Device',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Operating System',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Application Software',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Contract',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Cloud',
        name: 'Virtual Machine',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Cloud',
        name: 'Storage resources',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Data',
        name: 'Contract',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Data',
        name: 'Warranty',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Data',
        name: 'Business Application',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Consumable Inventory',
        name: 'Pen Drive',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Consumable Inventory',
        name: 'Cartridge',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Consumable Inventory',
        name: 'CD / DVD',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Air Conditioner',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Pedestal Fan',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Desert Coolers',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Refrigerators',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Microwaves',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Electric Motors',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Generators',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Invertors',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Shredding machine',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Voltage Stabilizer',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'UPS',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Furniture',
        name: 'Chair',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Furniture',
        name: 'Computer Desk',
        is_licensable: false,
        item_type: 'Physical',
      },
       {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'CCTV Camera',
        is_licensable: true,
        item_type: 'Physical',
      },
       {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'VC Camera',
        is_licensable: true,
        item_type: 'Physical',
      },
       {
        main: 'IT',
        sub: 'Hardware',
        name: 'Wireless AP',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Firewall',
        is_licensable: false,
        item_type: 'Physical',
      },
    ];

    const assetItemData = assetItemRawData.map((item) => {
      const mainId = mainCatMap[item.main];
      const subId = subCatMap[item.main]?.[item.sub];
      if (!mainId || !subId) {
        throw new Error(`Missing ID mapping for item: ${item.name}`);
      }
      return {
        main_category_id: mainId,
        sub_category_id: subId,
        asset_item_name: item.name,
        is_licensable: item.is_licensable,
        item_type: item.item_type,
      };
    });

    await assetItemScript.insertAssetItemTable(schemaName, assetItemData);

    console.log('14');

    //// VK inserting item - field relations

    const mappings = [
      { itemName: 'Computer', fieldName: 'RAM' },
      { itemName: 'Computer', fieldName: 'Processor' },
      { itemName: 'Computer', fieldName: 'Graphics' },
      { itemName: 'Computer', fieldName: 'HDD' },
       { itemName: 'Computer', fieldName: 'Host Name' },
      { itemName: 'Computer', fieldName: 'Domain Name' },
      { itemName: 'Computer', fieldName: 'IPv4' },
      { itemName: 'Server', fieldName: 'RAM' },
      { itemName: 'Server', fieldName: 'Processor' },
      { itemName: 'Server', fieldName: 'Graphics' },
      { itemName: 'Server', fieldName: 'HDD' },
      { itemName: 'Server', fieldName: 'IPv4' },
      { itemName: 'Server', fieldName: 'Graphics' },
       { itemName: 'Server', fieldName: 'Host Name' },
      { itemName: 'Server', fieldName: 'Domain Name' },

       { itemName: 'Tablet', fieldName: 'RAM' },
      { itemName: 'Tablet', fieldName: 'Processor' },
      { itemName: 'Tablet', fieldName: 'Graphics' },
      { itemName: 'Tablet', fieldName: 'HDD' },
      { itemName: 'Tablet', fieldName: 'IPv4' },
      { itemName: 'Tablet', fieldName: 'Graphics' },
       { itemName: 'Tablet', fieldName: 'Host Name' },
      { itemName: 'Tablet', fieldName: 'Domain Name' },

        { itemName: 'Mobile', fieldName: 'RAM' },
      { itemName: 'Mobile', fieldName: 'Processor' },
      { itemName: 'Mobile', fieldName: 'Graphics' },
      { itemName: 'Mobile', fieldName: 'HDD' },
      { itemName: 'Mobile', fieldName: 'IPv4' },
      { itemName: 'Mobile', fieldName: 'Screen' },
       { itemName: 'Mobile', fieldName: 'IMEI No.' },
      { itemName: 'Mobile', fieldName: 'Carrier' },

      { itemName: 'Switch', fieldName: 'RAM' },
      { itemName: 'Switch', fieldName: 'Processor' },
      { itemName: 'Switch', fieldName: 'HDD' },
       { itemName: 'Switch', fieldName: 'Host Name' },
      { itemName: 'Switch', fieldName: 'Domain Name' },
      { itemName: 'Switch', fieldName: 'IPv4' },

      { itemName: 'Router', fieldName: 'RAM' },
      { itemName: 'Router', fieldName: 'Processor' },
      { itemName: 'Router', fieldName: 'HDD' },
       { itemName: 'Router', fieldName: 'Host Name' },
      { itemName: 'Router', fieldName: 'Domain Name' },
      { itemName: 'Router', fieldName: 'IPv4' },


      { itemName: 'Firewall', fieldName: 'RAM' },
      { itemName: 'Firewall', fieldName: 'Processor' },
      { itemName: 'Firewall', fieldName: 'HDD' },
      { itemName: 'Firewall', fieldName: 'IPv4' },
      { itemName: 'Firewall', fieldName: 'Graphics' },
       { itemName: 'Firewall', fieldName: 'Host Name' },
      { itemName: 'Firewall', fieldName: 'Domain Name' },
      { itemName: 'Firewall', fieldName: 'Carrier' },

      { itemName: 'CCTV Camera', fieldName: 'Type' },
      { itemName: 'CCTV Camera', fieldName: 'Pixel' },
      { itemName: 'CCTV Camera', fieldName: 'IPv4' },

       { itemName: 'VC Camera', fieldName: 'Type' },
      { itemName: 'VC Camera', fieldName: 'Pixel' },
      { itemName: 'VC Camera', fieldName: 'IPv4' },

       { itemName: 'Storage Device', fieldName: 'Type' },
      { itemName: 'Storage Device', fieldName: 'Product Description' },
      { itemName: 'Storage Device', fieldName: 'IPv4' },

      { itemName: 'Wireless AP', fieldName: 'IPv4' },
       { itemName: 'Wireless AP', fieldName: 'Host Name' },

       { itemName: 'Printer and Scanners', fieldName: 'RAM' },
     { itemName: 'Printer and Scanners', fieldName: 'Host Name' },
      { itemName: 'Printer and Scanners', fieldName: 'Domain Name' },
      { itemName: 'Printer and Scanners', fieldName: 'IPv4' },
    ];

    await itemfieldMappingScript.insertItemFieldMappings(schemaName, mappings);

    // Create table designation
    const statusScript = new AssetStatusTypesScript(this.dataSource);
    await statusScript.createAssetStatusTable(schemaName);

    const statusData = [
      { status_type_name: 'AVAILABLE' },
      { status_type_name: 'IN USE' },
    ];

    await statusScript.insertAssetStatusTable(schemaName, statusData);

    console.log('15');

    // Create table designation
    const ownershipstatusScript = new AssetOwnershipStatusTypesScript(
      this.dataSource,
    );
    await ownershipstatusScript.createAssetOwnershipStatusTypesTable(
      schemaName,
    );

    const ownershipstatusData = [
      { ownership_status_type_name: 'CAPEX' },
      { ownership_status_type_name: 'LEASE' },
      { ownership_status_type_name: 'OPEX' },
      { ownership_status_type_name: 'RENTED' },
      { ownership_status_type_name: 'OWNED' },
    ];

    await ownershipstatusScript.insertAssetOwnershipStatusTable(
      schemaName,
      ownershipstatusData,
    );

    console.log('16');

    // Create table designation
    const workingstatusScript = new AssetWorkingStatusScript(this.dataSource);
    await workingstatusScript.createAssetWorkingStatusTable(schemaName);

    const workingstatusData = [
      { working_status_type_name: 'OPERATIONAL' },
      { working_status_type_name: 'UNDER MAINTAINANCE' },
      { working_status_type_name: 'FAULTY' },
      { working_status_type_name: 'DAMAGED' },
      { working_status_type_name: 'RETIRED' },
    ];

    await workingstatusScript.insertAssetWorkingStatusTable(
      schemaName,
      workingstatusData,
    );

    console.log('17');

    // Create table designation
    const itemRelationScript = new AssetItemRelationScript(this.dataSource);
    await itemRelationScript.createAssetItemRelationTable(schemaName);



  enum RelationType {
     Other  = "Other",
     Accessory  = "Accessory",
     Contract  = "Contract",
     Application  = "Application",   
    
  }


    const relations: {
    parentItemName: string;
    childItemName: string;
    relationType: RelationType;
  }[] = [
   { parentItemName: "Computer", childItemName: "Keyboard", relationType: RelationType.Accessory },
    { parentItemName: "Computer", childItemName: "Monitors", relationType: RelationType.Accessory },
     { parentItemName: "Computer", childItemName: "Mouse", relationType: RelationType.Accessory }, 
     { parentItemName: "Computer", childItemName: "Contract", relationType: RelationType.Contract },
     { parentItemName: "Computer", childItemName: "Application Software", relationType: RelationType.Application },
    { parentItemName: "Computer", childItemName: "Operating System", relationType: RelationType.Application },


  ];

await itemRelationScript.insertItemRelations(schemaName, relations);


    console.log('18');

    // Create table designation
    const assetScript = new AssetsScript(this.dataSource);
    await assetScript.createAssetsTable(schemaName);

    console.log('19');

    // Create table designation
    const licencetypesScript = new LicenceTypesScript(this.dataSource);
    await licencetypesScript.createLicenceTypesTable(schemaName);

    const licencetypesDataflags = [
      {
        licence_type: 'FPP',
        licence_key_type: true,
        needs_license_key: true,
        bulk_license: false,
        have_plan_type: false,
        is_active: 1,
        is_delete: 0,
      },
      {
        licence_type: 'Volume',
        licence_key_type: false,
        needs_license_key: true,
        bulk_license: false,
        have_plan_type: false,
        is_active: 1,
        is_delete: 0,
      },
      {
        licence_type: 'Preloaded',
        licence_key_type: true,
        needs_license_key: false,
        bulk_license: false,
        have_plan_type: false,
        is_active: 1,
        is_delete: 0,
      },
      {
        licence_type: 'Subscription',
        licence_key_type: true,
        needs_license_key: true,
        bulk_license: false,
        have_plan_type: true,
        is_active: 1,
        is_delete: 0,
      },
      {
        licence_type: 'Perpetual',
        licence_key_type: true,
        needs_license_key: true,
        bulk_license: false,
        have_plan_type: false,
        is_active: 1,
        is_delete: 0,
      },
      {
        licence_type: 'OEM',
        licence_key_type: true,
        needs_license_key: true,
        bulk_license: false,
        have_plan_type: false,
        is_active: 1,
        is_delete: 0,
      },
    ];
    
    

    await licencetypesScript.insertLicenceTypeTable(
      schemaName,
      licencetypesDataflags,
    );

    console.log('20');

    // Create table designation
    const vendorScript = new VendersScript(this.dataSource);
    await vendorScript.createVendersTable(schemaName);

    console.log('21');

    // Create table designation
    const stockScript = new StocksScript(this.dataSource);
    await stockScript.createStocksTable(schemaName);

    console.log('22');

    // Create table designation
    const assetMappingScript = new AssetMappingRelations(this.dataSource);
    await assetMappingScript.createAssetMappingRelationsTable(schemaName);

    console.log('23');

    // Create table designation
    const transferScript = new AssetTransferHistoryScript(this.dataSource);
    await transferScript.createAssetTransferHistoryTable(schemaName);

    console.log('24');

    // Create table designation
    const stockSerialScript = new AssetStockSerialsScript(this.dataSource);
    await stockSerialScript.createAssetStockSerialsTable(schemaName);

    console.log('25');

      // Create table OrgStats
  const OrgStats = new orgStatsScriptScript(this.dataSource)
  await OrgStats.createOrgStatsScriptTable(schemaName)

  console.log('26');

  // Create Table AssetProject
  const assetProject = new assetProjectScript(this.dataSource)
  await assetProject.createAssetProjectTable(schemaName)

  console.log('27');

  // Create Table CostCenterTable
  const costCenterTable = new assetCostCenterScript(this.dataSource)
  await costCenterTable.createAssetCostCenterScriptTable(schemaName)

  console.log('28');


  // Create Table Location Table
  const locationTable = new assetLocationScript(this.dataSource)
  await locationTable.createAssetLocationScriptTable(schemaName)

  console.log('29');

  // Create Table Depriciataion Table
  const depriciataionTable = new assetDepreciationMethodsScript(this.dataSource)
  await depriciataionTable.createassetDepreciationMethodsScriptTable(schemaName)

  console.log('30');
    // Send onboarding email with plain-text password
    // await this.sendOnboardingEmail(user.users_business_email, randomPassword);
    // const fullname = 'Norbik Asset';
    console.log("Generated plain password (to be sent via email):", randomPassword);

    // await this.mailService.sendEmail(
    //   user.business_email,
    //   'Welcome Aboard! Everything You Need to Get Started',
    //   await renderEmail(
    //     EmailTemplate.ONBOARDING_CONFIRMATION,
    //     {
    //       name: fullname,
    //       companyName: user.organization.organization_name,
    //       trialUrl: `${process.env.CLIENT_ORIGIN_URL}/authentication/signin/signin-cover/`,
    //       username: user.business_email,
    //       password: randomPassword,
    //     },
    //     this.mailConfigService, // Ensure database connection is passed
    //   ),
    // );

    return {
      statusCode: 200,
      message:
        'Your account setup is complete. Please check your email for login credentials and proceed to sign in.',
    };
  }

  /**
   * Hashes a password using bcrypt
   * @param password Plain password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Sends an email with the OTP for verification
   * @param email User's email
   * @param otp OTP to verify
   */
  private async sendVerificationEmail(email: string, otp: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com', // e.g., 'smtp.gmail.com'
      port: 587, // Typical port for SMTP (e.g., 587 for Gmail)
      secure: false, // Set to true if using port 465 (SSL)
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Your sender email
      to: email,
      subject: 'Verify your account',
      text: `Your OTP for verification is ${otp}. This OTP is valid for 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);
  }

  /**
   * Sends an onboarding email with login credentials
   * @param email User's email
   * @param password User's password
   */

  // private async sendOnboardingEmail(email: string, password: string) {
  //   const transporter = nodemailer.createTransport({
  //     host: 'smtp.office365.com',
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: process.env.EMAIL_USER,
  //       pass: process.env.EMAIL_PASSWORD,
  //     },
  //   });

  //   const mailOptions = {
  //     from: process.env.EMAIL_USER,
  //     to: email,
  //     subject: 'Welcome and Thank You for Onboarding',
  //     text: `
  //         Welcome to our platform!
 
  //         Your account has been successfully created.
  //         Here are your login details:
 
  //         Email: ${email}
  //         Password: ${password}
 
  //         Please use these credentials to log in.
 
  //         If you have any questions, feel free to contact us.
  //       `,
  //   };

  //   await transporter.sendMail(mailOptions);
  // }

  
  private async generateBillingId(): Promise<string> {
    const date = new Date();
    const day = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const lastSub = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.sub_billing_id  LIKE :day', { day: `BILL-${day}-%` })
      .orderBy('sub.sub_billing_id ', 'DESC')
      .getOne();

    let seq = 1;
    if (lastSub) {
      seq = parseInt(String(lastSub.sub_billing_id).split('-')[2]) + 1;
    }

    return `BILL-${day}-${seq.toString().padStart(4, '0')}`;
  }

  private async generateOrderId(): Promise<string> {
    const date = new Date();
    const day = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Fetch the last order for today
    const lastOrder = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.sub_order_id LIKE :day', { day: `ORD-${day}-%` })
      .orderBy('sub.sub_order_id', 'DESC')
      .getOne();

    let seq = 1;
    if (lastOrder) {
      // Extract sequence number from last orderId
      const parts = lastOrder.sub_order_id.split('-'); // ["ORD", "YYYYMMDD", "XXXX"]
      seq = parseInt(parts[2], 10) + 1;
    }

    // Format with leading zeros
    return `ORD-${day}-${seq.toString().padStart(4, '0')}`;
  }

}
