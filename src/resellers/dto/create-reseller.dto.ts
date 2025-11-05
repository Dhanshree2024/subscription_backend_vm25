import { IsString, IsEmail, IsOptional, IsBoolean, MaxLength, IsInt } from 'class-validator';

export class CreateResellerDto {
  // 🏢 From frontend: company_name → maps to reseller_name
  @IsString()
  @MaxLength(150)
  reseller_name: string;

  // 👤 From frontend: first_name / last_name → maps to contact_first_name / contact_last_name
  @IsString()
  @MaxLength(100)
  contact_first_name: string;

  @IsString()
  @MaxLength(100)
  contact_last_name: string;

  // 📧 Email
  @IsEmail()
  @MaxLength(150)
  email: string;

  // ☎️ Phone (optional)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

    @IsOptional()
  @IsInt()
  industry_id?: number;

  // 💳 Payment Term
  @IsOptional()
  @IsString()
  @MaxLength(50)
  payment_term?: string;

  // 🧾 GST Info
  @IsOptional()
  @IsBoolean()
  gst_registered?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gst_number?: string;

  // ⚙️ Status
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean = false;
}
