import { Test, TestingModule } from '@nestjs/testing';
import { AssetItemsFieldsMappingService } from './asset-items-fields-mapping.service';

describe('AssetItemsFieldsMappingService', () => {
  let service: AssetItemsFieldsMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetItemsFieldsMappingService],
    }).compile();

    service = module.get<AssetItemsFieldsMappingService>(AssetItemsFieldsMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
