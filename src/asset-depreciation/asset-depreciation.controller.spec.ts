import { Test, TestingModule } from '@nestjs/testing';
import { AssetDepreciationController } from './asset-depreciation.controller';
import { AssetDepreciationService } from './asset-depreciation.service';

describe('AssetDepreciationController', () => {
  let controller: AssetDepreciationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetDepreciationController],
      providers: [AssetDepreciationService],
    }).compile();

    controller = module.get<AssetDepreciationController>(AssetDepreciationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
