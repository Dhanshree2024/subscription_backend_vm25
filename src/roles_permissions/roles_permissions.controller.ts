import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Req, Res, Query, HttpStatus } from '@nestjs/common';
import { RolesPermissionsService } from './roles_permissions.service';
import { CreateRolesPermissionDto } from './dto/create-roles_permission.dto';
import { UpdateRolesPermissionDto } from './dto/update-roles_permission.dto';
import { ApiKeyGuard } from 'src/auth/api-key.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response, Request } from 'express';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';
import { DeleteRoleDto } from './dto/delete-roles_permission.dto';

@Controller('roles-permissions')
export class RolesPermissionsController {
  constructor(private readonly rolesPermissionsService: RolesPermissionsService) { }

  @Post()
  create(@Body() createRolesPermissionDto: CreateRolesPermissionDto) {
    return this.rolesPermissionsService.create(createRolesPermissionDto);
  }

  @Get('getAll')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('search') searchQuery: string = '') {

    try {
      return this.rolesPermissionsService.findAll(page, limit, searchQuery);
    } catch (error) {
      return false
    }
  }


  @Get('getAllRoles')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllRoles() {
    try {
      const roles = await this.rolesPermissionsService.getAllRoles();
      return { success: true, data: roles };
    } catch (error) {
      console.error('Error in getAllRoles:', error);
      return { success: false, message: 'Failed to fetch roles.' };
    }
  }


  @Post('fetch-single-role-permissions')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleRoleWithPermissions(
    @Body() deleteRoleDto: DeleteRoleDto,
    @Res() res: Response
  ) {
    const response = await this.rolesPermissionsService.fetchSingleRoleWithPermissions(deleteRoleDto);
    return res.status(response.status).json(response);
  }


  // create role and permission
  @Post('insert_organization_role_permission')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createRoleWithPermissions(@Body() dto: CreateRolesPermissionDto, @Req() req) {
    const createdBy = req.cookies.system_user_id; // Extract `userId` from cookies

    const encryptedUserId = decrypt(createdBy.toString());
    if (!encryptedUserId) {
      throw new Error('User ID not found in cookies');
    }

    const userId = Number(encryptedUserId); // Convert to number
    if (isNaN(userId)) {
      throw new Error('Invalid decrypted user ID');
    }

    return this.rolesPermissionsService.createOrganizationRolesPermission(dto, userId);
  }

  // Update code 
  @Post('update-role-permissions')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateRoleWithPermissions(
    @Body() updateRoleDto: UpdateRolesPermissionDto,
    @Req() req,
    @Res() res
  ) {
    const updatedRole = await this.rolesPermissionsService.updateRoleWithPermissions(updateRoleDto);

    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Role and permissions updated successfully',
      data: updatedRole,
    });
  }


  @Post('delete-role-permissions')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteRoleWithPermissions(@Body() deleteRoleDto: DeleteRoleDto, @Req() req, @Res() res) {
    const deletedRole = await this.rolesPermissionsService.deleteRoleWithPermissions(deleteRoleDto);
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Role deleted successfully',
      data: deletedRole,
    });
  }

   // temp service for dropdown 
  
  @Get('getAllRolesForDropdown')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllRolesForDropdown() {
    try {
      const dropdownRoles = await this.rolesPermissionsService.getAllRolesForDropdown(); // call the service

      return {
        status: true,
        message: 'Roles fetched successfully',
        data: dropdownRoles, // array of { value, label }
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Failed to fetch roles',
        error: error.message || error,
      };
    }
  }
}
