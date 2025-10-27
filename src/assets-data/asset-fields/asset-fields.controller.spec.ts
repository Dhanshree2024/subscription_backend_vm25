import { Test, TestingModule } from '@nestjs/testing';
import { AssetFieldsController } from './asset-fields.controller';
import { AssetFieldsService } from './asset-fields.service';

describe('AssetFieldsController', () => {
  let controller: AssetFieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetFieldsController],
      providers: [AssetFieldsService],
    }).compile();

    controller = module.get<AssetFieldsController>(AssetFieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
