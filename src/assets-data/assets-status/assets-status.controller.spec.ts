import { Test, TestingModule } from '@nestjs/testing';
import { AssetsStatusController } from './assets-status.controller';
import { AssetsStatusService } from './assets-status.service';

describe('AssetsStatusController', () => {
  let controller: AssetsStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsStatusController],
      providers: [AssetsStatusService],
    }).compile();

    controller = module.get<AssetsStatusController>(AssetsStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
