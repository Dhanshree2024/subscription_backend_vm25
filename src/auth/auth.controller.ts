import { Controller, Post, Body, ExecutionContext, HttpException, ParseIntPipe,Query,UseGuards, Res, Get, Req, UnauthorizedException, HttpStatus, UsePipes, ValidationPipe, GoneException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard'; // Import JwtAuthGuard
import { ApiKeyGuard } from './api-key.guard';
import { Response, Request } from 'express';
import { DataSource } from 'typeorm';  // Import DataSource
import { VerifyOtpDto } from '../organization_register/verify-otp.dto';
import { encrypt, decrypt } from '../common/encryption_decryption/crypto-utils'; // Import encryption utility
import { parse } from 'cookie';

 
// import { SchemaGuard } from '../dynamic-schema/dynamic-schema.guard';
 
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly dataSource: DataSource,
 
  ) { }
 
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))  
  async login(@Body() loginDto: LoginDto, @Res() response: Response,
  @Req() req: Request  
  ) {
    const result = await this.authService.validateUser(loginDto, response, req); // Pass response explicitly
    return response.status(result.status).json(result);
  }

  @Get('check-subscription')
async checkSubscription(@Query('orgId') orgId: number) {
  return this.authService.checkSubscriptionRestrictions(orgId);
}


  @Get('fetch-profile')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchUserLoginProfile(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const createdBy = req.cookies.system_user_id;
    if (!createdBy) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'user id and status id is required' },
        HttpStatus.BAD_REQUEST,
      );
    }
 
    try {
      const result = await this.authService.fetchUserLoginProfile(Number(decrypt(createdBy)));
      return res.status(200).json({
        result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
 
 
 
  }
 
  @Get('apikey')
  async getApiKey(@Res() res) {
    try {
      const apiKey = await this.authService.getApiKey();
 
      console.log(apiKey);
      if (!apiKey) {
        throw new Error('API key not found.');
      }
      return res.status(200).json({ apiKey });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
 
  @Post('reset-password')
  async updatePassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    const { userId, currentPassword, newPassword } = updatePasswordDto;
 
    try {
 
      const result = await this.authService.updatePassword(userId, newPassword, res, currentPassword);
      console.log(result);
      res.status(200).json(result);
 
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }

  @Post('reset-password-for-new-user')
  async updateNewPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    const { userId, currentPassword, newPassword } = updatePasswordDto;
 
    try {
 
      const result = await this.authService.updateNewPassword(userId, newPassword, res, currentPassword);
      console.log(result);
      res.status(200).json(result);
 
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }
  
  @Get('validate-reset-link')
  async validateResetLink(@Query('userId') userId: number) {
   
    console.log("userId received", userId)
   
    const isValid = await this.authService.validatePasswordResetLink(userId);
   
    console.log("isValid",isValid)
   
    return {valid:isValid};
  }
 
  @Post('check-session')
  checkSession(@Req() req: Request) {
    // Access the stored user_id from the session
    const userId = req.session.user_id;
    
    
    console.log("check-session", userId)
    
    console.log(userId);
    if (userId) {
      return { message: 'User is logged in', user_id: userId };
    }
    return { message: 'No active session' };
  }
 
  // @Post('logout')
  // @UseGuards(ApiKeyGuard)
  // async logout(@Res() res: Response, @Req() req: Request) {
  //   try {
  //     const cookiesToClear = [
  //       "jwtToken",
  //       "jwt_refresh_token",
  //       "x-organization-schema",
  //       "system_user_id",
  //       "organization_id",
  //       "main_user_id",
  //       "role_id",
  //       "profile_image",
  //     ];

  //     cookiesToClear.forEach((cookieName) => {
  //       res.clearCookie(cookieName, { httpOnly: true });
  //     });

  //     await this.dataSource.query("RESET search_path");

  //     if (req.session) {
  //       req.session.destroy((err) => {
  //         if (err) {
  //           console.error("Session destruction error:", err);
  //           throw new Error("Could not destroy session");
  //         }
  //       });
  //     }

  //     return res
  //       .status(HttpStatus.OK)
  //       .json({ message: "Logged out successfully" });
  //   } catch (error) {
  //     return res
  //       .status(HttpStatus.INTERNAL_SERVER_ERROR)
  //       .json({ message: "Logout failed", error: error.message });
  //   }
  // }
  
  
  @Post('logout')
  @UseGuards(ApiKeyGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.logout(req, res);
    return res.status(200).json(result);
  }
  
  
  @Post('logout-all')
  @UseGuards(JwtAuthGuard) // Only logged-in users can call this
  async logoutAll(@Req() req: Request, @Res() res: Response) {
    const cookies = parse(req.headers.cookie || '');
    const userIdEncrypted = cookies.system_user_id;

    if (!userIdEncrypted) {
      throw new UnauthorizedException('User ID missing in cookies');
    }

    const userId = Number(decrypt(userIdEncrypted));
    const result = await this.authService.logoutAllSessions(userId, res);
    return res.status(HttpStatus.OK).json(result);
  }
  
  
  // @Post('logout-all-by-id')
  // @UseGuards(JwtAuthGuard) // Only logged-in users can call this
  // async logoutAllById(@Body('userId') userId: number, @Res() res: Response) {
    
  //   console.log("userId", userId);
    
  //   if (!userId) {
  //     throw new BadRequestException('User ID is required in body');
  //   }

  //   const result = await this.authService.logoutAllSessionsByUserId(+userId);
  //   return res.status(HttpStatus.OK).json(result);
  // }
  

  @Post('verify-login-otp')
  // @UseGuards(ApiKeyGuard) // Apply JwtAuthGuard here
  async verifyLoginOtp(@Body() verifyOtpDto: VerifyOtpDto, context: ExecutionContext, @Req() req: Request, @Res() response: Response) {
 
    const result = await this.authService.verifyLoginOtp(verifyOtpDto, response, context);
 
    if (result.jwt_token) {
      // Store user_id in session
      // req.session.user_id = result.user_id; // Store user_id
      // console.log('Session Updated:', req.session.user_id);
    }
    response.status(200).json(result);
  }
 
 
  @Post('validate-token')
  @UseGuards(JwtAuthGuard) // Second-time token validation
  async validateToken() {
    return { message: 'Token is valid' };
  }
  
  // @Get('validate-reset-link')
  // async validateResetLink(@Query('userId') userId: number) {
  //   const isValid = await this.authService.validatePasswordResetLink(userId);

  //   if (!isValid) {
  //     throw new GoneException('This password reset link has expired or is invalid');
  //   }

  //   return { valid: true };
  // }
 
  
  
  // @Post('reset-password')
  // async updatePassword(
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Body() updatePasswordDto: UpdatePasswordDto
  // ) {
  //   const { userId, currentPassword, newPassword } = updatePasswordDto;

  //   try {

  //     const result = await this.authService.updatePassword(userId, newPassword, res, currentPassword);
  //     console.log(result);
  //     res.status(200).json(result);

  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       res.status(401).json({ message: error.message });
  //     } else {
  //       res.status(500).json({ message: error.message });
  //     }
  //   }
  // }
  
  
  
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
 
      const result = await this.authService.sendOtpForPasswordReset(forgotPasswordDto.email);
 
      return res.status(result.status).json(result);
 
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
 
  @Post('verify-forgotpassword-otp')
  // @UseGuards(ApiKeyGuard) // Apply JwtAuthGuard here
  async verifyForgotPasswordOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
    // return await this.authService.verifyForgotPasswordOtp(verifyOtpDto, context);
    try {
      const result = await this.authService.verifyForgotPasswordOtp(verifyOtpDto, res);
      res.status(HttpStatus.OK).json({ status: 200, message: 'OTP has been verified.' });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to verify OTP.' });
    }
 
  }
 
  //reset password
  @Post('send-otp-reset-password')
  async sendOtpForResetPassword(
    @Body() body: { userId: string, oldPassword: string, newPassword: string },
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.sendOtpForPasswordResetByUserId(body.userId, body.oldPassword, body.newPassword);
      return res.status(result.status).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
 
  @Post('verify-reset-password-otp')
  async verifyResetPasswordOtp(
    @Body() verifyOtpDto: { otp: string; user_id: number; newPassword: string },
    @Res() res: Response
  ): Promise<Response> {  // ✅ Change return type to Promise<Response>
    try {
      console.log("Received request to verify OTP:", verifyOtpDto);
 
      const result = await this.authService.verifyResetPasswordOtp(verifyOtpDto, res);
 
      console.log("Response from service:", result);
 
      return res.status(result.status || 200).json(result); // ✅ Correct return type
    } catch (error) {
      console.error("Error during OTP verification:", error);
 
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
 
  //generate password
  @Post('generate-password')
  async generatePassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() generatePasswordDto: { userId: string; newPassword: string }
  ) {
    const { userId, newPassword } = generatePasswordDto;
 
    try {
      const result = await this.authService.setPassword(userId, newPassword);
      res.status(200).json({ message: 'Password updated successfully', result });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  
 
}