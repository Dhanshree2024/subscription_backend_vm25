import { IsNotEmpty, IsOptional, IsArray, IsNumber, IsString, IsDate } from 'class-validator';

export class CreateStockDto {
    
    @IsNotEmpty()
    asset_id: number;
    
    // @IsOptional()
    // stock_id: number;

    @IsOptional()
    @IsNumber()
    previous_available_quantity?: number;

    @IsNotEmpty()
    @IsNumber()
    total_available_quantity: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsNumber()
    vendor_id: number;

    @IsNumber()
    branch_id: number;

    @IsNotEmpty()
    @IsNumber()
    created_by: number;

    @IsOptional()
    @IsNumber()
    updated_by?: number;

    @IsOptional()
    @IsNumber()
    is_active?: number;

    @IsOptional()
    @IsNumber()
    is_deleted?: number;

    @IsNotEmpty()
    @IsNumber()
    asset_ownership_status: number;

    @IsOptional()
    @IsDate()
    warranty_start?: Date;
 
    @IsOptional()
    @IsDate()
    warranty_end?: Date;
 
    @IsOptional()
    @IsNumber()
    buy_price?: number;
 
    @IsOptional()
    @IsDate()
    purchase_date?: Date;
 
    @IsOptional()
    @IsString()
    invoice_no?: string;

    @IsOptional()
    @IsString()
    asset_item_id:number

    @IsOptional()
    licence?:any[] | null

   
    @IsArray()
    assetDetails: {
        serial_number: string;
        department_id: number , 
        asset_used_by: number ,
        asset_managed_by: number ,
        branch_id?: number;       
        asset_item_id:number,
        quantity?: number;   
        status_type_id: number, 

         // New fields
        system_code?: string | null,          // Optional system-generated code
        generated_serial_number?: string | null, // Optional generated serial
        license_key?: string | null,
        license_details?: string | null;          // Optional license key
        warranty_start?: string | null,       // Optional warranty dates
        warranty_end?: string | null
        

    }[];
  
}