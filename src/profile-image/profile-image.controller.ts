import {Controller, Get, UploadedFile, UseInterceptors,Post,Body,Patch,Param,Delete, BadRequestException, UseGuards, Req,} from '@nestjs/common';
import { ProfileImageService } from './profile-image.service';
import { CreateProfileImageDto } from './dto/create-profile-image.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { generateSimpleStorage, imageFileFilter } from './upload.config';
import { ApiKeyGuard } from 'src/auth/api-key.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { decrypt } from 'src/common/encryption_decryption/crypto-utils';

@Controller('profile-image')

export class ProfileImageController {
  constructor(private readonly profileImageService: ProfileImageService) {}
  


  @Post('user-profile-upload')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: generateSimpleStorage('user'),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadUserProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any
  ) {



    // const system_user_id = req.cookies.system_user_id;
    // const user_id = decrypt(system_user_id);

    // console.log("system_user_id", system_user_id);
    // console.log('user_id', user_id);
    
    if (!file) throw new BadRequestException('No file uploaded');
    const userId = +body.userId;
    if (!userId) throw new BadRequestException('Missing userId');
    const user = await this.profileImageService.saveUserImage(userId, file.path);
    return {
      message: 'User profile uploaded successfully',
      path: file.path,
      user,
    };
  }


  @Patch('user-profile-reset')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async resetUserProfile(@Body() body: any) {
    const userId = +body.userId;
    if (!userId) throw new BadRequestException('Missing userId');
    const user = await this.profileImageService.resetUserImage(userId);
    return {
      message: 'User profile image reset to default',
      user,
    };
  }


@Post('company-logo-upload')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
@UseInterceptors(
  FileInterceptor('file', {
    storage: generateSimpleStorage('company'),
    fileFilter: imageFileFilter,
  }),
)
async uploadCompanyLogo(
  @UploadedFile() file: Express.Multer.File,
  @Req() req,
) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  // Step 1: Get org ID from cookie and decrypt
  let organizationID: number;

  // try {
  //   // const encryptedOrgId = req.cookies?.organization_id;
  //   // if (!encryptedOrgId) {
  //   //   console.warn('organization_id cookie not found, using fallback');
  //   //   organizationID = 1; // fallback
  //   // } else {
  //   //   organizationID = Number(decrypt(encryptedOrgId));
  //   //   if (isNaN(organizationID)) throw new Error('Invalid org ID');
  //   // }
  // } catch (error) {
  //   console.warn('Decryption failed or invalid org ID, using fallback');
  //    organizationID = 1;// fallback to 1
  // }

  organizationID = 1;

  // Step 2: Save logo
  const org = await this.profileImageService.saveCompanyImage(+organizationID, file.path);

  return {
    message: 'Company logo uploaded successfully',
    path: file.path,
    org,
  };
}

  @Patch('company-logo-reset')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async resetCompanyLogo(@Body() body: any) {
    const orgId = +body.orgId;
    if (!orgId) throw new BadRequestException('Missing orgId');
    const org = await this.profileImageService.resetCompanyImage(orgId);
    return {
      message: 'Company logo reset to default',
      org,
    };
  }


















  //  @Post('user-profile')
  //  @UseInterceptors(FileInterceptor('file', {
  //   storage: generateSimpleStorage('user'),
  //   fileFilter: imageFileFilter,
  // }))
  // uploadUserProfile(@UploadedFile() file: Express.Multer.File, @Body() body){
  //   if (!file) throw new BadRequestException('No file uploaded');
  //   return {
  //     message: 'User profile uploaded successfully',
  //     filePath: file.path,
  //     filename: file.filename,
  //   };

  // }

  // @Post('company-logo')
  // @UseInterceptors( FileInterceptor('file', {
  //     storage: generateSimpleStorage('company'),
  //     fileFilter: imageFileFilter,
  //   }),
  // )
  // uploadCompanyLogo(@UploadedFile() file: Express.Multer.File, @Body() body) {
  //   if (!file) throw new BadRequestException('No file uploaded');
  //   return {
  //     message: 'Company logo uploaded successfully',
  //     filePath: file.path,
  //     filename: file.filename,
  //   };
  // }


















  
}
