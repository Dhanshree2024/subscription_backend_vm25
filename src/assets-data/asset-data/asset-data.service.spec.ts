import { Test, TestingModule } from '@nestjs/testing';
import { AssetDataService } from './asset-data.service';

describe('AssetDataService', () => {
  let service: AssetDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetDataService],
    }).compile();

    service = module.get<AssetDataService>(AssetDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
