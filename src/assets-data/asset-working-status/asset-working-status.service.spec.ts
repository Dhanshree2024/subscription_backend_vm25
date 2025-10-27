import { Test, TestingModule } from '@nestjs/testing';
import { AssetWorkingStatusService } from './asset-working-status.service';

describe('AssetWorkingStatusService', () => {
  let service: AssetWorkingStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetWorkingStatusService],
    }).compile();

    service = module.get<AssetWorkingStatusService>(AssetWorkingStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
