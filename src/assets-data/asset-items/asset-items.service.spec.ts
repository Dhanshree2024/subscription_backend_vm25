import { Test, TestingModule } from '@nestjs/testing';
import { AssetItemsService } from './asset-items.service';

describe('AssetItemsService', () => {
  let service: AssetItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetItemsService],
    }).compile();

    service = module.get<AssetItemsService>(AssetItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
