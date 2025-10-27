import { Controller, Get, Post, Param, Body, Put, Delete, UseGuards, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { OrganizationRolesPermissionService } from './organization_roles_permission.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { exit, exitCode } from 'process';
import { CreateRoleWithPermissionsDto } from './dto/role_permission.dto';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';
import { UpdateRoleWithPermissionsDto } from './dto/update_role_permission.dto';
import { DeleteRoleDto } from './dto/delete_role_permission.dto';
import { FetchPaginationDto } from 'src/common/paginationDTO/fetch-pagination.dto';
import { GetRoleDto } from './dto/get_role.dto';


@Controller('organization-roles-permission')
export class OrganizationRolesPermissionController {

    constructor(private readonly organizationRolesPermissionService: OrganizationRolesPermissionService) { }


    // create role and permission
    @Post('insert_organization_role_permission')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async createRoleWithPermissions(@Body() dto: CreateRoleWithPermissionsDto, @Req() req) {
        const createdBy = req.cookies.system_user_id; // Extract `userId` from cookies

        const encryptedUserId = decrypt(createdBy.toString());
        if (!encryptedUserId) {
            throw new Error('User ID not found in cookies');
        }

        const userId = Number(encryptedUserId); // Convert to number
        if (isNaN(userId)) {
            throw new Error('Invalid decrypted user ID');
        }

        return this.organizationRolesPermissionService.createOrganizationRolesPermission(dto, userId);
    }


    // fetch of roles name only
    @Get('all-roles-data')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async getAllRolesNames(
        @Query() query: FetchPaginationDto,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const { page, limit, search, sortBy, sortOrder  } = query;

            const result =  await this.organizationRolesPermissionService.getAllRolesNames(page,limit,search,sortBy, sortOrder );
            
            return res.status(result.status).json(result);

        } catch (error) {
            return res.status(error.status || 500).json({
                statusCode: error.status || 500,
                message: error.message || "Internal Server Error",
            });
        }
    }

    // fetch of roles name only
    @Get('all-internal-roles-data')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async getAllInternalRolesNames(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') searchQuery: string = ''
    ) {
        return await this.organizationRolesPermissionService.getAllInternalRolesNames(page, limit, searchQuery);
    }


    @Get('all-external-roles-data')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async getAllExternalRolesNames(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') searchQuery: string = ''
    ) {
        return await this.organizationRolesPermissionService.getAllExternalRolesNames(page, limit, searchQuery);
    }


    // fetch of roles and permission
    @Get('all-roles-permissions')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async getAllRolesWithPermissions() {
        const rolesWithPermissions = await this.organizationRolesPermissionService.getAllRolesWithPermissions();
        return {
            status: 200,
            message: 'Roles and permissions fetched successfully',
            data: rolesWithPermissions,
        };
    }

    // Update code 
     @Post('update-role-permissions')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async updateRoleWithPermissions(
        @Body() updateRoleDto: UpdateRoleWithPermissionsDto,
        @Req() req,
        @Res() res
    ) {
        const updatedRole = await this.organizationRolesPermissionService.updateRoleWithPermissions(updateRoleDto);

        return res.status(HttpStatus.OK).json({
            status: HttpStatus.OK,
            message: 'Role and permissions updated successfully',
            data: updatedRole,
        });
    }

//// bulk update for matrix
@Post('bulk-update-role-permissions')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async bulkUpdateRolePermissions(
  @Body() bulkUpdateDto: { roles: { role_id: number; permissions: any[] }[] },
  @Res() res,
) {
  const updated = await this.organizationRolesPermissionService.bulkUpdateRolePermissions(bulkUpdateDto.roles);

  return res.status(HttpStatus.OK).json({
    status: HttpStatus.OK,
    message: 'Permissions updated successfully',
    data: updated,
  });
}



    @Post('fetch-single-role-permissions')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async fetchSingleRoleWithPermissions(
        @Body() GetRoleDto : GetRoleDto ,
        @Res() res: Response
    ) {
        const response = await this.organizationRolesPermissionService.fetchSingleRoleWithPermissions(GetRoleDto);
        return res.status(response.status).json(response);
    }


    // @Post('delete-role-permissions')
    // @UseGuards(ApiKeyGuard, JwtAuthGuard)
    // async deleteRoleWithPermissions(@Body() deleteRoleDto: DeleteRoleDto, @Req() req, @Res() res) {
    //     const deletedRole = await this.organizationRolesPermissionService.deleteRoleWithPermissions(deleteRoleDto);

    //     return res.status(HttpStatus.OK).json({
    //         status: HttpStatus.OK,
    //         message: 'Role deleted successfully',
    //         data: deletedRole,
    //     });
    // }
    @Post('delete-role-permissions')
    @UseGuards(ApiKeyGuard, JwtAuthGuard)
    async deleteRoleWithPermissions(@Body() deleteRoleDto: DeleteRoleDto, @Req() req, @Res() res) {
        const deletedRole = await this.organizationRolesPermissionService.deleteRoleWithPermissions(deleteRoleDto);

        return res.status(HttpStatus.OK).json({
            status: HttpStatus.OK,
            message: 'Roles deleted successfully',
            data: deletedRole,
        });
    }


}


