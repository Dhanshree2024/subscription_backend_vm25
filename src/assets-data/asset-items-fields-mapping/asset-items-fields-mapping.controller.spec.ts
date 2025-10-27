import { Test, TestingModule } from '@nestjs/testing';
import { AssetItemsFieldsMappingController } from './asset-items-fields-mapping.controller';
import { AssetItemsFieldsMappingService } from './asset-items-fields-mapping.service';

describe('AssetItemsFieldsMappingController', () => {
  let controller: AssetItemsFieldsMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetItemsFieldsMappingController],
      providers: [AssetItemsFieldsMappingService],
    }).compile();

    controller = module.get<AssetItemsFieldsMappingController>(AssetItemsFieldsMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
