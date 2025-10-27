import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRolesPermissionService } from './organization_roles_permission.service';

describe('OrganizationRolesPermissionService', () => {
  let service: OrganizationRolesPermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationRolesPermissionService],
    }).compile();

    service = module.get<OrganizationRolesPermissionService>(OrganizationRolesPermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
