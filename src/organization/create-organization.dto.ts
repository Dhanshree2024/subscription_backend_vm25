import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  businessEmail: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}
