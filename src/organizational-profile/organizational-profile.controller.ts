import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  Patch,
  Query,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
// import { OrganizationalProfileService } from './organizational-profile.service';
import { OrganizationService } from './organizational-profile.service';
import { OrganizationalProfile } from './entity/organizational-profile.entity';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateOrganizationalProfileDto,
  UpdateOrganizationalProfileDto,
} from './dto/create-organizational-profile.dto';
import { Response, Request } from 'express';
import { CreateDepartmentsDto } from './dto/department.dto';
import { CreateDesignationDto } from './dto/designation.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { decrypt } from 'src/common/encryption_decryption/crypto-utils';
import { DeleteUsersDto } from './dto/user-delete.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { DeleteVendorsDto } from './dto/vendor-delete.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { DeleteDepartmentsDto } from './dto/delete-department-dto';
import { UpdateBranchAndUserDto } from './dto/update-branch-and-user.dto';
import { FetchPaginationDto } from './dto/pagination-dto';
import { FetchSingleVendorDto } from './dto/fetch-single-vendor.dto';
import { FetchSingleUserDto } from './dto/fetch-single-user.dto';
import { DeleteDesignationsDto } from './dto/delete-degination-dto';
import { EditDepartmentDto } from './dto/update-dept.dto';
import { createBranchDTO } from './dtos/create-branch.dto';
import { CreatePaymentDto } from 'src/subscription_pricing/dto/payment.dto';


// multer configuration
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { GetBranchByIdDto } from './dtos/get-branch-by-id.dto';
import { VendorIdListDto } from './dtos/vendor-id-list.dto';

@Controller('organizational-profile')
export class OrganizationalProfileController {
  constructor(private readonly organizationService: OrganizationService) { }


  @Get('download-vendor-template')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async downloadVendorTemplate(@Req() req: Request, @Res() res: Response) {
    try {
      // Generate the Excel template buffer
      const buffer = await this.organizationService.generateVendorTemplate();

      // Set headers for file download
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=vendor_template.xlsx',
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      // Send the file
      res.send(buffer);
    } catch (error) {
      console.error('Error generating vendor template:', error);
      res.status(500).send('Failed to generate Excel template');
    }
  }

  @Get('download-user-template')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async generateUserTemplate(@Req() req: Request, @Res() res: Response) {
    try {
      // Generate the Excel template buffer
      const buffer = await this.organizationService.generateUserTemplate();

      // Set headers for file download
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=user_template.xlsx',
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      // Send the file
      res.send(buffer);
    } catch (error) {
      console.error('Error generating vendor template:', error);
      res.status(500).send('Failed to generate Excel template');
    }
  }

  @Post('create-bulk-user')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateUser(@Body() dtos: any[], @Req() req: any) {
    // 🟢 Point 1: Extract from cookies
    const system_user_id = req.cookies.system_user_id;
    const organizationID = req.cookies.organization_id;

    console.log('🟢 [Point 1] Raw Cookies =>', {
      system_user_id,
      organizationID,
    });

    // 🔐 Point 2: Decrypt IDs
    const decrypted_system_user_id = decrypt(system_user_id?.toString());
    const encryptedorganizationID = decrypt(organizationID);

    console.log('🔐 [Point 2] Decrypted Values =>', {
      decrypted_system_user_id,
      decrypted_organizationID: encryptedorganizationID,
    });

    // 🔍 Point 3: Validate organization ID
    if (!encryptedorganizationID) {
      console.error('❌ [Point 3] Organization ID not found in cookies');
      throw new Error('Organization ID not found in cookies');
    }

    const organization_Id = Number(encryptedorganizationID);
    if (isNaN(organization_Id)) {
      console.error(
        '❌ [Point 3.1] Invalid decrypted organization ID:',
        encryptedorganizationID,
      );
      throw new Error('Invalid decrypted organization ID');
    }

    // 📦 Point 4: Log first DTO sample for debugging
    console.log('📦 [Point 4] DTO sample:', dtos?.[0]);

    // ✅ Point 5: Proceed to service if valid user
    if (decrypted_system_user_id) {
      console.log('✅ [Point 5] Calling bulkCreateUsers with:', {
        organization_Id,
        decrypted_system_user_id,
        totalRecords: dtos.length,
      });

      const result = await this.organizationService.bulkCreateUsers(
        dtos,
        organization_Id,
        +decrypted_system_user_id,
      );

      console.log('📬 [Point 6] Response from service =>', {
        status: result.status,
        created: result.data?.created_count,
        errors: result.data?.error_users?.length,
      });

      return {
        statusCode: result.status,
        message: result.message,
        data: result.data,
      };
    } else {
      console.error('❌ [Point 7] Invalid or missing decrypted user ID');
      return {
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing user ID.',
        data: null,
      };
    }
  }

