// dto/create-payment.dto.ts
import { IsString, IsOptional, IsNumber, IsNotEmpty, IsObject } from 'class-validator';

export class BillingInfoDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @IsOptional()
  @IsString()
  address_line2?: string;
}

export class PaymentTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  card_last4?: string;

  @IsOptional()
  @IsString()
  card_expiry?: string; // format MM/YYYY

  @IsOptional()
  @IsString()
  card_holder_name?: string;

  @IsOptional()
  @IsString()
  transaction_reference?: string;
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  subscriptionId: number; // link to OrgSubscription

  @IsObject()
  @IsNotEmpty()
  billingData: BillingInfoDto;

  @IsObject()
  @IsNotEmpty()
  transactionData: PaymentTransactionDto;
}
