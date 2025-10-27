import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateOrganizationDto } from './create-organization.dto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { VerifyOtpDto } from './verify-otp.dto';
import { RegisterOrganization } from './entities/register-organization.entity';
import { RegisterUserLogin } from './entities/register-user-login.entity';
import { exit } from 'process';
import { ResendOtpDto } from './dto/resend-otp.dto';  // Assuming you create a DTO for the request
import {UserScript } from './onboarding_sql_scripts/users'
import { OrganizationProfileScript } from './onboarding_sql_scripts/organization_profile';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

  /**
   * Create a new organization and its associated schema
   * @param createOrganizationDto Data transfer object for organization creation
   */
  async createOrganization(createOrganizationDto: CreateOrganizationDto, context: any): Promise<any> {
    const { companyName, firstName, lastName, businessEmail, phoneNumber } = createOrganizationDto;

    // Validation: Ensure all required fields are provided
    if (!companyName || !firstName || !lastName || !businessEmail || !phoneNumber) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed: Missing required fields.',
      });
    }

    // Validation: Check if email has a valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid email format.',
      });
    }

    const checkCompanyQuery = `
      SELECT organization_id 
      FROM public.register_organization 
      WHERE organization_name = $1;
    `;
    const companyResult = await this.dataSource.query(checkCompanyQuery, [
      createOrganizationDto.companyName,
    ]);

    if (companyResult.length > 0) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Company name already exists. Please try logging in.',
      });
    }

          // Check if the business email already exists
          const checkEmailQuery = `
          SELECT user_id 
          FROM public.register_user_login 
          WHERE business_email = $1;
        `;
        const emailResult = await this.dataSource.query(checkEmailQuery, [
          createOrganizationDto.businessEmail,
        ]);
    
        if (emailResult.length > 0) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'Email already exists. Please try logging in.',
          });
      }

    const schemaName = companyName.toLowerCase().replace(/\s+/g, '_');

    try {
      // Check if the organization already exists
      const existingOrg = await this.dataSource
        .getRepository(RegisterOrganization)
        .findOne({
          where: { organization_name: companyName },
          relations: ['users'], // Load associated users
        });

      let userId = null;

      if (existingOrg) {
        // Check if any user in the organization is verified
        const hasVerifiedUser = existingOrg.users.some((user) => user.verified);

        if (hasVerifiedUser) {
          // Organization has a verified user
          return {
            statusCode: 409,
            message: 'Company name already exists.',
          };
        } else {
          // Organization exists but no verified user, insert or update user details
          const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiry = new Date(new Date().getTime() + 15 * 60 * 1000); // 15 minutes expiry

          // Update the first unverified user or create a new one
          let userToUpdate = existingOrg.users.find((user) => !user.verified);
          if (userToUpdate) {
            // Update the unverified user details
            userToUpdate.first_name = firstName;
            userToUpdate.last_name = lastName;
            userToUpdate.phone_number = phoneNumber;
            userToUpdate.business_email = businessEmail;
            userToUpdate.otp = newOtp;
            userToUpdate.otp_expiry = otpExpiry;

            const updatedUser = await this.dataSource.getRepository(RegisterUserLogin).save(userToUpdate);
            userId = updatedUser.user_id; // Capture the user ID

          } else {
            // Create a new unverified user
            const newUser = this.dataSource.getRepository(RegisterUserLogin).create({
              organization: existingOrg,
              first_name: firstName,
              last_name: lastName,
              business_email: businessEmail,
              phone_number: phoneNumber,
              otp: newOtp,
              otp_expiry: otpExpiry,
              verified: false,
            });
            const savedUser = await this.dataSource.getRepository(RegisterUserLogin).save(newUser);
            userId = savedUser.user_id; // Capture the user ID
          }

          // Send OTP email
          await this.sendVerificationEmail(businessEmail, newOtp);

          return {
            statusCode: 201,
            message: 'Organization created successfully. Verify the OTP sent to the email.',
            data: {
              userId,
            },
          };
        }
      }

      const organization = this.dataSource.getRepository(RegisterOrganization).create({
        organization_name: companyName,
        organization_schema_name: schemaName,
      });

      const savedOrg = await this.dataSource.getRepository(RegisterOrganization).save(organization);

      // Generate OTP and hashed password
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await this.hashPassword(randomPassword);

      // Create the user entity
      const user = this.dataSource.getRepository(RegisterUserLogin).create({
        organization: savedOrg,
        first_name: firstName,
        last_name: lastName,
        business_email: businessEmail,
        phone_number: phoneNumber,
        password: hashedPassword,
        otp,
        otp_expiry: otpExpiry,
        is_primary_user: 'Y', // Set as primary user for the first user

      });

      const savedUser = await this.dataSource.getRepository(RegisterUserLogin).save(user);
      userId = savedUser.user_id; // Capture the user ID
      // Send OTP to the provided email
      await this.sendVerificationEmail(businessEmail, otp);

      // Return a successful response
      return {
        statusCode: 201,
        message: 'Organization created successfully. Verify the OTP sent to the email.',
        data: {
          schema: schemaName,
          adminPassword: randomPassword,
          userId, 
        },
      };
    } catch (error) {
      console.error('Error creating organization:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: 500,
          message: 'Internal server error.',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resendOtp(resendOtpDto: ResendOtpDto, context: any): Promise<any> {
    const { userId } = resendOtpDto;

    // Validate if the user exists
    const userRepo = this.dataSource.getRepository(RegisterUserLogin);
    const user = await userRepo.findOne({
      where: { user_id: userId, verified: false },
    });

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'User not found or already verified.',
      });
    }

    // Generate a new OTP and set the expiry time
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);  // OTP expires in 15 minutes

    // Update the user with the new OTP and expiry
    user.otp = newOtp;
    user.otp_expiry = otpExpiry;

    // Save the updated user data
    await userRepo.save(user);

    // Send the new OTP to the user's email
    await this.sendVerificationEmail(user.business_email, newOtp);

    return {
      statusCode: 201,
      message: 'New OTP sent successfully.',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, context: any): Promise<any> {
    const { otp } = verifyOtpDto;

    // Validate OTP with the database entity
    const userRepo = this.dataSource.getRepository(RegisterUserLogin);
    const user = await userRepo.findOne({
      where: { otp, verified: false },
      relations: ['organization'], // Ensure organization relation is loaded
    });

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid OTP or user not found.',
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

    // Hash the password
    const hashedPassword = await this.hashPassword(randomPassword);

    // Update user entity to mark as verified and update the password
    user.verified = true;
    user.otp = null; // Clear OTP
    user.otp_expiry = null;
    user.password = hashedPassword;

    await userRepo.save(user);

    // Create schema for the organization
    const schemaName = `org_${user.organization.organization_schema_name}`;
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    const script = new UserScript(this.dataSource);
    script.createUserTable(schemaName);
    const hashedPassword1 =  await script.insertUserTable(schemaName,user);

    const script1 = new OrganizationProfileScript(this.dataSource);
    script1.createOrganizationProfileTable(schemaName);
    script1.insertOrganizationProfileTable(schemaName,user);
    console.log("password rr:",hashedPassword1);

    // Send onboarding email with plain-text password
    await this.sendOnboardingEmail(user.business_email,hashedPassword1);

    return {
      statusCode: 200,
      message: 'OTP verified successfully. Login details have been sent to your email, and your payment request has been submitted.',
      // 'OTP verified, password updated, schema created, and onboarding email sent.',
    };
  }


  // Helper Method: Generate Random Password
  private generateRandomPassword(length = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    return password;
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

  private async sendOnboardingEmail(email: string, password: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log("password rr:",password);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome and Thank You for Onboarding',
      text: `
          Welcome to our platform!
  
          Your account has been successfully created. 
          Here are your login details:
  
          Email: ${email}
          Password: ${password}
  
          Please use these credentials to log in.
  
          If you have any questions, feel free to contact us.
        `,
    };

    await transporter.sendMail(mailOptions);
  }


}
