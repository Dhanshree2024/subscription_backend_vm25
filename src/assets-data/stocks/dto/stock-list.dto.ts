// src/stock/dto/stock-list.dto.ts
export class StockListDto {
    stock_id: number;
    asset_id: number;
    asset_title: string; // Asset Name
    ownership_status: string; // Ownership Status
    vendor_name: string; // Vendor Name
    previous_available_quantity: number; // Previous Available Quantity
    total_available_quantity: number; // Total Available Quantity
    quantity: number; // Total Available Quantity
    created_by_name: string; // Created By
}