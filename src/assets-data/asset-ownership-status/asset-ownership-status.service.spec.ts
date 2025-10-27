import { Test, TestingModule } from '@nestjs/testing';
import { AssetOwnershipStatusService } from './asset-ownership-status.service';

describe('AssetOwnershipStatusService', () => {
  let service: AssetOwnershipStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetOwnershipStatusService],
    }).compile();

    service = module.get<AssetOwnershipStatusService>(AssetOwnershipStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
