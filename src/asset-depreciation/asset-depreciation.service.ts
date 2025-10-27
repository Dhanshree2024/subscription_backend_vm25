import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetStockSerialsRepository } from 'src/assets-data/stocks/entities/asset_stock_serials.entity';
import dayjs from 'dayjs';
import { AssetDepreciationViewEntity } from './entities/asset-depreciation-view.entity';

// Format: 2021-2022
function getYearRange(startDate: Date, offset: number): string {
  const start = dayjs(startDate).add(offset, 'year');
  const startYear = start.year();
  const endYear = start.add(1, 'year').year();
  return `${startYear}-${endYear}`;
}

type DepScheduleRow = {
  year: string; // string instead of number
  depreciation: number;
  remainingValue: number;
};

function calculateSLM(
  buyPrice: number,
  residualValue: number,
  totalYears: number,
  startDate: Date
): DepScheduleRow[] {
  
  const totalDep = buyPrice - residualValue;
  const yearlyDep = parseFloat((totalDep / totalYears).toFixed(2));

  let remaining = buyPrice;
  const schedule: DepScheduleRow[] = [];

  for (let i = 0; i < totalYears; i++) {
    remaining -= yearlyDep;
    schedule.push({
      year: getYearRange(startDate, i),
      depreciation: yearlyDep,
      remainingValue: parseFloat(remaining.toFixed(2)),
    });
  }

  return schedule;
}

function calculateWDV(
  buyPrice: number,
  rate: number,
  totalYears: number,
  startDate: Date
): DepScheduleRow[] {
  let remaining = buyPrice;
  const schedule: DepScheduleRow[] = [];

  for (let i = 0; i < totalYears; i++) {
    const depreciation = parseFloat((remaining * (rate / 100)).toFixed(2));
    remaining -= depreciation;
    schedule.push({
      year: getYearRange(startDate, i),
      depreciation,
      remainingValue: parseFloat(remaining.toFixed(2)),
    });
  }

  return schedule;
}

@Injectable()
export class AssetDepreciationService {
  constructor(
    @InjectRepository(AssetStockSerialsRepository)
    private readonly serialRepo: Repository<AssetStockSerialsRepository>,

    
    @InjectRepository(AssetDepreciationViewEntity)
    private readonly depreciationViewRepo: Repository<AssetDepreciationViewEntity>
  ) {}

  

 async getDepreciationCalculations() {
  const serials = await this.serialRepo
    .createQueryBuilder('serial')
    .leftJoin('serial.asset_item', 'item')
    .leftJoin('serial.asset_data', 'data')
    .leftJoin('data.main_category', 'main_category')
    .leftJoin('data.sub_category', 'sub_category')
    .where('item.has_depreciation = :hasDep', { hasDep: true })
    .select([
      'serial.asset_stocks_unique_id',
      'serial.system_code',
      'serial.buy_price',
      'serial.depreciation_start_date',
      'serial.depreciation_end_date',

      'item.asset_item_name',
      'item.company_depreciation_rate',
      'item.it_act_depreciation_rate',
      'item.company_act_residual_value',
      'item.it_act_residual_value',

      'data.manufacturer',
      'data.asset_title',
      'main_category.main_category_name',
      'sub_category.sub_category_name',
    ])
    .getRawMany();

  console.log('SERIALS FOR DEP', serials);

  return serials.map((row) => {
    const buyPrice = Number(row.serial_buy_price);
    const startDate = row.serial_depreciation_start_date;
    const endDate = row.serial_depreciation_end_date;
    const years = dayjs(endDate).diff(dayjs(startDate), 'year');

    return {
      asset_stocks_unique_id: row.serial_asset_stocks_unique_id,
      system_code: row.serial_system_code,
      purchase_value: buyPrice,
      depreciation_start_date: startDate,
      depreciation_end_date: endDate,
      asset_item_name: row.item_asset_item_name,
      manufacturer: row.data_manufacturer,
      asset_title: row.data_asset_title,
      main_category_name: row.main_category_main_category_name,
      sub_category_name: row.sub_category_sub_category_name,

      depreciation: {
        company: {
          slm: calculateSLM(
            buyPrice,
            row.item_company_act_residual_value,
            years,
            startDate
          ),
          wdv: calculateWDV(
            buyPrice,
            row.item_company_depreciation_rate,
            years,
            startDate
          ),
        },
        it_act: {
          slm: calculateSLM(
            buyPrice,
            row.item_it_act_residual_value,
            years,
            startDate
          ),
          wdv: calculateWDV(
            buyPrice,
            row.item_it_act_depreciation_rate,
            years,
            startDate
          ),
        },
      },
    };
  });
}

async getDepreciationView() {
  const raw = await this.depreciationViewRepo.find();

  const result = {};

  for (const row of raw) {
    const code = row.system_code;
    const year = row.depreciation_year_range;

    if (!result[code]) {
      result[code] = {
        system_code: code,
        asset_item_name: row.asset_item_name,
        buy_price: row.buy_price,
        depreciation_start_date: row.depreciation_start_date,
        depreciation_end_date: row.depreciation_end_date,
        manufacturer: row.manufacturer,
        asset_title: row.asset_title,
        main_category_name: row.main_category_name,
        sub_category_name: row.sub_category_name,
        company_depreciation_rate: row.company_depreciation_rate,
        it_act_depreciation_rate: row.it_act_depreciation_rate,
        company_act_residual_value: row.company_act_residual_value,
        it_act_residual_value: row.it_act_residual_value,
      };
    }

    result[code][year] = {
      slm_company_depreciation: row.slm_company_depreciation,
      slm_it_depreciation: row.slm_it_depreciation,
      wdv_company_depreciation: row.wdv_company_depreciation,
      wdv_it_depreciation: row.wdv_it_depreciation,
      slm_company_remaining_value: row.slm_company_remaining_value,
      slm_it_remaining_value: row.slm_it_remaining_value,
      wdv_company_remaining_value: row.wdv_company_remaining_value,
      wdv_it_remaining_value: row.wdv_it_remaining_value,
    };
  }

  return Object.values(result);
}




}
