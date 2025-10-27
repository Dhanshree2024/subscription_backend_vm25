import { Test, TestingModule } from '@nestjs/testing';
import { AssetMappingService } from './asset-mapping.service';

describe('AssetMappingService', () => {
  let service: AssetMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetMappingService],
    }).compile();

    service = module.get<AssetMappingService>(AssetMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});