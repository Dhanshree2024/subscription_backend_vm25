import { IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumber()
  organizationId: number;

  @IsNumber()
  planId: number;

  @IsString()
  billingCycle: string;

  @IsString()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  autoRenewal: boolean;

  @IsBoolean()
  isTrialPeriod: boolean;

  // @IsNumber()
  // paymentMethodId: number;
    @Type(() => Number)
  @IsNumber()
  paymentMethodId: number;

  @IsString()
  paymentTerm: string;

  @IsString()
  customerPO: string;

  @IsString()
  paymentStatus: 'pending' | 'completed' | 'failed';

  @IsString()
  @IsOptional()
  orderPlacedBy?: string;

    @IsNumber()
    @Type(() => Number)
    productId: number;

     @IsOptional()
  @IsString()
trialPeriodUnit?: 'days' | 'months' | 'years';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  trialPeriodCount?: number;

  @IsOptional()
  @IsString()
  trialStartDate?: string;

  @IsOptional()
  @IsString()
  trialExpiryDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  gracePeriod?: number;


@IsOptional()
@IsNumber()
@Type(() => Number)
percentage?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  grandTotal?: number;

  @IsOptional()
@IsNumber()
@Type(() => Number)
resellerId?: number;
      // ✅ Add featureOverrides array
    @IsOptional()
  featureOverrides?: {
    feature_id: number;
    plan_id: number;
    mapping_id?: number;
    override_value: string;
    default_value?: string;
    is_active?: boolean;
    is_deleted?: boolean;
  }[];
}
