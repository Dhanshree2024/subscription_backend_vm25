import { Test, TestingModule } from '@nestjs/testing';
import { AssetDataController } from './asset-data.controller';
import { AssetDataService } from './asset-data.service';

describe('AssetDataController', () => {
  let controller: AssetDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetDataController],
      providers: [AssetDataService],
    }).compile();

    controller = module.get<AssetDataController>(AssetDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
