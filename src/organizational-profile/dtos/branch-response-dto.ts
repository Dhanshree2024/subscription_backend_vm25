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

export class Address {
    @IsOptional()
    @IsString()
    street: string;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsOptional()
    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    state: string;

    @IsOptional()
    @IsNumber()
    postalCode: number;

    @IsOptional()
    @IsString()
    country: string;
}

export class BranchResponseDTO {
    @IsNumber()
    id: number;

    @IsString()
    branchName: string;

    @IsString()
    @IsOptional()
    contactNumber: string;

    @IsString()
    @IsOptional()
    alternateContactNumber?: string;

    @IsDateString()
    @IsOptional()
    establishedDate?: Date;

    @IsString()
    @IsOptional()
    gstNumber?: string;

    @IsString()
    @IsOptional()
    email: string;

    @Type(() => Address)
    @ValidateNested()
    address: Address;

    @IsBoolean()
    status: boolean;

    @IsDateString()
    createdAt: Date;

    @IsDateString()
    lastModified: Date;
}
