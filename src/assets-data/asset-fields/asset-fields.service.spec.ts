import { Test, TestingModule } from '@nestjs/testing';
import { AssetFieldsService } from './asset-fields.service';

describe('AssetFieldsService', () => {
  let service: AssetFieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetFieldsService],
    }).compile();

    service = module.get<AssetFieldsService>(AssetFieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