  @Get('getOrganizationDesignation')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationDesignation(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.organizationService.fetchOrganizationDesignation();
      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }


  @Get('fetchindustrytype')
  // @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getIndustryTypeValues(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.organizationService.fetchIndustryTypes();
      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }
@Get()
async getjs()
{
  console.log('d0');
}

// Remove the global guards for this method
@Get('plan-with-all-details/:id')
async getPlanWithFeaturesById(
  @Param('id') id: number,
  @Res() res: Response,
) {
  try {
    console.log('Plan ID:', id);

    const data = await this.organizationService.getPlanWithFeaturesById(id);

    if (!data) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: `Plan with id ${id} not found`,
      });
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched plan with features successfully',
      data,
    });
  } catch (error) {
    console.error('Error fetching plan with features:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch plan with features',
    });
  }
}

//Plans with features
@Post('plans-with-features')
async getAllPlansWithFeatures(@Res() res: Response) {
  try {
    const data = await this.organizationService.getAllPlansWithFeatures();

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched all plans with their features successfully',
      data,
    });
  } catch (error) {
    console.error('Error fetching plans with features:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch plans with features',
    });
  }
}
//
@Post('plans-by-product')
async getPlansWithFeaturesByProducts(
  @Body('productId') productId: number,
  @Res() res: Response,
) {
  try {
    const data = await this.organizationService.getPlansWithFeaturesByProducts(productId);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched plans with features for the product successfully',
      data,
    });
  } catch (error) {
    console.error('Error fetching plans with features by product:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch plans with features by product',
    });
  }
}



