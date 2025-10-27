import { Test, TestingModule } from '@nestjs/testing';
import { AssetDepreciationService } from './asset-depreciation.service';

describe('AssetDepreciationService', () => {
  let service: AssetDepreciationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetDepreciationService],
    }).compile();

    service = module.get<AssetDepreciationService>(AssetDepreciationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
