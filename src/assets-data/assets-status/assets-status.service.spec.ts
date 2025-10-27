import { Test, TestingModule } from '@nestjs/testing';
import { AssetsStatusService } from './assets-status.service';

describe('AssetsStatusService', () => {
  let service: AssetsStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsStatusService],
    }).compile();

    service = module.get<AssetsStatusService>(AssetsStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
