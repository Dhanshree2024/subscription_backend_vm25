import { Injectable, HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, ILike } from 'typeorm';
import { Roles } from './entity/role.entity';
import { Permission } from './entity/permissions.entity';
import { CreateRoleWithPermissionsDto } from './dto/role_permission.dto';
import { User } from '../organizational-profile/entity/organizational-user.entity'; // Import User entity
import { exit } from 'process';
import { BulkUpdateRolesWithPermissionsDto, UpdateRoleWithPermissionsDto } from './dto/update_role_permission.dto';
import { DeleteRoleDto } from './dto/delete_role_permission.dto';
import { GetRoleDto } from './dto/get_role.dto';


@Injectable()
export class OrganizationRolesPermissionService {
    constructor(
        @InjectRepository(Roles)
        private readonly roleRepository: Repository<Roles>,

        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async createOrganizationRolesPermission(dto: CreateRoleWithPermissionsDto, createdBy: number) {

        console.log("dto", dto)
        // Validate if the user exists
        const userExists = await this.userRepository.findOne({ where: { register_user_login_id: createdBy } });
        if (!userExists) {
            throw new HttpException(
                { status: HttpStatus.BAD_REQUEST, message: 'Invalid createdBy user ID' },
                HttpStatus.BAD_REQUEST,
            );
        }

        // Check if the role_name already exists
        const existingRole = await this.roleRepository.findOne({
            where: {
                role_name: ILike(dto.roleName),
                is_active: true // Only check active roles
            }
        });
        if (existingRole) {
            throw new HttpException(
                { status: HttpStatus.CONFLICT, message: `Role name '${dto.roleName}' already exists` },
                HttpStatus.CONFLICT,
            );
        }

        // Create the role
        const role = this.roleRepository.create({
            role_name: dto.roleName,
            role_type: dto.role_type,
            role_description: dto.roledescription,
            created_by: userExists.user_id,
            is_compulsary: dto.is_compulsary,
            is_outside_organization: dto.is_outside_organization,
        });
        const savedRole = await this.roleRepository.save(role);

        // Save permissions directly as JSON
        const permissionEntity = this.permissionRepository.create({
            role: savedRole,
            permissions: dto.permissions, // Save the incoming array directly as JSONB
        });

        await this.permissionRepository.save(permissionEntity);

        // Return a success response in REST API format
        return {
            status: 200,
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
                    role_type:savedRole.role_type,
                    is_outside_organization: savedRole.is_outside_organization,
                },
                permissions: {
                    permission_id: permissionEntity.permission_id,
                    role_id: savedRole.role_id,
                    permissions: permissionEntity.permissions,
                    created_at: permissionEntity.created_at,
                    updated_at: permissionEntity.updated_at,
                    is_active: permissionEntity.is_active,
                    is_deleted: permissionEntity.is_deleted,
                }
            }
        };
    }


    async getAllRolesNames(page: number = 1, limit: number = 10, searchQuery: string = '',sortBy: string = 'created_at', sortOrder: 'ASC' | 'DESC' = 'ASC') {
        // Calculate the offset for pagination
        const skip = (page - 1) * limit;
        const allowedSortFields = ['role_id', 'role_name', 'created_at', 'updated_at'];
        const finalSortOrder: 'ASC' | 'DESC' = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
        // Build the search query condition
        const queryBuilder = this.roleRepository.createQueryBuilder('role')
        .where('role.is_active = :isActive', { isActive: true })
        .andWhere('role.is_deleted = :isDeleted', { isDeleted: false });

        // Apply search condition
        if (searchQuery) {
            queryBuilder.andWhere('role.role_name ILIKE :search', { search: `%${searchQuery}%` });
        }

        if (allowedSortFields.includes(sortBy)) {
            queryBuilder.orderBy(`role.${sortBy}`, finalSortOrder);
        } else {
            queryBuilder.orderBy('role.role_id', 'DESC'); // Default sorting
        }
        queryBuilder.skip(skip).take(limit);

    
        const [roles, total] = await queryBuilder.getManyAndCount();


        // If no roles are found, return an appropriate response
        if (!roles || roles.length === 0) {
            return {
                status: 404,
                message: 'No active and non-deleted roles found',
                data: [],
                total: 0,
                page,
                limit,
            };
        }

        return {
            status: 200,
            message: 'Active Roles fetched successfully',
            data: roles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAllInternalRolesNames(page: number = 1, limit: number = 10, searchQuery: string = '') {
        // Calculate the offset for pagination
        const skip = (page - 1) * limit;

        // Build the search query condition
        const whereConditions = {
            is_active: true,
            is_deleted: false,
            is_outside_organization: false,
            role_name: searchQuery ? Like(`%${searchQuery}%`) : undefined, // Search based on role_name if provided
        };

        const [roles, total] = await this.roleRepository.findAndCount({
            where: whereConditions,
            skip,
            take: limit,
        });

        // If no roles are found, return an appropriate response
        if (!roles || roles.length === 0) {
            return {
                status: 404,
                message: 'No active and non-deleted roles found',
                data: [],
                total: 0,
                page,
                limit,
            };
        }

        return {
            status: 200,
            message: 'Active Roles fetched successfully',
            data: roles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAllExternalRolesNames(page: number = 1, limit: number = 10, searchQuery: string = '') {
        // Calculate the offset for pagination
        const skip = (page - 1) * limit;

        // Build the search query condition
        const whereConditions = {
            is_active: true,
            is_deleted: false,
            is_outside_organization: true,
            role_name: searchQuery ? Like(`%${searchQuery}%`) : undefined, // Search based on role_name if provided
        };

        const [roles, total] = await this.roleRepository.findAndCount({
            where: whereConditions,
            skip,
            take: limit,
        });

        // If no roles are found, return an appropriate response
        if (!roles || roles.length === 0) {
            return {
                status: 404,
                message: 'No active and non-deleted roles found',
                data: [],
                total: 0,
                page,
                limit,
            };
        }

        return {
            status: 200,
            message: 'Active Roles fetched successfully',
            data: roles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

  async fetchSingleRoleWithPermissions(GetRoleDto: GetRoleDto) {
  const { role_id } = GetRoleDto;

  // Validate if role_id is provided
  if (!role_id) {
    throw new BadRequestException('Role ID is required');
  }

  try {
    // Fetch the role along with permissions
    const role = await this.roleRepository.findOne({
      where: { role_id, is_active: true, is_deleted: false },
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

    // Flatten permissions
    const flatPermissions = [];
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((permEntity) => {
        if (Array.isArray(permEntity.permissions)) {
          permEntity.permissions.forEach((module) => {
            if (Array.isArray(module.children) && module.children.length) {
              module.children.forEach((child) => {
                flatPermissions.push({
                  moduleName: module.moduleName,
                  ...child,
                });
              });
            } else {
              flatPermissions.push({
                moduleName: module.moduleName,
                ...module,
              });
            }
          });
        }
      });
    }

    // Format the response
    return {
      status: 200,
      message: 'Role fetched successfully',
      data: {
        role_id: role.role_id,
        role_name: role.role_name,
        role_description: role.role_description,
        created_by: role.created_by,
        created_at: role.createdAt,
        updated_at: role.updatedAt,
        is_active: role.is_active,
        is_deleted: role.is_deleted,
        is_compulsary: role.is_compulsary,
        is_outside_organization: role.is_outside_organization,
        permissions: flatPermissions
        
        ,
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



    // Fetch all roles with their permissions
    async getAllRolesWithPermissions() {
        const roles = await this.roleRepository.find({
            relations: ['permissions'], // This assumes you have a relationship defined between roles and permissions
            where: {
                is_active: true,  // Filter for active roles
                is_deleted: false // Filter for non-deleted roles
            },
        });

        return roles.map(role => ({
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
                permissions: permission.permissions, // assuming permissions is stored as JSON
                created_at: permission.created_at,
                updated_at: permission.updated_at,
                is_active: permission.is_active,
                is_deleted: permission.is_deleted,
            })),
        }));
    }

    async updateRoleWithPermissions(updateRoleDto: UpdateRoleWithPermissionsDto) {
        const { role_id, roleName, roledescription, permissions, is_deleted, is_compulsary, is_outside_organization, } = updateRoleDto;

        console.log('Received roledescription:', roledescription); 
        // Fetch the role from the database using the role_id
        const role = await this.roleRepository.findOne({
            where: { role_id },
            relations: ['permissions'],
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${role_id} not found`);
        }

        // Update the role itself
        role.role_name = roleName;
        role.role_description = roledescription;
        role.is_compulsary = is_compulsary;
        role.is_outside_organization = is_outside_organization;

        // If `is_deleted` is provided, update it
        if (typeof is_deleted !== 'undefined') {
            role.is_deleted = is_deleted;
        }

        // Assuming is_active should be updated based on specific conditions (e.g., a flag in the request or system rules)
        // Update is_active to `true` if it's not set in the payload, or use custom logic here
        // role.is_active = true;

        const SaveRoleData = await this.roleRepository.save(role);

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
            SaveRoleData,
            permissions: permissions, // Return updated role with permissions
        };
    }


    // organization-roles-permission.service.ts

// Service
async bulkUpdateRolePermissions(roles: { role_id: number; permissions: any[] }[]) {
  const results = [];

  for (const { role_id, permissions } of roles) {
    const permissionEntity = await this.permissionRepository.findOne({ where: { role_id } });

    if (!permissionEntity) {
      throw new NotFoundException(`Permissions for role ID ${role_id} not found`);
    }

    permissionEntity.permissions = permissions;
    const saved = await this.permissionRepository.save(permissionEntity);

    results.push({ role_id, permissions: saved.permissions });
  }

  return results;
}


    // async deleteRoleWithPermissions(deleteRoleDto: DeleteRoleDto) {
    //     const { role_id } = deleteRoleDto;

    //     // Check if role_id is provided and not null or undefined
    //     if (!role_id) {
    //         throw new BadRequestException('Role ID is required and cannot be null');
    //     }

    //     // Fetch the role from the database using the role_id
    //     const role = await this.roleRepository.findOne({
    //         where: { role_id },
    //         relations: ['permissions'],
    //     });

    //     if (!role) {
    //         throw new NotFoundException(`Role with ID ${role_id} not found`);
    //     }

    //     // Mark the role as deleted
    //     role.is_deleted = true;
    //     role.is_active = false;

    //     // Save the updated role entity
    //     await this.roleRepository.save(role);

    //     // Optionally, mark the associated permissions as deleted
    //     const permission = await this.permissionRepository.findOne({ where: { role_id } });
    //     if (permission) {
    //         permission.is_deleted = true;
    //         permission.is_active = false;
    //         await this.permissionRepository.save(permission);
    //     }

    //     return {
    //         role,
    //         permissions: role.permissions, // Return the updated role with permissions
    //     };
    // }

    async deleteRoleWithPermissions(deleteRoleDto: DeleteRoleDto) {
        const { role_id } = deleteRoleDto;
      
        if (!Array.isArray(role_id) || role_id.length === 0) {
          throw new BadRequestException('role_id must be a non-empty array');
        }
      
        const roles = await this.roleRepository.find({
            where: {
              role_id: In(role_id),
              is_active: true,
              is_deleted: false,
            },
            relations: ['permissions'],
          });
      
        const results = [];
      
        for (const role of roles) {
          role.is_deleted = true;
          role.is_active = false;
          await this.roleRepository.save(role);
      
          const permission = await this.permissionRepository.findOne({ where: { role_id: role.role_id } });
          if (permission) {
            permission.is_deleted = true;
            permission.is_active = false;
            await this.permissionRepository.save(permission);
          }
      
          results.push({ role, permissions: role.permissions });
        }
      
        return results;
      }
    async checkUserPermission(
        userId: number,
        schema: string,
        moduleName: string,
        permissionTypes: string[]
    ): Promise<boolean> {
        const permissionConditions = permissionTypes
            .map((perm, index) => `COALESCE((module->>$${index + 3})::BOOLEAN, false) = true`)
            .join(" OR ");

        const query = `
          WITH recursive children_expanded AS (
              SELECT 
                  perm.role_id,
                  jsonb_array_elements(perm.permissions) AS module
              FROM ${schema}.organization_permissions perm
              WHERE perm.role_id = (
                  SELECT current_role_id FROM ${schema}.users WHERE register_user_login_id = $1
              )
    
              UNION ALL
    
              SELECT 
                  ce.role_id,
                  jsonb_array_elements(ce.module->'children')
              FROM children_expanded ce
              WHERE ce.module ? 'children'
          )
    
          SELECT EXISTS (
              SELECT 1 FROM children_expanded
              WHERE module->>'moduleName' = $2
              AND (${permissionConditions})
          ) AS "hasPermission";
        `;

        const values = [userId, moduleName, ...permissionTypes];

        const result = await this.userRepository.query(query, values);
        return result[0]?.hasPermission || false;
    }

}
