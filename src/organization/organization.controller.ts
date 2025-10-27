import { Controller, Post, Body, UseGuards, ExecutionContext } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './create-organization.dto';
import { VerifyOtpDto } from './verify-otp.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AuthService } from '../auth/auth.service';
import { ResendOtpDto } from './dto/resend-otp.dto';  // Assuming you create a DTO for the request


@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('create')
  // @UseGuards(ApiKeyGuard)
  async createOrganization(@Body() createOrganizationDto: CreateOrganizationDto, context: ExecutionContext) {
    return await this.organizationService.createOrganization(createOrganizationDto, context);
  }
  
  @Post('verify-otp')
  // @UseGuards(ApiKeyGuard) // Apply JwtAuthGuard here
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, context: ExecutionContext) {
    return await this.organizationService.verifyOtp(verifyOtpDto, context);
  }

  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto, context: ExecutionContext) {
    return await this.organizationService.resendOtp(resendOtpDto, context);
  }

}
