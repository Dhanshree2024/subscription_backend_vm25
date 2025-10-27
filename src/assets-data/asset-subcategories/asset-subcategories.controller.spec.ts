import { Test, TestingModule } from '@nestjs/testing';
import { AssetSubcategoriesController } from './asset-subcategories.controller';
import { AssetSubcategoriesService } from './asset-subcategories.service';

describe('AssetSubcategoriesController', () => {
  let controller: AssetSubcategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetSubcategoriesController],
      providers: [AssetSubcategoriesService],
    }).compile();

    controller = module.get<AssetSubcategoriesController>(AssetSubcategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
