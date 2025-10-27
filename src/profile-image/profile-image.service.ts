import { CreateProfileImageDto } from './dto/create-profile-image.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { OrganizationalProfile } from 'src/organizational-profile/entity/organizational-profile.entity';
const DEFAULT_PROFILE_IMAGE = '/uploads/default-placeholder.png';
// import * as path from 'path';
// import * as fs from 'fs';
// import * as sharp from 'sharp';
@Injectable()
export class ProfileImageService {
  getUserImagePath(arg0: number) {
    throw new Error('Method not implemented.');
  }
  getOrgLogoPath(orgId: any) {
    throw new Error('Method not implemented.');
  }

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(OrganizationalProfile)
    private orgRepo: Repository<OrganizationalProfile>,
  ) {}

  // async processAndCompressImage(filePath: string): Promise<void> {
  // const fullPath = path.join(process.cwd(), filePath);
  // const buffer = fs.readFileSync(fullPath);
  // const compressed = await sharp(buffer)
  //   .resize(512, 512, { fit: 'inside' }) // Resize to max 512x512
  //   .jpeg({ quality: 80 })               // Compress as JPEG
  //   .toBuffer();
  // // Overwrite original file with compressed buffer
  //   fs.writeFileSync(fullPath, compressed);
  // }

  async saveUserImage(userId: number, imagePath: string) {
    
    // await this.processAndCompressImage(imagePath);
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    
    if (!user) throw new NotFoundException('User not found');
    
    user.profile_image = imagePath;
    await this.userRepository.save(user);
    return user;

  }

  async resetUserImage(userId: number) {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.profile_image = DEFAULT_PROFILE_IMAGE;
    await this.userRepository.save(user);
    return user;
  }

  async saveCompanyImage(orgId: number, imagePath: string) {
    // await this.processAndCompressImage(imagePath);
    const org = await this.orgRepo.findOne({
      where: { organization_profile_id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    org.org_profile_image_address = imagePath;
    await this.orgRepo.save(org);
    return org;
  }

  async resetCompanyImage(orgId: number) {
    const org = await this.orgRepo.findOne({
      where: { organization_profile_id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    org.org_profile_image_address = DEFAULT_PROFILE_IMAGE;
    await this.orgRepo.save(org);
    return org;
  }
}
