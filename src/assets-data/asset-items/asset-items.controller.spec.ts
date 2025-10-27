import { Test, TestingModule } from '@nestjs/testing';
import { AssetItemsController } from './asset-items.controller';
import { AssetItemsService } from './asset-items.service';

describe('AssetItemsController', () => {
  let controller: AssetItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetItemsController],
      providers: [AssetItemsService],
    }).compile();

    controller = module.get<AssetItemsController>(AssetItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
