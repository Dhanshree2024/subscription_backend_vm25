import { Test, TestingModule } from '@nestjs/testing';
import { AssetOwnershipStatusController } from './asset-ownership-status.controller';
import { AssetOwnershipStatusService } from './asset-ownership-status.service';

describe('AssetOwnershipStatusController', () => {
  let controller: AssetOwnershipStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetOwnershipStatusController],
      providers: [AssetOwnershipStatusService],
    }).compile();

    controller = module.get<AssetOwnershipStatusController>(AssetOwnershipStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
