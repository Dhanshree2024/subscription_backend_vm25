import { Test, TestingModule } from '@nestjs/testing';
import { AssetMappingController } from './asset-mapping.controller';
import { AssetMappingService } from './asset-mapping.service';

describe('AssetMappingController', () => {
  let controller: AssetMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetMappingController],
      providers: [AssetMappingService],
    }).compile();

    controller = module.get<AssetMappingController>(AssetMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});