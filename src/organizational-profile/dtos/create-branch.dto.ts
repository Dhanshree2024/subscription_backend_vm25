import { Type } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsNumber,
    IsBoolean,
    IsEmail,
    IsObject,
    IsDateString,
    ValidateNested,
} from 'class-validator';


export class createBranchDTO {

    @IsString()
    branch_name: string;

    @IsNumber()
    gstNo: string;

    @IsString()
    city: string;

    @IsString()
    country: string;

    @IsString()
    state: string;

    @IsString()
    branch_street: string;

    @IsString()
    branch_landmark: string;

    @IsNumber()
    pincode: number;

    @IsNumber()
    contact_number: string;

    @IsNumber()
    alternative_contact_number: string;

    @IsString()
    branch_email: string;

}