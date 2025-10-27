import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRolesPermissionController } from './organization_roles_permission.controller';

describe('OrganizationRolesPermissionController', () => {
  let controller: OrganizationRolesPermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationRolesPermissionController],
    }).compile();

    controller = module.get<OrganizationRolesPermissionController>(OrganizationRolesPermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
