import { Test, TestingModule } from '@nestjs/testing';
import { AssetSubcategoriesService } from './asset-subcategories.service';

describe('AssetSubcategoriesService', () => {
  let service: AssetSubcategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetSubcategoriesService],
    }).compile();

    service = module.get<AssetSubcategoriesService>(AssetSubcategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
