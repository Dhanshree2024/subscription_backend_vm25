import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'asset_depreciation_view_test',
 
})
export class AssetDepreciationViewEntity {
  @ViewColumn()
  asset_stocks_unique_id: number;

  @ViewColumn()
  system_code: string;

  @ViewColumn()
  buy_price: number;

  @ViewColumn()
  depreciation_start_date: Date;

  @ViewColumn()
  depreciation_end_date: Date;

  @ViewColumn()
  asset_item_name: string;

  @ViewColumn()
  company_depreciation_rate: number;

  @ViewColumn()
  it_act_depreciation_rate: number;

  @ViewColumn()
  company_act_residual_value: number;

  @ViewColumn()
  it_act_residual_value: number;

  @ViewColumn()
  manufacturer: string;

  @ViewColumn()
  asset_title: string;

  @ViewColumn()
  main_category_name: string;

  @ViewColumn()
  sub_category_name: string;

  @ViewColumn()
  depreciation_year_range: string; // Example: "2024-25"

  @ViewColumn()
  slm_company_depreciation: number;

  @ViewColumn()
  slm_it_depreciation: number;

  @ViewColumn()
  wdv_company_depreciation: number;

  @ViewColumn()
  wdv_it_depreciation: number;

  @ViewColumn()
  slm_company_remaining_value: number;

  @ViewColumn()
  slm_it_remaining_value: number;

  @ViewColumn()
  wdv_company_remaining_value: number;

  @ViewColumn()
  wdv_it_remaining_value: number;
}