@Post('get-plans-by-product')
async getPlansWithFeaturesByProduct(
  @Body('productId') productId: number,
  @Res() res: Response
) {
  try {
    if (!productId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const data = await this.organizationService.getPlansWithFeaturesByProduct(productId);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched all plans with their features for the product successfully',
      data,
    });
  } catch (error) {
    console.error('Error fetching plans with features by product:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch plans with features by product',
    });
  }
}

  @Get('fetchDepartmentconfig')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getDepartmentConfigValues(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      const result = await this.organizationService.fetchDepartmentconfig(
        page,
        limit,
        searchQuery,
      );
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Get('fetchDepartments')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getDepartmentsWithPagination(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      const result = await this.organizationService.fetchDepartments(
        page,
        limit,
        searchQuery,
      );
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Get('fetchDesignations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getDesignationsWithPagination(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') searchQuery: string = '',
  ) {
    try {
      const result =
        await this.organizationService.fetchOrganizationDesignation(

          searchQuery,
        );
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Get('fetchDesignationsconfig')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getDesignationsConfigValues(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.organizationService.fetchDesignationsconfig();
      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Post('setDepartments')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async setDepartmentValues(
    @Body() createDepartmentsDto: CreateDepartmentsDto,
  ) {
    try {
      return this.organizationService.createDepartments(createDepartmentsDto);
    } catch (error) {
      console.log(error);
    }
  }

  // In organizational-profile.controller.ts

@Post('editDepartment')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async editDepartment(
  @Query('id') id: string,
  @Body() editDto: EditDepartmentDto,
) {
  try {
    return this.organizationService.editDepartment(+id, editDto);
  } catch (error) {
    console.error(error);
    throw new BadRequestException('Failed to edit department');
  }
}


  // vk adding Designations
  @Post('setDesignations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async setDesignationsValues(
    @Body() CreateDesignationDto: CreateDesignationDto,
  ) {
    try {
      return this.organizationService.createDesignations(CreateDesignationDto);
    } catch (error) {
      console.log(error);
    }
  }

  @Post('editDesignation')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async editDesignation(
  @Query('id') designationId: number,
  @Body('designation_name') designationName: string,
  @Body('desg_description') desg_description: string,
  @Body('departmentId') departmentId: number,
) {
  try {
    return await this.organizationService.editDesignation(
      designationId,
      designationName,
      desg_description,
      departmentId,
    );
  } catch (error) {
    console.log(error);
    throw new BadRequestException('Failed to edit designation.');
  }
}



  @Post('removeDepartments')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async removeDepartmentValues(
    @Body() deleteDepartmentsDto: DeleteDepartmentsDto,
  ) {
    return await this.organizationService.deleteDepartments(
      deleteDepartmentsDto,
    );
  }

  @Post('removeDesignation')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async removeDesignationValue(
    @Body() deleteDesignationDto: DeleteDesignationsDto,
  ) {
    return await this.organizationService.deleteDesignation(
      deleteDesignationDto,
    );
  }

  @Get('getOrganizationDepartments')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationDeparments(
   
    @Query('search') searchQuery: string = '',
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.organizationService.fetchOrganizationDeparments();
      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }





 

  @Get('getDepartmentDropdown')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getDepartmentDropdown() {
    return await this.organizationService.getDepartmentDropdown();
  }

  @Get('getBranchDropdown')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getBranchDropdown() {
    return await this.organizationService.getBranchDropdown();
  }

  @Get('filterable-user-columns')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  getFilterableItemColumns() {
    return {
      success: true,
      data: this.organizationService.getFilterableUserColumns(),
    };
  }

  // main categories for Dropdown
  @Get('users-for-dropdown-of-filter')
  async getCategoryDropdown() {
    const data = await this.organizationService.getUserDropdown();
    return {
      success: true,
      data,
    };
  }

  @Get('exportUserCSV')
  async exportUsersCSV() {
    return this.organizationService.exportUserCSV();
  }

  @Get('exportVendorCSV')
  async exportVendorCSV() {
    return this.organizationService.exportVendorCSV();
  }



 

  @Get('getAllorganizationVenders')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllorganizationVenders() {
    try {
      return this.organizationService.getAllorganizationVenders();
    } catch (error) {
      return false;
    }
  }

  @Get('fetchAllBranchusers')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchAllBranchusers(
    @Query('branch_id') branch_id: number,
    @Query('department_id') department_id?: number,
  ) {
    try {
      return await this.organizationService.fetchAllBranchusers(
        branch_id,
        department_id,
      );
    } catch (error) {
      return false;
    }
  }


  // branch controllers
  // Create Branch
  // ============================================================================================================================================================

  // Update Branch

  // No change
  @Get('getOrganizationBranches')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationBranches(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.organizationService.fetchOrganizationBranches();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Internal server error.',
      });
    }
  }

  // New Bckend Controllers

  @Get('fetchOrganizationProfile')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getOrganizationalProfile(@Req() req: Request, @Res() res: Response) {
    try {
      console.log("abcd");
      const result =
        await this.organizationService.fetchOrganizationalProfile();

        console.log("result",result);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Post('createBranch')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createBranch1(@Body() body: any, @Req() req) {
    // Controller
    console.log("body :- ", body);
    const createBranchDto: CreateBranchDto = {
      branch_name: body.branch_name || "",
      gstNo: body.gstNo || "",
      contact_number: body.contact_number || "",
      alternative_contact_number: body.alternative_contact_number || "",
      branch_email: body.branch_email || "",
      established_date: body.established_date ?? null,

      branch_street: body.branch_street || "",
      branch_landmark: body.branch_landmark || "",
      city: body.city || "",
      state: body.state || "",
      country: body.country || "",
      pincode: body.pincode || "",

      city_id: body.city_id ?? null,
      country_id: body.country_id ?? null,
      location_id: body.location_id ?? null,
      primary_user_id: body.primary_user_id ?? null,
      created_by: body.created_by ?? null,
      is_active: body.is_active ?? false,
      is_deleted: body.is_deleted ?? false,
      primaryUser: body.primaryUser ?? undefined,
    };
    console.log("createBranchDto", createBranchDto);

    const organizationID = decrypt(req.cookies.organization_id);
    const system_user_id = decrypt(req.cookies.system_user_id);
    const decrypted_system_user_id = Number(organizationID);


    if (!organizationID) {
      throw new Error('Organization ID not found in cookies');
    }

    const organization_Id = Number(organizationID);
    if (isNaN(organization_Id)) {
      throw new Error('Invalid decrypted organization ID');
    }

    // Step 1: Create branch and get branch ID
    const branch = await this.organizationService.createBranch1(createBranchDto);

    const branch_id = branch.branchId;
    console.log('branch', branch);

    // Case 1: If primary_user_id is already provided, no need to create user again
    if (createBranchDto.primary_user_id) {
      return {
        message: 'Branch created with existing primary user',
        branch_id,
      };
    }

    // Case 2: Create new user if primary_user_id is missing
    if (createBranchDto.primaryUser) {
      const primaryUser = createBranchDto.primaryUser;
      if (
        !primaryUser ||
        !primaryUser.first_name ||
        !primaryUser.phone_number ||
        !primaryUser.users_business_email
      ) {
        throw new Error(
          'Missing required primary user fields for new user creation',
        );
      }

      const userDto: CreateUserDto = {
        first_name: primaryUser.first_name,
        middle_name: primaryUser.middle_name || null,
        last_name: primaryUser.last_name || null,
        phone_number: primaryUser.phone_number,
        user_alternative_contact_number: primaryUser.user_alternative_contact_number,
        users_business_email: primaryUser.users_business_email,
        branch_id: branch_id,
        role_id: null,
        department_id: null,
        designation_id: null,
        street: null,
        landmark: null,
        country: null,
        city: null,
        state: null,
        zip: null,
      };

      console.log('userDto', userDto);

      const userResult = await this.organizationService.createNewUser(
        userDto,
        organization_Id,
        decrypted_system_user_id,
      );

      console.log('userResult', userResult);

      console.log(
        'userDto, organization_Id, decrypted_system_user_id',
        userDto,
        organization_Id,
        decrypted_system_user_id,
      );

      const user_id = userResult?.data?.user?.user_id;

      if (!user_id) {
        throw new Error('User ID missing from user creation result');
      }

      const updateBranchDto = {
        branch_id,
        primary_user_id: user_id,
      };

      const updatedBranch = await this.organizationService.updateBranch(updateBranchDto);
    }

    return {
      message: 'Branch created with new primary user',
      branch_id: branch_id,
    };

  }

  @Post('updateBranch')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateBranch(@Body() body: any, @Req() req) {
    console.log('body :- ', body);
    // ✅ New: explicit mapping like createBranch1
    const updateBranchDto: UpdateBranchDto = {
      branch_id: body.branch_id,
      branch_name: body.branch_name || '',
      gstNo: body.gstNo || '',
      contact_number: body.contact_number || '',
      alternative_contact_number: body.alternative_contact_number || '',
      branch_email: body.branch_email || '',
      established_date: body.established_date ?? null,
      branch_street: body.branch_street || '',
      branch_landmark: body.branch_landmark || '',
      city: body.city || '',
      state: body.state || '',
      pincode: body.pincode || '',
      country: body.country || '',

      city_id: body.city_id ?? null,
      country_id: body.country_id ?? null,
      location_id: body.location_id ?? null,
      primary_user_id: body.primary_user_id ?? null,
      created_by: body.created_by ?? null,
      is_active: body.is_active ?? false,
      is_deleted: body.is_deleted ?? false,
      primaryUser: body.primaryUser ?? undefined,
    };

    console.log('updateBranchDto', updateBranchDto);

    // Step 1: Update branch
    const updatedBranch = await this.organizationService.updateBranch(updateBranchDto);
    const branch_id = updateBranchDto.branch_id;
    const primaryUser = updateBranchDto.primaryUser;

    // ✅ New structure while keeping old logic
    if (updateBranchDto.primary_user_id && primaryUser) {
      const userUpdateDto: UpdateUserDto = {
        user_id: updateBranchDto.primary_user_id,
        first_name: primaryUser.first_name,
        middle_name: primaryUser.middle_name || null,
        last_name: primaryUser.last_name || null,
        phone_number: primaryUser.phone_number,
        user_alternative_contact_number: primaryUser.user_alternative_contact_number,
        users_business_email: primaryUser.users_business_email,
        branch_id: branch_id,
        role_id: null,
        department_id: null,
        designation_id: null,
        street: null,
        landmark: null,
        country: null,
        city: null,
        state: null,
        zip: null,
      };

      console.log('userUpdateDto', userUpdateDto);

      const userUpdateResult =
        await this.organizationService.updateUserManagementData(userUpdateDto);

      return {
        message: 'Branch and user details updated successfully',
        branch_id,
        primary_user_id: updateBranchDto.primary_user_id,
        updatedBranch,
        updatedUser: userUpdateResult,
      };
    }

    return {
      message: 'Branch updated with existing primary user',
      branch_id,
      updatedBranch,
    };

  }


  @Post('updateOrganizationalProfile')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logoPreviewBase64', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const orgId = req.cookies?.organization_id
            ? parseInt(decrypt(req.cookies.organization_id))
            : 'unknown';
          const timestamp = Date.now();
          const ext = extname(file.originalname);
          cb(null, `org-${orgId}-${timestamp}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new Error('Only PNG, JPG, JPEG, SVG files allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async updateOrgainzationProfileValues(
    @UploadedFile() logoFile: Express.Multer.File,
    @Body() payload: any,
    @Req() req,
  ) {
    console.log("payload", payload)
    let logoPath: string | null = null;
    // Option 1: Multer file
    if (logoFile) {
      logoPath = `/uploads/${logoFile.filename}`;
    }

    // Option 2: Base64 logo string
    else if (payload.logoPreviewBase64 && payload.logoPreviewBase64?.startsWith('data:image')) {
      const matches = payload.logoPreviewBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1]; // e.g. png, jpeg
        const base64Data = matches[2];
        const orgId = req.cookies?.organization_id
          ? parseInt(decrypt(req.cookies.organization_id))
          : 'unknown';
        const filename = `org-${orgId}-${Date.now()}.${ext}`;
        const uploadDir = join(process.cwd(), 'uploads');

        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = join(uploadDir, filename);
        writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        logoPath = `/uploads/${filename}`;
      }
    }

    // Replace logo field in payload
    payload.logo = logoPath;
    console.log("payload.logo", payload.logo)
    // Continue with your mapped payload...
    const mappedpayload = {
      organization_profile_id: payload.organization_profile_id,
      user_id: payload.user_id,
      organization_name: payload.organizationName,
      industry_type_name: payload.industryType,
      gst_no: payload.gstNumber,
      mobile_number: payload.contactNumber,
      email: payload.email,
      website_url: payload.website,
      financial_year: payload.financialYear,
      base_currency: payload.baseCurrency,
      dateformat: payload.dateFormat,
      time_zone: payload.timeZone,
      landmark: payload.hqAddressFields?.landmark,
      street: payload.hqAddressFields?.street,
      city: payload.hqAddressFields?.city,
      state: payload.hqAddressFields?.state,
      pincode: payload.hqAddressFields?.postalCode,
      country: payload.hqAddressFields?.country,
      organization_location_name: payload.hqAddress,
      organization_address: payload.hqAddress,
      established_date: payload.establishedDate ? new Date(payload.establishedDate) : undefined,
      users_designation: payload.designation_id,
      users_first_name: payload.primaryContactName?.split(' ')[0],
      users_middle_name: payload.primaryContactName?.split(' ')[1] ?? '',
      users_last_name: payload.primaryContactName?.split(' ')[2] ?? '',
      users_business_email: payload.primaryContactEmail,
      users_phone_number: payload.primaryContactPhone,
      billingContactName: payload.billingContactName,
      billingContactEmail: payload.billingContactEmail,
      billingContactPhone: payload.billingContactPhone,
      org_profile_image_address: payload.logo,
      logo: logoPath,
      themeMode: payload.themeMode,
      customThemeColor: payload.customThemeColor,
    };

    const organizationID = req.cookies.organization_id;
    const decryptedOrgId = decrypt(organizationID);
    if (!decryptedOrgId) {
      throw new Error('Organization ID not found in cookies');
    }

    const organization_Id = Number(decryptedOrgId);
    if (isNaN(organization_Id)) {
      throw new Error('Invalid decrypted organization ID');
    }

    const result = await this.organizationService.updateOrgainzationProfileValues(
      mappedpayload,
      organization_Id,
    );

    return {
      statusCode: 200,
      message: 'Update successful',
      data: result,
    };
  }

  @Post('get-branch-by-id')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getBranchById(@Body() body: GetBranchByIdDto) {
    const { branch_id } = body;

    if (!branch_id) {
      throw new Error('Branch ID is required');
    }

    const branch = await this.organizationService.getBranchById(branch_id);

    return {
      success: true,
      message: 'Branch fetched successfully',
      data: branch,
    };
  }

  @Post('delete-branch-by-id')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteBranchById(@Body() payload: any) {
    return await this.organizationService.deleteBranchById(payload);
  }

  @Get('fetchCount')
  async getCounts() {
    return this.organizationService.getCounts();
  }



  @Post('fetch-single-vendor-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleVendorsData(
    @Body() body: { vendor_id: number },
    @Res() res: Response,
  ) {
    const vendorId = Number(body.vendor_id);

    if (!vendorId) {
      return res.status(400).json({ status: 400, message: 'Vendor ID is required' });
    }

    const response = await this.organizationService.fetchSingleVendorsData(vendorId);
    return res.status(response.status).json(response);
  }

  @Get('getOrganizationVendors')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationVendors(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.organizationService.fetchOrganizationVendors();
      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  // vender

  @Post('getOrganizationVendors1')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationVendors1(
    @Body() body: {
      gststatus?: string;
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationService.fetchOrganizationVendors1(body);

      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  // Add Vender
  @Post('insert-new-vendor')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createNewVendor(
    @Body() createvendorpayload: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      const decrypted_system_user_id = decrypt(system_user_id.toString());

      const userId = await this.organizationService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );

      const result = await this.organizationService.createNewVendor(
        createvendorpayload,
        +userId,
      );

      return res.status(result.status).json(result); // ✅ fixed
    } catch (error) {
      console.error('Error creating vendor:', error);
      return res.status(500).json({
        message: 'Failed to create vendor',
        error: error.message || error,
      });
    }
  }


  @Post('update-vendor-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateVendorData(
    @Body() updatepayload: any,
    @Req() req,
    @Res() res,
  ) {
    try {
      const updatedVendors =
        await this.organizationService.updateVendorData(updatepayload);

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Vendor updated successfully',
        data: updatedVendors.data,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }


  @Post('delete-vendor-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteVendorData(
    @Body() body: { vendor_ids: number[] },
    @Req() req,
    @Res() res,
  ) {
    console.log('Received vendor_ids:', body.vendor_ids);

    const deletedVendors = await this.organizationService.deleteVendorData(body);

    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Vendor deletion processed.',
      data: deletedVendors,
    });
  }

  @Post('activate-vendors')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async activateVendors(
    @Body() dto: VendorIdListDto,
    @Res() res: Response
  ) {
    const result = await this.organizationService.activateVendors(dto);
    return res.status(200).json(result); // ✅ Proper use of @Res
  }

  @Post('deactivate-vendors')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deactivateVendors(
    @Body() dto: VendorIdListDto,
    @Res() res: Response
  ) {
    const result = await this.organizationService.deactivateVendors(dto);
    return res.status(200).json(result); // ✅ Proper use of @Res
  }



  @Post('bulk-import-vendor')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async bulkCreateVendors(@Body() dtos: any[], @Req() req: any) {
    const system_user_id = req.cookies.system_user_id;
    const decrypted_system_user_id = decrypt(system_user_id.toString());

    if (decrypted_system_user_id) {
      const result = await this.organizationService.bulkCreateVendors(
        dtos,
        +decrypted_system_user_id,
      );

      return {
        statusCode: result.status,
        message: result.message,
        data: result.data,
      };
    } else {
      return {
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing user ID.',
        data: null,
      };
    }
  }

  @Post('export-organization-vendors')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportOrganizationVendorsExcel(
    @Res() res: Response,
    @Body() body: {
      gststatus?: string;
      status?: string;
      search?: string;
      sortField?: string;
      sortOrder?: 'ASC' | 'DESC';
      selectedIds?: number[]; // Optional: selected vendor_id's
    },
  ) {
    const buffer = await this.organizationService.exportOrganizationVendorsExcel(body);

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=organization-vendors-${dateStamp}.xlsx`,
    });

    res.end(buffer);
  }

  // Location
  @Post('get-all-organization-locations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getAllOrganiationLocation(
    @Body() body: {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.organizationService.getAllAssetsLocations(body);
      return res.status(200).json({
        result,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });
    }
  }

  @Post('export-locations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportLocationsExcel(
    @Res() res: Response,
    @Body() body: {
      status?: 'active' | 'inactive'; // Optional: filter by status
      search?: string; // Optional: search keyword
      sortField?: string; // Optional: sorting field
      sortOrder?: 'ASC' | 'DESC'; // Optional: sorting order
      selectedIds?: number[]; // Optional: selected location_ids
    },
  ) {
    const buffer = await this.organizationService.exportLocationsExcel(body);

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=locations-${dateStamp}.xlsx`,
    });

    res.end(buffer);
  }

  @Post("get-locations-by-id")
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getLocationById(
    @Body() body: { location_id: number },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {

      const { location_id } = body;

      console.log("location_id", location_id);

      const result = await this.organizationService.getLocationById(+location_id);

      return res.status(200).json({
        result
      });

    } catch (error) {

      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error.',
      });

    }
  }

  @Post("delete-locations-by-id")
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteLocations(
    @Body() body: { location_id: number[] | number },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const system_user_id = req.cookies.system_user_id;
      const userId = decrypt(system_user_id.toString());

      const ids: number[] = Array.isArray(body.location_id)
        ? body.location_id
        : [body.location_id];

      const result = await this.organizationService.deleteLocationsById(ids, +userId);

      return res.status(200).json({
        statusCode: 200,
        message: `Deleted ${result.deletedIds.length} location(s) successfully`,
        deletedIds: result.deletedIds,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || "Internal server error.",
      });
    }
  }

  @Post('create-new-location')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async addNewLocation(
    @Body() createnewlocationpayload: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {

      console.log("createnewlocationpayload", createnewlocationpayload)
      const system_user_id = req.cookies.system_user_id;
      const decrypted_system_user_id = decrypt(system_user_id.toString());

      const userId = await this.organizationService.getUserByPublicID(
        Number(decrypted_system_user_id),
      );

      const result = await this.organizationService.addNewLocation(
        createnewlocationpayload,
        +userId,
      );

      return res.status(200).json(result);

    } catch (error) {

      console.error('Error creating vendor:', error);
      return res.status(500).json({
        message: 'Failed to create vendor',
        error: error.message || error,
      });
    }
  }

  @Post('update-location')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateLocation(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const { location_id, ...payload } = body; // flat destructure

      const system_user_id = req.cookies.system_user_id;
      const decrypted_system_user_id = decrypt(system_user_id.toString());

      const userId = await this.organizationService.getUserByPublicID(Number(decrypted_system_user_id));

      const result = await this.organizationService.updateLocation(
        { ...payload, location_id },
        +userId,
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error updating location:', error);
      return res.status(500).json({
        message: 'Failed to update location',
        error: error.message || error,
      });
    }
  }


  @Post('activate-locations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async activateLocations(
    @Body() body: { location_ids: number[] },
    @Res() res: Response
  ) {
    try {
      if (!body?.location_ids || !Array.isArray(body.location_ids) || body.location_ids.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'location_ids must be a non-empty array',
        });
      }

      const result = await this.organizationService.activateLocations(body);

      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Error activating locations:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to activate locations',
        error: error.message || error,
      });
    }
  }


  @Post('deactivate-locations')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deactivateLocations(
    @Body() body: { location_ids: number[] },
    @Res() res: Response
  ) {
    try {
      if (!body?.location_ids || !Array.isArray(body.location_ids) || body.location_ids.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'location_ids must be a non-empty array',
        });
      }

      const result = await this.organizationService.deactivateLocations(body);

      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Error deactivating locations:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to deactivate locations',
        error: error.message || error,
      });
    }
  }


  // BRANCHES NEW APIS
  
  // Users Updated Apis
  @Get('getOrganizationUsers')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchOrganizationUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('customFilters') customFiltersStr?: string,
  ) {
    console.log(
      'controller page limit search customFilters sortField sortOrder',
      page,
      limit,
      search,
      customFiltersStr,
      sortField,
      sortOrder,
    );

    try {
      let customFilters: Record<string, any> = {};
      if (customFiltersStr) {
        try {
          customFilters = JSON.parse(customFiltersStr);
        } catch (err) {
          throw new BadRequestException('Invalid JSON in customFilters parameter');
        }
      }

      // Don't put sortOrder inside customFilters anymore — pass separately
      const response = await this.organizationService.fetchOrganizationUsers({
        page,
        limit,
        search,
        customFilters,
        sortField,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });


      return {
        success: true,
        message: response.message,
        data: response.data,
        meta: response.meta,   // send the meta object as is
      };

    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching users',
        error: error.message,
      };
    }
  }
  
  @Post('fetch-single-user-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleUsersData(
    @Body() body: { user_id: number },
    @Res() res: Response,
  ) {

    const { user_id } = body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }


    const response =
      await this.organizationService.fetchSingleUsersData(+user_id);
    return res.status(response.status).json(response);


  }
  

  @Post('insert-new-user')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async createNewUser(@Body() payload: any, @Req() req: any) {

    console.log("payload", payload)

    const organizationID = req.cookies.organization_id;

    const encryptedorganizationID = decrypt(organizationID);

    if (!encryptedorganizationID) {
      throw new Error('Orgnaization ID not found in cookies');
    }

    const organization_Id = Number(encryptedorganizationID);

    if (isNaN(organization_Id)) {
      throw new Error('Invalid decrypted user ID');
    }

    const system_user_id = req.cookies.system_user_id;

    if (!system_user_id) {
      return {
        status: 401,
        message: 'Unauthorized: No user ID found',
      };
    }

    const decrypted_system_user_id = decrypt(system_user_id.toString());

    const newUser = await this.organizationService.createNewUser(
      payload,
      organization_Id,
      decrypted_system_user_id,
    );

    console.log('newUser :- ', newUser);

    return newUser;
  }
  
  @Post('update-user-management-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateUserManagementData(
    @Body() payload: any,
    @Req() req,
    @Res() res,
  ) {
    console.log("payload", payload);
    
    try {
      const updatedUser =
        await this.organizationService.updateUserManagementData(payload);

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'User updated successfully',
        data: updatedUser.data,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
  
  
  @Post('activate-users')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async activateUsers(
    @Body() body: { userIds: number[] },
    @Res() res: Response,
    @Req() req: any
  ) {
    // console.log("activate-users", body);
    const user_ids = body.userIds;
    const system_user_id = req.cookies.system_user_id;
    
    if (!system_user_id) {
      return {
        status: 401,
        message: 'Unauthorized: No user ID found',
      };
    }

    const decrypted_system_user_id = decrypt(system_user_id.toString());
    // console.log("activate-users", user_ids);
    try {
      
      if (!user_ids|| user_ids.length === 0) {
        
        return res.status(HttpStatus.BAD_REQUEST).json({
              status: 'error',
              message: 'user_ids must be a non-empty array',
          });
      
      }
      
      const result = await this.organizationService.activateUsers(user_ids, +decrypted_system_user_id);
      return res.status(HttpStatus.OK).json(result);
      
    } catch (error) {
      
      console.error('Error activating users:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Failed to activate users',
          error: error.message || error,
        });
      
    }
    
  }
  
  
  @Post('deactivate-users')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deactivateUsers(
    @Body() body: { userIds: number[] },
    @Res() res: Response,
    @Req() req: any
  ) {
    // console.log("activate-users", body);
    const user_ids = body.userIds;
    const system_user_id = req.cookies.system_user_id;

    if (!system_user_id) {
      return {
        status: 401,
        message: 'Unauthorized: No user ID found',
      };
    }

    const decrypted_system_user_id = decrypt(system_user_id.toString());
    console.log("deactivate-users", user_ids);
    try {

      if (!user_ids || user_ids.length === 0) {

        return res.status(HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'user_ids must be a non-empty array',
        });

      }

      const result = await this.organizationService.deactivateUsers(user_ids, +decrypted_system_user_id);
      return res.status(HttpStatus.OK).json(result);

    } catch (error) {

      console.error('Error deactivating users:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to deativate users',
        error: error.message || error,
      });

    }

  }
  
  @Post('delete-user-management-data')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async deleteUserManagementData(
    @Body() body: { userIds: number[] | number },
    @Req() req,
    @Res() res,
  ) {
    const userIds = Array.isArray(body.userIds) ? body.userIds : [body.userIds];
    const result = await this.organizationService.deleteUserManagementData(userIds);
    return res.status(HttpStatus.OK).json(result);
  }
  
  @Post('export-users-excel')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async exportUsersToExcel(
    @Res() res: Response,
    @Body() body: {
      search?: string;
      sortField?: string;
      sortOrder?: 'ASC' | 'DESC';
      customFilters?: Record<string, any>;
      selectedIds?: number[];
    },
  ) {
    
    const buffer = await this.organizationService.exportFilteredExcelForUsers(body);

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=users-${dateStamp}.xlsx`,
    });

    res.end(buffer);
    
  }
  
  
  @Post('reset-password-by-admin')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async resetPasswordByAdmin(@Query('userId') userId: number, @Req() req: any) {
    
    const system_user_id = req.cookies.system_user_id;
    const decrypted_system_user_id = decrypt(system_user_id.toString());
    if (!decrypted_system_user_id) {
      throw new UnauthorizedException('Invalid session');
    }

    return await this.organizationService.sendResetPasswordEmailByAdmin(
      Number(userId),
      Number(decrypted_system_user_id),
    );
    
  }
  
  
  // pincodes
  @Get('get-pincode-state-city')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async getByPincode(@Query('pincode') pincode: string) {
    return this.organizationService.findByPincode(pincode);
  }
  
  //
    @Post('asset-org-subscription-details')
  async getAssetOrgSubscriptionDetails(@Body() body: { userId: number; orgId: number }, @Res() res: Response) {
    try {
      const { userId, orgId } = body;
  
      if (!userId || !orgId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'userId or orgId is missing in request',
        });
      }
  
      // ✅ Fetch subscription details using orgId
      const data = await this.organizationService.getSubscriptionDetailsByOrganizationAsset(orgId);
  
      if (!data) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'No subscription found for this organization',
        });
      }
  
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched subscription details successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch subscription details',
      });
    }
  }
  
  
    // Payment Modes
    @Get('payment-modes')
    async getAllPaymentModes(@Res() res: Response) {
      try {
        const data = await this.organizationService.getAllPaymentModes();
  
        return res.status(HttpStatus.OK).json({
          success: true,
          message: 'Fetched payment modes successfully',
          data,
        });
      } catch (error) {
        console.error('Error fetching payment modes:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message || 'Failed to fetch payment modes',
        });
      }
    }
  
  
    @Post('payment-request')
  async createOfflinePaymentRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    try {
      const { user_id } = body;

      if (!user_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const requestData = await this.organizationService.createOfflinePaymentRequest(
        user_id,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Offline payment request submitted successfully',
        data: requestData,
      });
    } catch (error) {
      console.error('Error creating offline payment request:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create offline payment request',
      });
    }
  }
  
  
    @Post('create-payment')
    async createPayment(
      @Body() payload: CreatePaymentDto,
      @Res() res: Response,
      @Req() req,
    ) {
      try {
        const result = await this.organizationService.createPayment(payload); // assuming req.user.id is logged-in user add , req.user.id it if required
        return res.status(HttpStatus.CREATED).json({
          success: true,
          message: 'Payment processed successfully',
          data: result,
        });
      } catch (error) {
        console.error('Payment creation failed:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message || 'Failed to process payment',
        });
      }
    }


@Get('get-all-users')
async getOrganizationUsers(
  @Res() res: Response,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search?: string,
  @Query('status') status?: string,
 
  
) {
  try {
    const users = await this.organizationService.getAllUsers(
      Number(page),
      Number(limit),
      search,
      status,
 
    );

    return res.status(HttpStatus.OK).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
}


@Get('getAllUsersWithOrganization')
@UseGuards(ApiKeyGuard, JwtAuthGuard)
async getAllUsersWithOrganization(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search: string = '',
  @Query('status') status: 'All' | 'Active' | 'Inactive' = 'All',
) {
  try {
    return await this.organizationService.getAllUsersWithOrganization(
      Number(page),
      Number(limit),
      search,
      status,
    );
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error fetching users',
    };
  }
}


}
