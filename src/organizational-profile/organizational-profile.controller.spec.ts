import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationalProfileController } from './organizational-profile.controller';

describe('OrganizationalProfileController', () => {
  let controller: OrganizationalProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationalProfileController],
    }).compile();

    controller = module.get<OrganizationalProfileController>(OrganizationalProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
