import { Controller, Get } from '@nestjs/common';
import { AssetDepreciationService } from './asset-depreciation.service';

@Controller('asset-depreciation')
export class AssetDepreciationController {
  constructor(private readonly assetDepreciationService: AssetDepreciationService) {}

   @Get('dep-calculations')
  async getDepreciationData() {
    return this.assetDepreciationService.getDepreciationCalculations();
  }

  @Get('dep-calculations-view')
  async getDepreciationView() {
    return this.assetDepreciationService.getDepreciationView();
  }
}
