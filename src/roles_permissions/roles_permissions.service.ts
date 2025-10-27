import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRolesPermissionDto } from './dto/create-roles_permission.dto';
import { UpdateRolesPermissionDto } from './dto/update-roles_permission.dto';
import { ILike, Like, Repository, DataSource } from 'typeorm';
import { DatabaseService } from 'src/dynamic-schema/database.service';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RolesPermission } from './entities/roles_permission.entity';
import { DeleteRoleDto } from './dto/delete-roles_permission.dto';
import { PermissionsRoles } from './entities/permissions.entity';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { permission } from 'process';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class RolesPermissionsService {



  constructor(

    @InjectRepository(RolesPermission)
    private rolesPermissionRepository: Repository<RolesPermission>,

    @InjectRepository(PermissionsRoles)
    private permissionRepository: Repository<PermissionsRoles>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,


    // @InjectRepository(UserRepository)
    // private readonly userRepository: Repository<UserRepository>,

    private readonly dataSource: DataSource,
    private readonly databaseService: DatabaseService,
    private userRepository: UserRepository

  ) { }
  create(createRolesPermissionDto: CreateRolesPermissionDto) {
    return 'This action adds a new rolesPermission';
  }

  async findAll(page: number, limit: number, searchQuery: string) {
    try {
      let whereCondition: any = { is_active: true, is_deleted: false };

      if (searchQuery && searchQuery.trim() !== '') {
        whereCondition['role_name'] = ILike(`%${searchQuery}%`);
      }

      // Fetch base roles with permissions
      const [results, total] = await this.rolesPermissionRepository
        .createQueryBuilder('organization_roles')
        .leftJoinAndSelect('organization_roles.createdBy', 'createdBy')
        .leftJoinAndSelect('organization_roles.permissions', 'permissions')
        .where(whereCondition)
        .orderBy('organization_roles.role_name', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Transform and enrich roles
      const rolesWithCounts = await Promise.all(
        results.map(async (role) => {
          // Count users with this role
          const userCount = await this.userRepo.count({
            where: { role_id: role.role_id, is_active: 1, is_deleted: 0 },
          });

          // Flatten permissions (remove nested children)
          const flatPermissions = [];
          let permissionCount = 0;

          role.permissions.forEach((permEntity) => {
            if (Array.isArray(permEntity.permissions)) {
              permEntity.permissions.forEach((module) => {
                if (module.children && Array.isArray(module.children)) {
                  module.children.forEach((child) => {
                    flatPermissions.push({
                      moduleName: module.moduleName,
                      ...child,
                    });

                    // Count if at least one permission flag is true
                    const hasPermission = Object.entries(child).some(
                      ([key, value]) =>
                        ['edit', 'view', 'create', 'delete', 'export', 'fullaccess'].includes(key) &&
                        value === true
                    );
                    if (hasPermission) permissionCount++;
                  });
                } else {
                  flatPermissions.push({
                    moduleName: module.moduleName,
                    ...module,
                  });

                  const hasPermission = Object.entries(module).some(
                    ([key, value]) =>
                      ['edit', 'view', 'create', 'delete', 'export', 'fullaccess'].includes(key) &&
                      value === true
                  );
                  if (hasPermission) permissionCount++;
                }
              });
            }
          });

          return {
            ...role,
            permissions: flatPermissions,
            userCount,
            permissionCount,
          };
        })
      );

      return {
        data: rolesWithCounts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('An error occurred while fetching roles.');
    }
  }


  async getAllRoles() {
    try {
      const roles = await this.rolesPermissionRepository
        .createQueryBuilder('organization_roles')
        .leftJoinAndSelect('organization_roles.createdBy', 'createdBy')
        .leftJoinAndSelect('organization_roles.permissions', 'permissions')
        .where({
          is_active: true,
          is_deleted: false
        })
        .orderBy('organization_roles.role_name', 'ASC')
        .getMany();

      return roles;

    } catch (error) {
      console.error('Error in getAllRoles:', error);
      throw new Error('An error occurred while fetching all roles.');
    }
  }
  async fetchSingleRoleWithPermissions(deleteRoleDto: DeleteRoleDto) {
    const { role_id } = deleteRoleDto;

    // Validate if role_id is provided
    if (!role_id) {
      throw new BadRequestException('Role ID is required');
    }

    try {
      // Fetch the role along with permissions
      const role = await this.rolesPermissionRepository.findOne({
        where: { role_id: role_id, is_active: true, is_deleted: false },
        relations: ['permissions'],
      });

      // Check if the role exists
      if (!role) {
        return {
          status: 404,
          message: `Role with ID ${role_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'Role fetched successfully',
        data: {
          role_id: role.role_id,
          role_name: role.role_name,
          created_by: role.created_by,
          created_at: role.createdAt,
          updated_at: role.updatedAt,
          is_active: role.is_active,
          is_deleted: role.is_deleted,
          is_compulsary: role.is_compulsary,
          is_outside_organization: role.is_outside_organization,
          permissions: role.permissions.map(permission => ({
            permission_id: permission.permission_id,
            permissions: permission.permissions, // Assuming permissions is stored as JSON
            created_at: permission.createdAt,
            updated_at: permission.updatedAt,
            is_active: permission.is_active,
            is_deleted: permission.is_deleted,
          })),
        },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the role',
        error: error.message,
      };
    }
  }

  update(id: number, updateRolesPermissionDto: UpdateRolesPermissionDto) {
    return `This action updates a #${id} rolesPermission`;
  }

  async createOrganizationRolesPermission(dto: CreateRolesPermissionDto, createdBy: number) {
    // Validate if the user exists
    const userExists = await this.userRepo.findOne({ where: { register_user_login_id: createdBy } });
    if (!userExists) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'Invalid createdBy user ID' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if the role_name already exists
    const existingRole = await this.rolesPermissionRepository.findOne({ where: { role_name: dto.role_name } });
    if (existingRole) {
      throw new HttpException(
        { status: HttpStatus.CONFLICT, message: `Role name '${dto.role_name}' already exists` },
        HttpStatus.CONFLICT,
      );
    }

    // Create the role
    const role = this.rolesPermissionRepository.create({
      role_name: dto.role_name,
      created_by: userExists.user_id,
      is_compulsary: dto.is_compulsary,
      is_outside_organization: dto.is_outside_organization,
    });
    const savedRole = await this.rolesPermissionRepository.save(role);

    // Save permissions directly as JSON
    const permissionEntity = this.permissionRepository.create({
      role: savedRole,
      permissions: dto.permissions, // Save the incoming array directly as JSONB
    });

    await this.permissionRepository.save(permissionEntity);

    // Return a success response in REST API format
    return {
      status: HttpStatus.CREATED,
      message: 'Role and permissions created successfully',
      data: {
        role: {
          role_id: savedRole.role_id,
          role_name: savedRole.role_name,
          created_by: savedRole.created_by,
          created_at: savedRole.createdAt,
          updated_at: savedRole.updatedAt,
          is_active: savedRole.is_active,
          is_deleted: savedRole.is_deleted,
          is_compulsary: savedRole.is_compulsary,
          is_outside_organization: savedRole.is_outside_organization,
        },
        permissions: {
          permission_id: permissionEntity.permission_id,
          role_id: savedRole.role_id,
          permissions: permissionEntity.permissions,
          created_at: permissionEntity.createdAt,
          updated_at: permissionEntity.updatedAt,
          is_active: permissionEntity.is_active,
          is_deleted: permissionEntity.is_deleted,
        }
      }
    };
  }

  async updateRoleWithPermissions(updateRoleDto: UpdateRolesPermissionDto) {
    const { role_id, role_name, permissions, is_deleted, is_compulsary, is_outside_organization } = updateRoleDto;

    // Fetch the role from the database using the role_id
    const role = await this.rolesPermissionRepository.findOne({
      where: { role_id },
      // relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${role_id} not found`);
    }

    // Update the role itself
    role.role_name = role_name;
    role.is_compulsary = is_compulsary;
    role.is_outside_organization = is_outside_organization;

    // If `is_deleted` is provided, update it
    if (typeof is_deleted !== 'undefined') {
      role.is_deleted = is_deleted;
    }

    // Assuming is_active should be updated based on specific conditions (e.g., a flag in the request or system rules)
    // Update is_active to `true` if it's not set in the payload, or use custom logic here
    // role.is_active = true;

    await this.rolesPermissionRepository.save(role);

    // If permissions are passed in the DTO, update them
    if (permissions) {
      const permission = await this.permissionRepository.findOne({ where: { role_id } });

      if (!permission) {
        throw new NotFoundException(`Permissions for role ID ${role_id} not found`);
      }

      permission.permissions = permissions; // Update permissions (assuming JSONB structure)

      await this.permissionRepository.save(permission);
    }

    return {
      role,
      permissions: permissions, // Return updated role with permissions
    };
  }

  async deleteRoleWithPermissions(deleteRoleDto: DeleteRoleDto) {
    const { role_id } = deleteRoleDto;

    // Check if role_id is provided and not null or undefined
    if (!role_id) {
      throw new BadRequestException('Role ID is required and cannot be null');
    }

    // Fetch the role from the database using the role_id
    const role = await this.rolesPermissionRepository.findOne({
      where: { role_id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${role_id} not found`);
    }

    // Mark the role as deleted
    role.is_deleted = true;
    role.is_active = false;

    // Save the updated role entity
    await this.rolesPermissionRepository.save(role);

    // Optionally, mark the associated permissions as deleted
    const permission = await this.permissionRepository.findOne({ where: { role_id } });

    if (permission) {
      permission.is_deleted = true;
      permission.is_active = false;
      await this.permissionRepository.save(permission);
    }

    return {
      role,
      permissions: role.permissions, // Return the updated role with permissions
    };
  }

   
  async getAllRolesForDropdown() {
    
    const roles = await this.rolesPermissionRepository.find({
      where: { is_active: true, is_deleted: false },
      order: { role_name: 'ASC' },
    });
    
    // Map to { value, label } format for dropdown
    const dropdownRoles = roles.map((role) => ({
      value: role.role_id,
      label: role.role_name,
    }));
    
    return dropdownRoles;
  }

}
