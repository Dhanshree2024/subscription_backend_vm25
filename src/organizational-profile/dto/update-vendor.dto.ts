import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsNumber, isString } from 'class-validator';

export class UpdateVendorDto {

    @IsNumber()
    vendor_id: number;  // Role ID to be updated
   
    @IsString()
    vendor_name: string;
  
    @IsOptional()
    @IsString()
    vendor_gst_no: string;
  
    @IsPhoneNumber()
    vendor_contact_number: string;
  
    @IsPhoneNumber()
    vendor_alternative_contact_number: string;
  
    @IsEmail()
    vendor_email: string;

    @IsString()
    vendor_primary_contact: String;

  
    @IsString()
    vendor_street: string;
  
    @IsString()
    vendor_landmark: string;
  
    @IsString()
    vendor_country: string;
    
    @IsString()
    vendor_city: string;
    
    @IsString()
    vendor_state: string;
  
    @IsString()
    vendor_pincode: string;  

}