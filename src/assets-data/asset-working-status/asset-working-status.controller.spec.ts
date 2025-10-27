import { Test, TestingModule } from '@nestjs/testing';
import { AssetWorkingStatusController } from './asset-working-status.controller';
import { AssetWorkingStatusService } from './asset-working-status.service';

describe('AssetWorkingStatusController', () => {
  let controller: AssetWorkingStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetWorkingStatusController],
      providers: [AssetWorkingStatusService],
    }).compile();

    controller = module.get<AssetWorkingStatusController>(AssetWorkingStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
