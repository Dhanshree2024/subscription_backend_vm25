import { Injectable, UnauthorizedException, ExecutionContext, InternalServerErrorException, HttpStatus, HttpException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from '../organization_register/verify-otp.dto';

import { ConfigRepository } from 'src/config/config.repository';
import { RegisterUserLogin } from '../organization_register/entities/register-user-login.entity';
import { v4 as uuidv4 } from 'uuid';
import UAParser from "ua-parser-js";
import { Request, Response } from 'express'; 

import { isEmail } from 'class-validator'; // Use a utility to validate email format
import validator from 'validator'; // Install validator if not already installed
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { exit, permission } from 'process';
import { SignJWT, CompactEncrypt } from 'jose';
import { encrypt, decrypt } from '../common/encryption_decryption/crypto-utils'; // Import encryption utility
import { MailService } from 'src/common/mail/mail.service';
import { renderEmail, EmailTemplate } from 'src/common/mail/render-email';
import { MailConfigService } from '../common/mail/mail-config.service';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { In, Repository } from 'typeorm';
import { parse } from 'cookie';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { Roles } from 'src/organization_roles_permission/entity/role.entity';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';
import { isBefore } from 'date-fns';

// import { OrganizationRolesPermissionService } from 'src/organization_roles_permission/organization_roles_permission.service';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserRepository) private userRepository: UserRepository,
    private readonly configRepository: ConfigRepository,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    
    @InjectRepository(RegisterUserLogin)
    private readonly registerserRepository: Repository<RegisterUserLogin>,
    
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
   
    
    @InjectRepository(User)
    private readonly roleRepository: Repository<Roles>,

    @InjectRepository(OrgSubscription)
    private readonly subscriptionRepository: Repository<OrgSubscription>,

    private readonly mailConfigService: MailConfigService, // Inject service

    private readonly mailService: MailService,

    // private readonly organizationrolespermissionservice: OrganizationRolesPermissionService,


  ) { }



  async validateUser(
    loginDto: LoginDto,
    response: Response,
    req: Request 
  ): Promise<{
    success: boolean; message: string; data?: any; status: number
  }> {
    const { email, password } = loginDto;
 
    console.log("login dto", loginDto)
    try {
      // Step 1: Fetch the user based on email or mobile number
      const user = await this.userRepository.findUserWithMobileNumber(email);
      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found',
          statusCode: 401,
        });
      }

      // 🚨 Step 1.5: Check if user is active
      if (user.is_active !== 1) { // or `user.is_active !== true` if it's boolean
        throw new UnauthorizedException({
          message: 'User is deactivated. Contact administrator.',
          statusCode: 401,
        });
      }
      
      
      
      
      

 console.log("user", user)
      // Step 2: Validate the password
      const isPasswordValid = await this.userRepository.validatePassword(
        password,
        user.password,
      );

      console.log("isPasswordValid", password, user.password)
      if (!isPasswordValid) {
        throw new UnauthorizedException({
          message: 'Invalid credentials',
          statusCode: 401,
        });
      }

 if (!user.passwordSet) {
  await this.userRepository.update(user.user_id, {
    passwordReset: 'Y'
  });
}
    // ✅ Step 3: Subscription Expiry & Payment Validation
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_profile_id: user.organization.organization_id },
      relations: ['plan', 'billingInfo'],
      order: { renewal_date: 'DESC' },
    });

    if (!subscription) {
      throw new UnauthorizedException({
        message: 'No active subscription found for your organization.',
        statusCode: 401,
      });
    }

    const today = new Date();
    const renewalDate = new Date(subscription.renewal_date);

    if (isBefore(renewalDate, today)) {
      // throw new UnauthorizedException({
      //   message: 'Your organization subscription has expired.',
      //   statusCode: 401,
      // });
      return {
        success: false,
        message: 'Your organization subscription has expired.',
        status: 440, // custom status code (not standard, but useful)
        data: {
          redirect: '/renewal-page', // <-- frontend will check this and redirect
          subscription_id: subscription.subscription_id,
          organization_id: user.organization.organization_id,
          subscriptionExpired: true, 
          renewal_date: subscription.renewal_date, 
        },
      };
    }
    // let subscriptionExpired = false;
    // if (isBefore(renewalDate, today)) {
    //   subscriptionExpired = true; // ⚠ allow login but mark as expired
    // }


    // ✅ Payment Method check
    const billing = subscription.billingInfo?.[0];
    if (billing) {
      if (billing.methodId === 1) {
        // Online payment → always allow
      } else if (billing.methodId === 5) {
        console.log("billing.methodId:",billing.methodId)
        // Offline payment → must be approved
        if (billing.status !== 'approved') {
          throw new UnauthorizedException({
            message: 'Offline payment not approved yet. Please contact admin.',
            statusCode: 401,
          });
        }
      }
    }
      // Step 3: Set schema dynamically for tenant handling
      const organizationSchema = `org_${user.organization.organization_schema_name}`;
      await this.setSchema(organizationSchema);

      // Step 4: Query the user's role
      const query = `
      SELECT
        r.role_id,
        r.role_name,
        r.is_compulsary,
        u.user_id,
        u.first_name,
        u.last_name,
        u.profile_image,
        u.role_id,
        p.permission_id,
        p.permissions
      FROM ${organizationSchema}.users u
      LEFT JOIN ${organizationSchema}.organization_roles r
        ON u.role_id = r.role_id
      LEFT JOIN ${organizationSchema}.organization_permissions p
        ON r.role_id = p.role_id
      WHERE u.register_user_login_id = $1
        AND u.is_active = 1
        AND u.is_deleted = 0
      LIMIT 1;
    `;

      const result = await this.userRepository.query(query, [user.user_id]);
      if (!result || result.length === 0) {
        throw new BadRequestException('User is not active or role not found');
      }

      const { role_id, role_name, is_compulsary } = result[0];

      if (is_compulsary === true) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

        await this.userRepository.update(user.user_id, { otp, otp_expiry: otpExpiry });

        const fullname = `${user.first_name} ${user.last_name}`;

        await this.mailService.sendEmail(
          email,
          "OTP for Login Verification",
          await renderEmail(
            EmailTemplate.AUTH_LOGIN_VERIFICATION,
            { name: fullname, otp },
            this.mailConfigService
          )
        );
      }


      // Step 5: Generate JWT tokens
      const tokens = await this.generateTokens(user);

      // STEP 5.1:Create Session
      const sessionId = uuidv4();
      const parser = new (UAParser as any)(req.headers['user-agent'] || "");
      const device = parser.getResult();
      console.log("device", device);
      console.log("sessionId", sessionId);
      
      const deviceName =
        device.device.vendor && device.device.model
          ? `${device.device.vendor} ${device.device.model}`
          : `${device.browser.name} on ${device.os.name}`;
      
      const deviceType = device.device.type || 'desktop';
      const browser = device.browser.name || 'Unknown';
      const os = device.os.name || 'Unknown';
      
      // console.log("deviceName", deviceName)
      // console.log("deviceType", deviceType)
      // console.log("browser", browser)
      // console.log("os", os)
      
    
      
      await this.sessionRepository.insert({
        user_id: user.user_id,
        session_id: sessionId,
        device_name: deviceName || `${browser} on ${os}`,
        device_type: deviceType,
        ip_address: req.ip,
        location: null,
        user_agent: req.headers['user-agent'],
        login_at: new Date(),
        last_seen: new Date(),
        // expires_at: new Date(Date.now()), // optional expiry
        is_active: true,
      });
      
      
      // Step 6: Set cookies
      this.setAuthCookies(
        response,
        tokens,
        encrypt(user.user_id.toString()),
        encrypt(result[0].user_id.toString()),
        encrypt(result[0].role_id.toString()),
        encrypt(user.organization.organization_schema_name),
        encrypt(user.organization.organization_id.toString()),
        encrypt(result[0]?.permissions),
        sessionId,
      );
      
      

      return {
        success: true,
        message: 'Login successful',
        status: 200,
        data: {
          session_id: sessionId,                // <-- session tracking
          jwt_token: tokens.accessToken,
          jwt_refresh_token: tokens.refreshToken,
          user_id: user.user_id,
          main_user_id: result[0].user_id,
          organization_id: user.organization.organization_id,
          // jwt_token: tokens.accessToken,
          // jwt_refresh_token: tokens.refreshToken,
          // user_id: user.user_id,
          // main_user_id: result[0].user_id,
          // organization_id: user.organization.organization_id,
          role_id,
          role: role_id ? { role_id, role_name, is_compulsary } : null,
          passwordSet: user.passwordSet,
          organization_schema_name: user.organization.organization_schema_name,
          permissions: result[0].permissions,
          profile_image: result[0].profile_image,
          // subscriptionExpired,
        },
      };

    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof UnauthorizedException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Internal server error');
    }
  }

  async verifyLoginOtp(verifyOtpDto: VerifyOtpDto, response: Response, context: any): Promise<any> {
    try {
      const { otp, user_id } = verifyOtpDto;

      console.log("verifyOtpDto", verifyOtpDto)
      console.log("otp dto", verifyOtpDto)
      // Step 1: Validate OTP with the database entity
      const user = await this.userRepository.findOne({
        where: { otp, user_id, verified: true },
        relations: ['organization'], // Ensure the organization relation is loaded
      });

      // Step 2: Check if the user with the given OTP exists
      if (!user) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Invalid OTP or user not found.',
          details: { otp },
        });
      }

      // Step 3: Check if OTP has expired
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

      // Step 4: Mark OTP as verified and perform necessary updates
      user.otp = null;  // Clear OTP
      user.otp_expiry = null;  // Remove OTP expiry
      user.verified = true;  // Mark as verified

      // Save the updated user entity
      await this.userRepository.save(user);

      // Step 3: Set schema dynamically for tenant handling
      const organizationSchema = `org_${user.organization.organization_schema_name}`;
      await this.setSchema(organizationSchema);

      // Step 4: Query the user's role using the current schema
      const query = `
    SELECT
      r.role_id,
      r.role_name,
      u.user_id,
      u.first_name,
      u.last_name,
      u.profile_image,
      u.role_id,
      p.permission_id,
          p.permissions
    FROM ${organizationSchema}.users u
    LEFT JOIN ${organizationSchema}.organization_roles r
          ON u.role_id = r.role_id
        LEFT JOIN ${organizationSchema}.organization_permissions p
          ON r.role_id = p.role_id
    WHERE u.register_user_login_id = $1
      AND u.is_active = 1
      AND u.is_deleted = 0
      LIMIT 1;
  `;


      const result = await this.userRepository.query(query, [user.user_id]);

      console.log("RESULT 2 step", result)
      if (!result || result.length === 0) {
        throw new BadRequestException('User is not active or role not found');
      }


      // Step 5: Generate JWT tokens
      const tokens = await this.generateTokens(user);

      // Step 6: Clear and set encrypted cookies
      const encryptedUserId = user.user_id ? encrypt(user.user_id.toString()) : null;
      const encryptedSchemaName = user.organization.organization_schema_name ? encrypt(user.organization.organization_schema_name) : null;

      const encryptedOrganizationId = user.organization.organization_id ? encrypt(user.organization.organization_id.toString()) : null;
      const profileImage = result[0]?.profile_image || null;
      const encryptedPermissions = result[0]?.permissions ? encrypt(JSON.stringify(result[0].permissions)) : null;
      const encryptedRoleId = result[0]?.role_id ? encrypt(JSON.stringify(result[0].role_id)) : null;
      const encryptedProfileImage = profileImage ? encrypt(profileImage) : null;

      response.clearCookie('jwtToken');
      response.clearCookie('jwt_refresh_token');
      response.clearCookie('x-organization-schema');
      response.clearCookie('system_user_id');

      response.cookie('jwtToken', tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      response.cookie('jwt_refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      response.cookie('x-organization-schema', encryptedSchemaName, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      response.cookie('system_user_id', encryptedUserId, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      response.cookie('organization_id', encryptedOrganizationId, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });


      response.cookie('profile_image', encryptedProfileImage, {
        httpOnly: false, // Allow frontend access
        // secure: true,
        // sameSite: 'none',
      });

      response.cookie('role_id', encryptedRoleId, {
        httpOnly: false, // Allow frontend access
        // secure: true,
        // sameSite: 'none',
      });

      response.cookie('permissions', encryptedPermissions, {
        httpOnly: false, // Allow frontend access
        // secure: true,
        // sameSite: 'none',
      });



      // Return success response
      return {
        status: 200,
        jwt_token: tokens.accessToken,
        jwt_refresh_token: tokens.refreshToken,
        user_id: user.user_id,
        organization_id: user.organization.organization_id,
        passwordSet: user.passwordSet,
        organization_schema_name: user.organization.organization_schema_name,
        permissions: result[0]?.permissions,
        role_id: result[0]?.role_id,
        main_user_id: result[0].user_id,
        profile_image: profileImage,
        message: 'Login successful',
      };
    }
    catch (error) {
      console.error('Login error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: 500,
          message: 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  async checkSubscriptionRestrictions(orgId: number) {
    // Fetch latest subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_profile_id: orgId },
      relations: ['plan', 'billingInfo'],
      order: { renewal_date: 'DESC' },
    });
  
    if (!subscription) {
      return {
        valid: false,
        reason: 'no_subscription',
        message: 'No active subscription found',
      };
    }
  
    const today = new Date();
    const renewalDate = new Date(subscription.renewal_date);
  
    if (renewalDate < today) {
      return {
        valid: false,
        reason: 'expired',
        message: 'Subscription expired',
        renewal_date: subscription.renewal_date,
        subscription_id: subscription.subscription_id,
      };
    }
  
    // Billing method restrictions
    const billing = subscription.billingInfo?.[0];
    if (billing && billing.methodId === 5 && billing.status !== 'approved') {
      return {
        valid: false,
        reason: 'offline_payment_pending',
        message: 'Offline payment not approved',
      };
    }
  
      // If the plan or subscription explicitly restricts login
    if (subscription.restrict_login === true) {
      return {
        valid: false,
        reason: 'login_restricted',
        message: 'Login is restricted for this organization due to plan limitations.',
        subscription_id: subscription.subscription_id,
      };
    }

    return {
      valid: true,
      reason: null,
      message: 'Subscription is valid',
      renewal_date: subscription.renewal_date,
      subscription_id: subscription.subscription_id,
      isTrial: subscription.plan?.set_trial || false,
    };
  }
  
  
  async logout(req: Request, res: Response): Promise<{ message: string }> {
    try {
      const cookies = parse(req.headers.cookie || '');
      const sessionId = cookies.session_id;

      if (sessionId) {
        // Update session instead of deleting
        await this.sessionRepository.update(
          { session_id: sessionId },
          {
            is_active: false,
            logout_at: new Date(),
          },
        );
      }

      // Clear cookies
      const cookiesToClear = [
        "jwtToken",
        "jwt_refresh_token",
        "x-organization-schema",
        "system_user_id",
        "organization_id",
        "main_user_id",
        "role_id",
        "profile_image",
        "permissions",
        "session_id",
      ];

      cookiesToClear.forEach((cookieName) => {
        res.clearCookie(cookieName, { httpOnly: true });
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      throw new HttpException(
        { message: 'Logout failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  
  async logoutAllSessions(userId: number, res: Response): Promise<{ message: string }> {
    try {
      // Update all active sessions for this user
      await this.sessionRepository.update(
        { user_id: userId, is_active: true },
        { is_active: false, logout_at: new Date() },
      );

      // Clear all auth-related cookies on this device
      const cookiesToClear = [
        "jwtToken",
        "jwt_refresh_token",
        "x-organization-schema",
        "system_user_id",
        "organization_id",
        "main_user_id",
        "role_id",
        "profile_image",
        "permissions",
        "session_id",
      ];

      cookiesToClear.forEach((cookieName) => {
        res.clearCookie(cookieName, { httpOnly: true });
      });

      return { message: 'Logged out from all sessions successfully' };
    } catch (error) {
      console.error('Logout all sessions error:', error);
      throw new HttpException(
        { message: 'Logout failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  async logoutAllSessionsByUserId(localUserId: number): Promise<{ message: string }> {
    
    try {
      
      // Fetch the local user to get public user ID
      
      // const user = await this.userRepo.findOne({
      //   where: { user_id: localUserId },
      // });

      // if (!user || !user.register_user_login_id) {
      //   throw new NotFoundException(
      //     `Public user ID not found for local user ${localUserId}`
      //   );
      // }

      // const publicUserId = user.register_user_login_id;
      
      // console.log("publicUserId", publicUserId)

      // Find all local users tied to this public user
      // const users = await this.registerserRepository.find({
      //   where: { user_id: publicUserId },
      // });

      // const userIds = users.map(u => u.user_id);

      // // Update all active sessions for these users
      // await this.sessionRepository.update(
      //   { user_id: In(userIds), is_active: true },
      //   { is_active: false, logout_at: new Date() },
      // );

      // return { message: `All sessions logged out for public user ${publicUserId}`};
      
      return { message: `All sessions logged out for public user ` };
    } catch (error) {
      console.error('Logout all sessions error:', error);
      throw new HttpException(
        { message: 'Logout all sessions failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }




  async fetchUserLoginProfile(
    login_user_id: number,
  ) {
    const userExists = await this.userRepository.findOne({ where: { user_id: login_user_id } });

    console.log("userExists", userExists)
    if (!userExists) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'Invalid createdBy user ID' },
        HttpStatus.BAD_REQUEST,
      );
    }

     const matchedUser = await this.userRepo.findOne({
    where: { users_business_email: userExists.business_email },
     relations: ['user_role'],
  });

      console.log("matchedUser", matchedUser)

    return {
      ...userExists,
    matchedUser,
  };
  }

  async getApiKey(): Promise<string | null> {
    return await this.configRepository.getJwtSecret();
  }

  // Generate secure JWT tokens


  async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION;
    const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION;

    // Access and Refresh secrets should be 256 bits (32 bytes)
    const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET_KEY;
    const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY;

    // Ensure that the secrets are 256 bits by hashing them
    const accessSecret = new TextEncoder().encode(ACCESS_SECRET.padEnd(32, '0')); // Pad if needed to 32 bytes
    const refreshSecret = new TextEncoder().encode(REFRESH_SECRET.padEnd(32, '0')); // Pad if needed to 32 bytes

    const payload = {
      userId: user.user_id,
      organizationSchema: user.organization.organization_schema_name,
    };

    // Encrypt payload (symmetric encryption with AES-GCM)
    const encryptPayload = async (payload: object, secret: Uint8Array): Promise<string> => {
      const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
      return await new CompactEncrypt(encodedPayload)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) // Use AES-GCM with 256-bit key
        .encrypt(secret);
    };

    const encryptedPayload = await encryptPayload(payload, accessSecret);

    // Generate Access Token with HS256 signing
    const accessToken = await new SignJWT({ data: encryptedPayload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_ACCESS_EXPIRATION)
      .sign(accessSecret);

    // Generate Refresh Token with HS256 signing
    const refreshToken = await new SignJWT({ data: encryptedPayload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_REFRESH_EXPIRATION)
      .sign(refreshSecret);

    // Store hashed refresh token in the database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(user.user_id, { refreshToken: hashedRefreshToken });

    return { accessToken, refreshToken };
  }


  async updatePassword(
    user_id: number,
    newPassword: string,
    response: Response,
    currentPassword?: string, // Optional currentPassword

  ): Promise<{
    jwt_token: string; message?: string; status?: number; user_id?: number; passwordSet?: boolean, jwt_refresh_token?: string, organization_schema_name?: string, organization_id?: number,
    permissions: string, profile_image: string, role_id: number, main_user_id: number, is_compulsary: boolean,plan_id?: number,newPassword?: string;
  }> {

    // Validate user_id
    if (!user_id) {
      console.error('Invalid user_id:', user_id);
      throw new BadRequestException('Invalid user ID');
    }

    // Fetch user by ID
    const user = await this.userRepository.findOne({ where: { user_id } });
    console.log("user from repo 458", user)

    if (!user) {
      throw new UnauthorizedException('User not found');
    }


    // If currentPassword is provided, validate it
    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await this.userRepository.update(user_id, {
      password: hashedNewPassword,
      passwordSet: true, // Mark password as updated
      verified: true,
      passwordReset: 'N'
    });

    // Fetch updated user details with organization schema
    const fetchUser = await this.userRepository.findUserWithOrganizationSchema(user.business_email);
    console.log("fetchUser 485", fetchUser)


 const orgSchema = `org_${fetchUser.organization.organization_schema_name}`;
await this.setSchema(orgSchema); 
await this.userRepository.query(
  `UPDATE ${orgSchema}.users
   SET password = $1, updated_at = NOW()
   WHERE register_user_login_id = $2`,
  [hashedNewPassword, user.user_id],
);

    const query = `
  SELECT
    u.user_id,
    u.first_name,
    u.last_name,
    u.profile_image,
    r.role_id,
    r.role_name,
    r.is_compulsary,
    p.permission_id,
    p.permissions
  FROM ${orgSchema}.users u
  LEFT JOIN ${orgSchema}.organization_roles r
    ON u.role_id = r.role_id
  LEFT JOIN ${orgSchema}.organization_permissions p
    ON p.role_id = u.role_id
  WHERE u.register_user_login_id = $1
    AND u.is_active = 1
    AND u.is_deleted = 0
  LIMIT 1;
`;

    const result = await this.userRepository.query(query, [user.user_id]);

    if (result[0].is_compulsary === true) {

      // Generate a random OTP
      // Generate OTP and hashed password
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

      await this.userRepository.update(user.user_id, {
        otp,
        otp_expiry: otpExpiry,
      });

      const fullname = user.first_name + " " + user.last_name

      // await this.authloginmail(email, otp, fullname);

      await this.mailService.sendEmail(
        user.business_email,
        "OTP for Login Verification",
        await renderEmail(
          EmailTemplate.AUTH_LOGIN_VERIFICATION,
          {
            name: fullname,
            otp: otp,
          },
          this.mailConfigService // Ensure database connection is passed
        )
      );
    }

    if (!result || result.length === 0) {
      throw new BadRequestException('User is not active or role not found');
    }
    console.log('users details 494', result)

    // Generate new tokens
    const tokens = await this.generateTokens(fetchUser);


    // Step 6: Clear and set encrypted cookies
    const encryptedUserId = user.user_id ? encrypt(user.user_id.toString()) : null;
    //  const encryptedRoleId = user.user_id ? encrypt(user.role_id.toString()) : null;

    const encryptedSchemaName = fetchUser.organization.organization_schema_name ? encrypt(fetchUser.organization.organization_schema_name) : null;

    const encryptedOrganizationId = fetchUser.organization.organization_id ? encrypt(fetchUser.organization.organization_id.toString()) : null;

    const profileImage = result[0]?.profile_image || null;
    const encryptedProfileImage = profileImage ? encrypt(profileImage) : null;
    const encryptedPermissions = result[0]?.permissions ? encrypt(JSON.stringify(result[0].permissions)) : null;


    response.clearCookie('jwtToken');
    response.clearCookie('jwt_refresh_token');
    response.clearCookie('x-organization-schema');
    response.clearCookie('system_user_id');

    response.cookie('jwtToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    response.cookie('jwt_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    response.cookie('x-organization-schema', encryptedSchemaName, {
      httpOnly: true,

    });
    response.cookie('system_user_id', encryptedUserId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    response.cookie('organization_id', encryptedOrganizationId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });


    response.cookie('profile_image', encryptedProfileImage, {
      httpOnly: false, // Allow frontend access
      // secure: true,
      // sameSite: 'none',
    });
    response.cookie('permissions', encryptedPermissions, {
      httpOnly: false,
    });

    // Step 7: Fetch organization subscription
      const orgSubscription = await this.subscriptionRepository.findOne({
        where: { 
          created_by: fetchUser.user_id,
          organization_profile_id: fetchUser.organization.organization_id
        },
      });

      let planId: number | null = null;

      if (orgSubscription) {
        planId = orgSubscription.plan_id;
      }

    return {
      status: 200,
      jwt_token: tokens.accessToken,
      jwt_refresh_token: tokens.refreshToken,
      user_id: fetchUser.user_id, // Return user_id
      passwordSet: fetchUser.passwordSet,
      organization_schema_name: fetchUser.organization.organization_schema_name,
      organization_id: fetchUser.organization.organization_id,
      permissions: result[0]?.permissions,
      profile_image: profileImage,
      role_id: result[0]?.role_id,
      is_compulsary:result[0].is_compulsary,
      main_user_id:result[0]?.user_id,
      plan_id: planId,
      newPassword: newPassword,
      message: 'Password reset successful, redirecting to organization profile!! '
    };

  }


    async updateNewPassword(
    user_id: number,
    newPassword: string,
    response: Response,
    currentPassword?: string, // Optional currentPassword

  ): Promise<{
    jwt_token: string; message?: string; status?: number; user_id?: number; passwordSet?: boolean, jwt_refresh_token?: string, organization_schema_name?: string, organization_id?: number,
    permissions: string, profile_image: string, role_id: number, main_user_id: number, is_compulsary: boolean,plan_id?: number,newPassword?: string;
  }> {

    // Validate user_id
    if (!user_id) {
      console.error('Invalid user_id:', user_id);
      throw new BadRequestException('Invalid user ID');
    }
    console.log("My user user_id:",user_id)

    // Fetch user by ID
    const user = await this.userRepository.findOne({ where: { user_id } });
    console.log("user from repo 458", user)

    if (!user) {
      throw new UnauthorizedException('User not found');
    }


    // If currentPassword is provided, validate it
    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await this.userRepository.update(user_id, {
      password: hashedNewPassword,
      passwordSet: true, // Mark password as updated
      verified: true,
      passwordReset: 'N'
    });

    // Fetch updated user details with organization schema
    const fetchUser = await this.userRepository.findUserWithOrganizationSchema(user.business_email);
    console.log("fetchUser 485", fetchUser)


 const orgSchema = `org_${fetchUser.organization.organization_schema_name}`;
await this.setSchema(orgSchema); 
await this.userRepository.query(
  `UPDATE ${orgSchema}.users
   SET password = $1, updated_at = NOW()
   WHERE register_user_login_id = $2`,
  [hashedNewPassword, user.user_id],
);

    const query = `
  SELECT
    u.user_id,
    u.first_name,
    u.last_name,
    u.profile_image,
    r.role_id,
    r.role_name,
    r.is_compulsary,
    p.permission_id,
    p.permissions
  FROM ${orgSchema}.users u
  LEFT JOIN ${orgSchema}.organization_roles r
    ON u.role_id = r.role_id
  LEFT JOIN ${orgSchema}.organization_permissions p
    ON p.role_id = u.role_id
  WHERE u.register_user_login_id = $1
    AND u.is_active = 1
    AND u.is_deleted = 0
  LIMIT 1;
`;

    const result = await this.userRepository.query(query, [user.user_id]);

    if (result[0].is_compulsary === true) {

      // Generate a random OTP
      // Generate OTP and hashed password
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

      await this.userRepository.update(user.user_id, {
        otp,
        otp_expiry: otpExpiry,
      });

      const fullname = user.first_name + " " + user.last_name

      // await this.authloginmail(email, otp, fullname);

      await this.mailService.sendEmail(
        user.business_email,
        "OTP for Login Verification",
        await renderEmail(
          EmailTemplate.AUTH_LOGIN_VERIFICATION,
          {
            name: fullname,
            otp: otp,
          },
          this.mailConfigService // Ensure database connection is passed
        )
      );
    }

    if (!result || result.length === 0) {
      throw new BadRequestException('User is not active or role not found');
    }
    console.log('users details 494', result)

    // Generate new tokens
    const tokens = await this.generateTokens(fetchUser);


    // Step 6: Clear and set encrypted cookies
    const encryptedUserId = user.user_id ? encrypt(user.user_id.toString()) : null;
    //  const encryptedRoleId = user.user_id ? encrypt(user.role_id.toString()) : null;

    const encryptedSchemaName = fetchUser.organization.organization_schema_name ? encrypt(fetchUser.organization.organization_schema_name) : null;

    const encryptedOrganizationId = fetchUser.organization.organization_id ? encrypt(fetchUser.organization.organization_id.toString()) : null;

    const profileImage = result[0]?.profile_image || null;
    const encryptedProfileImage = profileImage ? encrypt(profileImage) : null;
    const encryptedPermissions = result[0]?.permissions ? encrypt(JSON.stringify(result[0].permissions)) : null;


    response.clearCookie('jwtToken');
    response.clearCookie('jwt_refresh_token');
    response.clearCookie('x-organization-schema');
    response.clearCookie('system_user_id');

    response.cookie('jwtToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    response.cookie('jwt_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    response.cookie('x-organization-schema', encryptedSchemaName, {
      httpOnly: true,

    });
    response.cookie('system_user_id', encryptedUserId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    response.cookie('organization_id', encryptedOrganizationId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });


    response.cookie('profile_image', encryptedProfileImage, {
      httpOnly: false, // Allow frontend access
      // secure: true,
      // sameSite: 'none',
    });
    response.cookie('permissions', encryptedPermissions, {
      httpOnly: false,
    });

    // Step 7: Fetch organization subscription
      const orgSubscription = await this.subscriptionRepository.findOne({
        where: { 
          created_by: fetchUser.user_id,
          organization_profile_id: fetchUser.organization.organization_id
        },
      });

      let planId: number | null = null;

      if (orgSubscription) {
        planId = orgSubscription.plan_id;
      }

    return {
      status: 200,
      jwt_token: tokens.accessToken,
      jwt_refresh_token: tokens.refreshToken,
      user_id: fetchUser.user_id, // Return user_id
      passwordSet: fetchUser.passwordSet,
      organization_schema_name: fetchUser.organization.organization_schema_name,
      organization_id: fetchUser.organization.organization_id,
      permissions: result[0]?.permissions,
      profile_image: profileImage,
      role_id: result[0]?.role_id,
      is_compulsary:result[0].is_compulsary,
      main_user_id:result[0]?.user_id,
      plan_id: planId,
      newPassword: newPassword,
      message: 'Password reset successful, redirecting to organization profile!! '
    };

  }


  async validatePasswordResetLink(userId: number): Promise<boolean> {
    const loginUser = await this.userRepository.findOne({
      where: { user_id: userId, passwordReset:'Y' },
    });
    console.log("loginUser",loginUser)
    return loginUser ? true :false;
  }


  async sendOtpForPasswordReset(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { business_email: email } });

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    try {

      await this.userRepository.update(user.user_id, {
        otp,
        otp_expiry: otpExpiry,
      });

      // Send the OTP via email
      // await this.organization_name(email, otp);

      await this.mailService.sendEmail(
        email,
        "OTP for Reset Password",
        await renderEmail(
          EmailTemplate.PASSWORD_RESET,
          {
            name: user.first_name + ' ' + user.last_name,
            otp: otp,
          },
          this.mailConfigService // Ensure database connection is passed
        )
      );

      return {
        status: 200,
        message: 'OTP sent on email.',
        data: user.user_id,
      };
    } catch (error) {
      throw new HttpException('Failed to update OTP or send email.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  async verifyForgotPasswordOtp(verifyOtpDto: VerifyOtpDto, res: Response): Promise<any> {
    const { otp, user_id } = verifyOtpDto;
    // Validate OTP with the database entity
    // const userRepo = this.userRepository.getRepository(RegisterUserLogin);
    const user = await this.userRepository.findOne({
      where: { otp, user_id },
      // relations: ['organization'], // Ensure organization relation is loaded
    });

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid OTP or user not found.',
        // details: { otp },
      });
    }

    if (new Date() > user.otp_expiry) {
      throw new HttpException(
        {
          statusCode: 410,
          message: 'OTP has expired.',
          // details: { otp, expiryTime: user.otp_expiry },
        },
        HttpStatus.GONE,
      );
    }

    // Clear OTP and expiry after verification
    await this.userRepository.update(user.user_id, {
      otp: null,
      otp_expiry: null,
    });
    // Send onboarding email with plain-text password
    // await this.sendOnboardingEmail(user.business_email, randomPassword);
    return {
      statusCode: 200,
      message: 'OTP has been verified.',
    };
  }


  private async setSchema(schema: string) {
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to set schema: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Sends an email with the OTP for verification
   * @param email User's email
   * @param otp OTP to verify
   */
  private async organization_name(email: string, otp: string) {

    const transporter = nodemailer.createTransport({
      host: 'smtp.zeptomail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD_NORBIK,
      },
    });


    const mailOptions = {
      from: process.env.FROM_EMAIL, // Your sender email
      to: email,
      subject: 'OTP for Reset Password on Norbik Asset', // Subject of the email
      text: `Hi,
   
          ${otp} is your OTP to reset your credentials for the Norbik Asset.
         
          This OTP is valid for the next 15 minutes only. Do not share it with anyone.
         
          Thanks for trusting brand Norbik Asset!
         
          Norbik Asset Support Team.
         
          ---
         
          This is a system-generated email. Do not reply to this mail. If you have any queries, please write to support@norbik.com`,
    };

    try {
      // Send the email
      await transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully.');
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email.');
    }
  }


  private async authloginmail(email: string, otp: string, fullname: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zeptomail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD_NORBIK,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL, // Sender email from environment variable
      to: email, // Recipient email
      subject: 'OTP for Login on Norbik Asset portal', // Subject line
      text: `
        Hi ${fullname},
   
        ${otp} is your OTP to log in to your Norbik Asset.
   
        This OTP is valid for the next 15 minutes only. Do not share it with anyone.
   
        Thanks for trusting the Norbik Asset!
   
       Norbik Asset Support Team.
   
        This is a system-generated email. Please do not reply to this email. If you have any queries, write to support@norbik.in.
      `, // Email body content with dynamic user name and OTP
    };


    await transporter.sendMail(mailOptions);
  }


  async sendOtpForPasswordResetByUserId(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { user_id: Number(userId) },
      select: ['user_id', 'business_email', 'password'], // Ensure password is fetched
    });

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (!user.business_email) {
      throw new HttpException('No email associated with this user.', HttpStatus.BAD_REQUEST);
    }

    console.log("🔹 User found:", user);

    // Verify Old Password (Check if entered password matches stored hash)
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordCorrect) {
      throw new HttpException('Incorrect current password.', HttpStatus.BAD_REQUEST);
    }

    // Ensure New Password is Different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new HttpException('New password cannot be the same as the current password.', HttpStatus.BAD_REQUEST);
    }

    console.log("Old password verified. Sending OTP to:", user.business_email);

    //  Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    try {
      await this.userRepository.update(user.user_id, { otp, otp_expiry: otpExpiry });

      //  Send OTP via email
      await this.organization_name(user.business_email, otp);

      return {
        status: 200,
        message: 'OTP sent to registered email.',
        data: user.business_email,
      };
    } catch (error) {
      throw new HttpException('Failed to send OTP.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  async verifyResetPasswordOtp(
    verifyOtpDto: { otp: string; user_id: number; newPassword: string; currentPassword?: string },
    response: Response
  ): Promise<any> {
    const { otp, user_id, newPassword, currentPassword } = verifyOtpDto;

    console.log("Received Data:", { otp, user_id, newPassword, currentPassword });

    const user = await this.userRepository.findOne({ where: { user_id, otp } });

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Invalid OTP or user not found.",
      });
    }

    if (new Date() > user.otp_expiry) {
      throw new HttpException(
        { statusCode: 410, message: "OTP has expired." },
        HttpStatus.GONE
      );
    }

    console.log("OTP Verified. Validating Old Password...");

    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException({
          statusCode: 400,
          message: "Current password is incorrect.",
        });
      }
    }

    console.log("Old password validated. Updating Password...");

    const passwordUpdateResponse = await this.updatePassword(user_id, newPassword, response);

    await this.userRepository.update(user.user_id, { otp: null, otp_expiry: null });
    
     const fetchUser = await this.userRepository.findUserWithOrganizationSchema(user.business_email);
  const orgSchema = `org_${fetchUser.organization.organization_schema_name}`;
  await this.setSchema(orgSchema); // switch to tenant schema

  // ✅ Update password in org.users table
  await this.userRepository.query(
    `UPDATE ${orgSchema}.users
     SET password = $1, updated_at = NOW()
     WHERE register_user_login_id = $2`,
    [newPassword, user.user_id]
  );
 
    console.log("Password updated. Sending confirmation email...");

    // Send password updated email
    await this.sendPasswordUpdateEmail(user.business_email, user.first_name, user.last_name);

    return {
      statusCode: 200,
      message: "Password has been reset successfully. Confirmation email sent.",
      passwordUpdateResponse,
    };
  }


  async sendPasswordUpdateEmail(email: string, firstName: string, lastName: string): Promise<any> {
    try {
      await this.mailService.sendEmail(
        email,
        " Password Successfully Updated",
        await renderEmail(
          EmailTemplate.PASSWORD_UPDATED_SUCCESS, // Correct template name from your enum
          {
            name: `${firstName} ${lastName}`,

          },
          this.mailConfigService // Ensure database connection is passed
        )
      );

      console.log(`Password update confirmation email sent to ${email}`);

      return {
        status: 200,
        message: "Password update confirmation email sent successfully.",
      };
    } catch (error) {
      console.error(`Failed to send password update email to ${email}`, error);
      throw new HttpException("Failed to send password update email.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  // async setPassword(userId: string, newPassword: string): Promise<any> {
  //   const hashedPassword = await bcrypt.hash(newPassword, 10);

  //   const userUpdateResult = await this.userRepository.update(userId, {
  //     password: hashedPassword,
  //   });

  //   if (!userUpdateResult.affected) {
  //     throw new BadRequestException({
  //       statusCode: 400,
  //       message: "User not found or password update failed.",
  //     });
  //   }

  //   return { userId, message: "Password has been successfully updated." };
  // }
  async setPassword(userId: string, newPassword: string,): Promise<any> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userUpdateResult = await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    if (!userUpdateResult.affected) {
      throw new BadRequestException({
        statusCode: 400,
        message: "User not found or password update failed.",
      });
    }

    // Fetch user details for email
    const user = await this.userRepository.findOne({ where: { user_id: Number(userId) } });

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: "User not found after update.",
      });
    }

    // Send password set notification email
    try {
      await this.mailService.sendEmail(
        user.business_email,
        " Your Password Has Been Set Successfully",
        await renderEmail(
          EmailTemplate.PASSWORD_GENERATED_SUCCESS, // Ensure this is added in your EmailTemplate enum
          {
            name: `${user.first_name} ${user.last_name}`,
            newPassword,
          },
          this.mailConfigService
        )
      );

      console.log(`Password set notification email sent to ${user.business_email}`);
    } catch (error) {
      console.error(`Failed to send password set notification email to ${user.business_email}`, error);
      throw new HttpException("Failed to send password set notification email.", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { userId, message: "Password has been successfully updated and notification email sent." };
  }



  private setAuthCookies(
    response: Response,
    tokens: any,
    encryptedUserId: string,
    encryptedMainUserId: string,
    encryptedRoleId: string,
    encryptedSchemaName: string,
    encryptedOrganizationId: string,
    encryptedPermissions: string,
    sessionId: string,
  ) {
    // console.log("tokens.accessToken", tokens.accessToken);
    // console.log("tokens.refreshToken", tokens.refreshToken);
    // console.log("encryptedUserId", encryptedUserId);
    // console.log("encryptedMainUserId", encryptedMainUserId);
    // console.log("encryptedOrganizationId", encryptedOrganizationId);
    // console.log("encryptedPermissions", encryptedPermissions);

    const secure = process.env.NODE_ENV === 'production';

    // Correct cookie options
    const cookieOptions = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as 'lax', // type-safe
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/', // ensure accessible on all routes
    };

    // Set sensitive cookies (httpOnly)
    response.cookie('jwtToken', tokens.accessToken, cookieOptions);
    response.cookie('jwt_refresh_token', tokens.refreshToken, cookieOptions);
    response.cookie('system_user_id', encryptedUserId, cookieOptions);
    // response.cookie('session_id', sessionId, cookieOptions);
    response.cookie('x-organization-schema', encryptedSchemaName, cookieOptions);
    response.cookie('organization_id', encryptedOrganizationId, cookieOptions);

    // Non-httpOnly cookies for frontend JS
    const nonHttpOnlyOptions = { ...cookieOptions, httpOnly: false };

     // ✅ SessionId cookie (frontend-readable)
  response.cookie('session_id', sessionId, nonHttpOnlyOptions);

    response.cookie('role_id', encryptedRoleId, nonHttpOnlyOptions);
    response.cookie('permissions', encryptedPermissions, nonHttpOnlyOptions);
    response.cookie('main_user_id', encryptedMainUserId, nonHttpOnlyOptions);
  }

  


}