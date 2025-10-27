import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationalProfileService } from './organizational-profile.service';

describe('OrganizationalProfileService', () => {
  let service: OrganizationalProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationalProfileService],
    }).compile();

    service = module.get<OrganizationalProfileService>(OrganizationalProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
