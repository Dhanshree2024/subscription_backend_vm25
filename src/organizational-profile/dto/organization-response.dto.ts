import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsIn,
  IsDateString,
} from 'class-validator';

// result:=== OrganizationalProfile {
//   organization_profile_id: 1,
//   org_name: 'VK',
//   industry_type_id: 2,
//   organization_location_name: null,
//   organization_address: null,
//   email: null,
//   city: null,
//   pincode: null,
//   state: null,
//   country: null,
//   mobile_number: '',
//   org_alt_contact_number: null,
//   base_currency: null,
//   financial_year: null,
//   dateformat: 'dd/mm/yyyy',
//   time_zone: 'IST',
//   website_url: null,
//   street: null,
//   landmark: null,
//   gst_no: null,
//   esi_number: null,
//   lin_number: null,
//   pan_number: null,
//   tan_number: null,
//   pf_number: null,
//   report_basis: null,
//   established_date: '2025-07-02',
//   tenant_org_id: 133,
//   org_profile_image_address: null,
//   created_at: 2025-07-03T11:54:05.344Z,
//   updated_at: 2025-07-03T11:54:05.344Z,
//   users: [
//     User {
//       user_id: 1,
//       first_name: 'V',
//       last_name: ' K',
//       users_business_email: 'vaishnavi.kulkarni@spitsolutions.com',
//       phone_number: '9098990800',
//       password: '$2b$10$k/yfYhtDgAoCvU5xh44wmOJTLRlyPbsqmrluutvz0rqpWED2VTO.2',
//       organization_id: 133,
//       is_primary_user: 'Y',
//       middle_name: '',
//       user_alternative_contact_number: null,
//       date_of_birth: null,
//       blood_group: null,
//       gender: null,
//       street: null,
//       landmark: null,
//       city: null,
//       state: null,
//       zip: null,
//       country: null,
//       branch_id: 1,
//       created_by: null,
//       is_active: true,
//       is_deleted: false,
//       register_user_login_id: 143,
//       created_at: 2025-07-03T11:54:05.728Z,
//       updated_at: 2025-07-03T11:54:05.728Z,
//       role_id: 1,
//       department_id: 1,
//       designation_id: 4,
//       profile_image: null,
//       user_designation: [Designations]
//     }
//   ],
//   industry_type: IndustryTypes {
//     industryId: 2,
//     industryName: 'Manufacturing',
//     createdAt: 2025-01-10T07:33:16.665Z,
//     updatedAt: 2025-01-10T07:33:16.665Z,
//     isActive: true,
//     isDeleted: false
//   }
// }

class AddressDto {
  @IsString()
  @IsOptional()
  street: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  postalCode: number

  @IsString()
  @IsOptional()
  landmark: string;

  @IsString()
  @IsOptional()
  country: string;
}

export class OrganizationResponseDto {

  @IsNumber()
  @IsOptional()
  organization_profile_id: number;

  // IDs to keep from your original model
  @IsNumber()
  @IsOptional()
  user_id: number;

  @IsNumber()
  @IsOptional()
  industry_type_id: number;

  @IsNumber()
  @IsOptional()
  department_id: number;

  @IsNumber()
  @IsOptional()
  designation_id: number;

  @IsNumber()
  @IsOptional()
  role_id: number;

  @IsNumber()
  @IsOptional()
  organization_id: number;

  @IsString()
  @IsOptional()
  organizationName: string;

  @IsString()
  @IsOptional()
  contactNumber: string

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  hqAddress: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  hqAddressFields: AddressDto;

  @IsString()
  @IsOptional()
  industryType: string;

  @IsDateString()
  @IsOptional()
  establishedDate: string;

  @IsString()
  @IsOptional()
  website: string;

  @IsString()
  @IsOptional()
  financialYear: string;

  @IsString()
  @IsOptional()
  baseCurrency: string;

  @IsString()
  @IsOptional()
  dateFormat: string;

  @IsString()
  @IsOptional()
  timeZone: string;

  @IsString()
  @IsOptional()
  gstNumber: string;

  // Primary Contact
  @IsString()
  @IsOptional()
  primaryContactName: string;

  @IsEmail()
  @IsOptional()
  primaryContactEmail: string;

  @IsNumber()
  @IsOptional()
  primaryContactPhone: string

  @IsString()
  @IsOptional()
  primaryContactRole: string;

  // Billing Contact
  @IsString()
  @IsOptional()
  billingContactName: string;

  @IsEmail()
  @IsOptional()
  billingContactEmail: string;

  @IsNumber()
  @IsOptional()
  billingContactPhone: number;

  // @IsString()
  // @IsOptional()
  // billingContactRole: string;

  // Appearance
  @IsIn(['light', 'dark'])
  @IsOptional()
  themeMode: string;

  @IsString()
  @IsOptional()
  customThemeColor: string;

  @IsString()
  @IsOptional()
  logo: string;


  @IsString()
  @IsOptional()
  logoPreviewBase64:string
}

















