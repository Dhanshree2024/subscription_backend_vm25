import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsIn,
  IsDateString,
  IsBooleanString,
} from 'class-validator';
import { Transform } from 'class-transformer';

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
  private _limit?: number = 10;
  public get limit(): number {
    return this._limit;
  }
  public set limit(value: number) {
    this._limit = value;
  }

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsString()
  @IsOptional()
  dateRange?: string;

  @IsOptional()
  filters?: Record<string, string>;

  @IsOptional()
  @IsString()
  addedDateStart?: string;

  @IsOptional()
  @IsString()
  addedDateEnd?: string;

  @IsOptional()
  @IsBooleanString()
  isPaginated?: string;
}
