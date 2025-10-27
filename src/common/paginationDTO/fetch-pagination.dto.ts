import { IsInt, IsOptional, IsPositive, IsString, IsIn, IsDateString } from "class-validator";
import { Transform } from "class-transformer";

export class FetchPaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // Default sorting field

  @IsOptional()
  @IsIn(["ASC", "DESC", "asc", "desc"]) // Ensuring only valid values are used
  sortOrder?: "ASC" | "DESC" = "DESC"; // Default sorting order

  @IsString()
  @IsOptional()
  dateRange?: string; // ✅ Added this line

  @IsOptional()
  filters?: Record<string, string>; // ✅ This will automatically map filters[first_name]=s

  @IsOptional()
  @IsString()
  addedDateStart?: string; // New parameter for start date

  @IsOptional()
  @IsString()
  addedDateEnd?: string; // New parameter for end date
}
