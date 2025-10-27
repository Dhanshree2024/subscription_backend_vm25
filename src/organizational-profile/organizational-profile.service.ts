import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, ILike, In, Like, Not, Repository } from 'typeorm';
import { OrganizationalProfile } from './entity/organizational-profile.entity';
import { DatabaseService } from '../dynamic-schema/database.service'; // Inject the DatabaseService
import { IndustryTypes } from './public_schema_entity/industry-types.entity';
import { DepartmentConifg } from './public_schema_entity/department-config.entity';
import { DesignationsConfig } from './public_schema_entity/designations-config.entity';
import { User } from './entity/organizational-user.entity'; // Import User entity
import { promises } from 'dns';
import { CreateDepartmentsDto } from './dto/department.dto';
import { CreateDesignationDto } from './dto/designation.dto';
import { Department } from './entity/department.entity';
import { exit } from 'process';
import { Branch } from './entity/branches.entity';
import { OrganizationVendors } from './entity/organizational-vendors.entity';
import { Designations } from './entity/designations.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
import { RegisterOrganization } from 'src/organization_register/entities/register-organization.entity';
import * as nodemailer from 'nodemailer';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUsersDto } from './dto/user-delete.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { DeleteVendorsDto } from './dto/vendor-delete.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UpdateOrganizationalProfileDto } from './dto/create-organizational-profile.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { create } from 'domain';
import { UserRepository } from 'src/user/user.repository';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { MailService } from 'src/common/mail/mail.service';
import { MailConfigService } from 'src/common/mail/mail-config.service';
import { EmailTemplate, renderEmail } from 'src/common/mail/render-email';
import { AuthService } from 'src/auth/auth.service';
import * as XlsxPopulate from 'xlsx-populate';
import { Roles } from './entity/roles.entity';
import { DeleteDepartmentsDto } from './dto/delete-department-dto';
import { FetchSingleVendorDto } from './dto/fetch-single-vendor.dto';
import { FetchSingleUserDto } from './dto/fetch-single-user.dto';
import { DeleteDesignationsDto } from './dto/delete-degination-dto';
import { EditDepartmentDto } from './dto/update-dept.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BranchResponseDTO } from './dtos/branch-response-dto';
import { VendorIdListDto } from './dtos/vendor-id-list.dto';
import { Locations } from './entity/locations.entity';
import { Pincodes } from './public_schema_entity/pincode.entity';
import { RolesPermission } from 'src/roles_permissions/entities/roles_permission.entity';

import { Plan } from 'src/subscription_pricing/entity/plan.entity';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';
import { PlanFeatureMapping } from 'src/subscription_pricing/entity/plan-feature-mapping.entity';
import { BillingInfo } from 'src/subscription_pricing/entity/billing_info.entity';
import { OfflinePaymentRequest } from 'src/subscription_pricing/entity/offline_payment_requests.entity';
import { PaymentMode } from 'src/subscription_pricing/entity/payment_mode.entity';
import { CreatePaymentDto } from 'src/subscription_pricing/dto/payment.dto';
import { PaymentTransaction } from 'src/subscription_pricing/entity/payment_transaction.entity';


@Injectable()
export class OrganizationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly databaseService: DatabaseService,
    private readonly mailService: MailService,
    private readonly mailConfigService: MailConfigService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RegisterUserLogin)
    private readonly registerUser: Repository<RegisterUserLogin>,

    @InjectRepository(RegisterOrganization)
    private readonly registerOrganization: Repository<RegisterOrganization>,

    @InjectRepository(OrganizationVendors)
    private readonly vendorRepository: Repository<OrganizationVendors>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,

    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,

    @InjectRepository(RolesPermission)
    private readonly rolesPermissionRepository: Repository<RolesPermission>,

    @InjectRepository(Designations)
    private readonly designationsRepository: Repository<Designations>,

    @InjectRepository(Locations)
    private readonly locationRepository: Repository<Locations>,

    @InjectRepository(Pincodes)
    private readonly pincodesRepository: Repository<Pincodes>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(OrgSubscription)
    private readonly subscriptionRepository: Repository<OrgSubscription>,

    @InjectRepository(PlanFeatureMapping)
    private readonly planFeatureMappingRepository: Repository<PlanFeatureMapping>,

    @InjectRepository(PaymentMode)
    private readonly paymentModeRepository: Repository<PaymentMode>,

    @InjectRepository(BillingInfo)
    private billingInfoRepository: Repository<BillingInfo>,

    @InjectRepository(OfflinePaymentRequest)
    private offlinePaymentRepo: Repository<OfflinePaymentRequest>,

    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepository: Repository<PaymentTransaction>,

    // Inject the DatabaseService
  ) { }

  /**
   * Fetch organizational profiles with associated users.
   *
   * @param schemaName - The schema name for multi-tenancy.
   * @returns A promise resolving to an array of organizational profiles.
   */

  async getUserDropdown() {
    const users = await this.userRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    return users.map((user) => ({
      label: `${user.first_name} ${user.last_name}`,
      value: user.user_id,
    }));
  }

  async getCounts(): Promise<any> {
    const counts = {
      users: 0,
      assets: 0,
      departments: 0,
      branches: 0,
    };

    try {
      // Fetch user count
      const userCount = await this.dataSource
        .getRepository('users')
        .createQueryBuilder('user')
        .where('user.is_active = :isActive', { isActive: 1 })
        .getCount();
      counts.users = userCount;
    } catch (error) {
      console.error('Error fetching user count:', error.message);
      // If the error is related to a missing table, proceed with default count (0)
    }

    try {
      // Fetch department count
      const departmentCount = await this.dataSource
        .getRepository('departments')
        .createQueryBuilder('department')
        .where('department.is_active = :isActive', { isActive: true })
        .getCount();
      counts.departments = departmentCount;
    } catch (error) {
      console.error('Error fetching department count:', error.message);
    }

    try {
      // Fetch designation count
      const assetCount = await this.dataSource
        .getRepository('assets')
        .createQueryBuilder('asset')
        .where('asset.asset_is_active = :isActive', { isActive: 1 })
        .where('asset.asset_is_deleted = :isDeleted', { isDeleted: 0 })
        .getCount();
      counts.assets = assetCount;
    } catch (error) {
      console.error('Error fetching designation count:', error.message);
    }

    try {
      // Fetch branch count
      const branchCount = await this.dataSource
        .getRepository('branches')
        .createQueryBuilder('branch')
        .where('branch.is_active = :isActive', { isActive: true })
        .getCount();
      counts.branches = branchCount;
    } catch (error) {
      console.error('Error fetching branch count:', error.message);
    }

    return {
      status: 'success',
      message: 'Counts retrieved successfully.',
      data: counts,
    };
  }


  async updateOrgainzationProfileValues(
    dto: UpdateOrganizationalProfileDto,
    organization_Id: number,
  ) {

    const {
      alternative_contact,
      mobile_number,
      established_date,
      organization_profile_id,
      user_id,
      ...updates
    } = dto;

    console.log('dto', dto);
    // Fetch organization profile row by ID
    const organization = await this.dataSource
      .getRepository(OrganizationalProfile)
      .findOne({
        where: { tenant_org_id: organization_Id },
      });

    // console.log("organization_profile_id :" + organization_profile_id);
    // console.log("organization_Id :" +organization_Id);
    // exit();
    if (!organization) {
      throw new Error('Organization profile not found.');
    }

    organization.mobile_number = mobile_number;
    if (established_date) {
      organization.established_date = new Date(established_date);
    }

    const updatedUser = await this.dataSource
      .getRepository(OrganizationalProfile)
      .save(organization);
    // Apply updates to the organization profile
    const orgUpdates = [
      'organization_name',
      'industry_type_name',
      'gst_no',
      'pan_number',
      'mobile_number',
      'org_alt_contact_number',
      'email',
      // 'organization_address',
      // 'organization_location_name',
      'website_url',
      'financial_year',
      'esi_number',
      'pf_number',
      'lin_number',
      'tan_number',
      'base_currency',
      'time_zone',
      'city',
      'pincode',
      'state',
      'dateformat',
      'alternative_contact',
      // 'organization_email',
      'established_date',
      'street',
      'landmark',
      'billingContactName',
      'billingContactEmail',
      'billingContactPhone',
      'customThemeColor',
      'themeMode',
      'logo'
    ];
    for (const key of orgUpdates) {
      if (updates[key] !== undefined && updates[key] !== '') {
        organization[key] = updates[key];
      }
    }


    // organization.up = new Date();
    await this.dataSource
      .getRepository(OrganizationalProfile)
      .save(organization);

    return {
      message: 'Organization profile and user data updated successfully.',
      organization,
    };
  }

  async fetchIndustryTypes(): Promise<any> {
    try {
      const result = await this.dataSource
        .getRepository(IndustryTypes)
        .createQueryBuilder('industry')
        .where('industry.is_active = :isActive', { isActive: true })
        .andWhere('industry.is_deleted = :isDeleted', { isDeleted: false })
        .getMany();

      if (!result || result.length === 0) {
        throw new BadRequestException(
          'No organizational profiles found with the specified criteria.',
        );
      }

      // Format the response for REST API
      return {
        status: 'success',
        message: 'Industry types retrieved successfully.',
        data: result,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching industry types: ${error.message}`,
      );
    }
  }

  // get single plan with details
  async getPlanWithFeaturesById(planId: number): Promise<any> {
    try {
      const plan = await this.planRepository
        .createQueryBuilder('plan')
        .leftJoinAndSelect('plan.featureMappings', 'mapping')
        .leftJoinAndSelect('mapping.feature', 'feature')
        .leftJoinAndSelect('plan.billings', 'billing')
        .where('plan.plan_id = :planId', { planId })
        .andWhere('plan.is_active = :active', { active: true })
        .orderBy('feature.feature_name', 'ASC')
        .getOne();

      if (!plan) return null;

      // Transform to clean response
      return {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        description: plan.description,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
        is_active: plan.is_active,
        is_deleted: plan.is_deleted,
        billing: plan.billings?.[0] ?? null,
        featureMappings: plan.featureMappings.map(mapping => ({
          mapping_id: mapping.mapping_id,
          plan_id: mapping.plan_id,
          feature_id: mapping.feature_id,
          feature_value: mapping.feature_value,
          status: mapping.status,
          created_at: mapping.created_at,
          updated_at: mapping.updated_at,
          feature: {
            feature_id: mapping.feature.feature_id,
            feature_name: mapping.feature.feature_name,
            description: mapping.feature.description,
            created_at: mapping.feature.created_at,
            updated_at: mapping.feature.updated_at,
            is_active: mapping.feature.is_active,
            is_deleted: mapping.feature.is_deleted,
            default_value: mapping.feature.default_value,
          },
        })),
      };
    } catch (error) {
      console.error('Error fetching plan with features:', error);
      throw new Error('Failed to fetch plan with features');
    }
  }
//
async getPlansWithFeaturesByProducts(productId: number): Promise<any[]> {
  try {
    const plans = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.featureMappings', 'mapping')
      .leftJoinAndSelect('mapping.feature', 'feature')
      .leftJoinAndSelect('plan.billings', 'billing')
      .where('plan.is_active = :active', { active: true })
      .andWhere('plan.product_id = :productId', { productId }) // filter by product
      .orderBy('plan.plan_name', 'ASC')
      .addOrderBy('feature.feature_name', 'ASC')
      .getMany();

    // Transform to clean response
    return plans.map(plan => ({
      plan_id: plan.plan_id,
      plan_name: plan.plan_name,
      description: plan.description,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      is_active: plan.is_active,
      is_deleted: plan.is_deleted,
      set_trial: plan.set_trial,
      billing: plan.billings?.[0] ?? null,
      featureMappings: plan.featureMappings.map(mapping => ({
        mapping_id: mapping.mapping_id,
        plan_id: mapping.plan_id,
        feature_id: mapping.feature_id,
        feature_value: mapping.feature_value,
        status: mapping.status,
        created_at: mapping.created_at,
        updated_at: mapping.updated_at,
        feature: {
          feature_id: mapping.feature.feature_id,
          feature_name: mapping.feature.feature_name,
          description: mapping.feature.description,
          created_at: mapping.feature.created_at,
          updated_at: mapping.feature.updated_at,
          is_active: mapping.feature.is_active,
          is_deleted: mapping.feature.is_deleted,
          default_value: mapping.feature.default_value,
        },
      })),
    }));
  } catch (error) {
    console.error('Error fetching plans with features by product:', error);
    throw new Error('Failed to fetch plans with features by product');
  }
}

  // All plans with feature
  async getAllPlansWithFeatures(): Promise<any[]> {
    try {
      const plans = await this.planRepository
        .createQueryBuilder('plan')
        .leftJoinAndSelect('plan.featureMappings', 'mapping')
        .leftJoinAndSelect('mapping.feature', 'feature')
        .leftJoinAndSelect('plan.billings', 'billing') // fetch billing info
        .where('plan.is_active = :active', { active: true })
        .orderBy('plan.plan_name', 'ASC')
        .addOrderBy('feature.feature_name', 'ASC')
        .getMany();

      // Transform to clean response
      const transformed = plans.map(plan => ({
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        description: plan.description,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
        is_active: plan.is_active,
        is_deleted: plan.is_deleted,
        set_trial: plan.set_trial,
        billing: plan.billings?.[0] ?? null, // take first billing record (monthly/yearly)
        featureMappings: plan.featureMappings.map(mapping => ({
          mapping_id: mapping.mapping_id,
          plan_id: mapping.plan_id,
          feature_id: mapping.feature_id,
          feature_value: mapping.feature_value,
          status: mapping.status,
          created_at: mapping.created_at,
          updated_at: mapping.updated_at,
          feature: {
            feature_id: mapping.feature.feature_id,
            feature_name: mapping.feature.feature_name,
            description: mapping.feature.description,
            created_at: mapping.feature.created_at,
            updated_at: mapping.feature.updated_at,
            is_active: mapping.feature.is_active,
            is_deleted: mapping.feature.is_deleted,
            default_value: mapping.feature.default_value,
          },
        })),
      }));

      return transformed;
    } catch (error) {
      console.error('Error fetching all plans with features:', error);
      throw new Error('Failed to fetch all plans with features');
    }
  }


  // Get all plans with features for a specific product
  async getPlansWithFeaturesByProduct(productId: number): Promise<any[]> {
    try {
      const plans = await this.planRepository
        .createQueryBuilder('plan')
        .leftJoinAndSelect('plan.featureMappings', 'mapping')
        .leftJoinAndSelect('mapping.feature', 'feature')
        .leftJoinAndSelect('plan.billings', 'billing') // fetch billing info
        .leftJoinAndSelect('plan.product', 'product')  // include product info if needed
        .where('plan.is_active = :active', { active: true })
        .andWhere('plan.productId = :productId', { productId }) // filter by product
        .orderBy('plan.plan_name', 'ASC')
        .addOrderBy('feature.feature_name', 'ASC')
        .getMany();

      // Transform to clean response
      const transformed = plans.map(plan => ({
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        description: plan.description,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
        is_active: plan.is_active,
        is_deleted: plan.is_deleted,
        set_trial: plan.set_trial,
        product: plan.product ? {
          product_id: plan.product.productId,
          product_name: plan.product.name,
        } : null,
        billing: plan.billings?.[0] ?? null, // take first billing record (monthly/yearly)
        featureMappings: plan.featureMappings.map(mapping => ({
          mapping_id: mapping.mapping_id,
          plan_id: mapping.plan_id,
          feature_id: mapping.feature_id,
          feature_value: mapping.feature_value,
          status: mapping.status,
          created_at: mapping.created_at,
          updated_at: mapping.updated_at,
          feature: {
            feature_id: mapping.feature.feature_id,
            feature_name: mapping.feature.feature_name,
            description: mapping.feature.description,
            created_at: mapping.feature.created_at,
            updated_at: mapping.feature.updated_at,
            is_active: mapping.feature.is_active,
            is_deleted: mapping.feature.is_deleted,
            default_value: mapping.feature.default_value,
          },
        })),
      }));

      return transformed;
    } catch (error) {
      console.error('Error fetching plans with features by product:', error);
      throw new Error('Failed to fetch plans with features by product');
    }
  }

  async fetchDesignationsconfig(): Promise<any> {
    try {
      const result = await this.dataSource
        .getRepository(DesignationsConfig)
        .createQueryBuilder('designationsconfig')
        .where('designationsconfig.is_active = :isActive', { isActive: true })
        .andWhere('designationsconfig.is_deleted = :isDeleted', {
          isDeleted: false,
        })
        .getMany();

      if (!result || result.length === 0) {
        throw new BadRequestException(
          'No organizational profiles found with the specified criteria.',
        );
      }

      // Format the response for REST API
      return {
        status: 'success',
        message: 'Industry types retrieved successfully.',
        data: result,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching industry types: ${error.message}`,
      );
    }
  }

  async createDesignations(
    CreateDesignationDto: CreateDesignationDto,
  ): Promise<any> {
    const {
      newDesignationNames = [],
      existingDesignationNames = [],
      departmentId,
      desg_description,
    } = CreateDesignationDto;

    // ✅ Trim names
    const trimmedNewNames = newDesignationNames.map((name) => name.trim());
    const trimmedExistingNames = existingDesignationNames.map((name) =>
      name.trim(),
    );

    const designationNamesToProcess = [
      ...trimmedExistingNames,
      ...trimmedNewNames,
    ];

    if (designationNamesToProcess.length === 0) {
      return { success: false, message: 'No designations provided' };
    }

    try {
      const designationsRepository = this.dataSource.getRepository(Designations);
      const departmentRepository = this.dataSource.getRepository(Department);

      // 🔍 Get all designations from DB
      const allDesignations = await designationsRepository.find();
      const existingNamesInDb = allDesignations.map((des) =>
        des.designation_name.trim().toLowerCase(),
      );

      // ❌ Avoid duplicates (in DB or request)
      const seen = new Set<string>();
      const newDesignationsToSave = designationNamesToProcess
        .filter((name) => {
          const lowerTrimmed = name.toLowerCase();
          const isDuplicate =
            existingNamesInDb.includes(lowerTrimmed) || seen.has(lowerTrimmed);
          if (!isDuplicate) seen.add(lowerTrimmed);
          return !isDuplicate;
        })
        .map((name) => ({
          designation_name: name.trim(),
          parent_department: departmentId || null,
          desg_description: desg_description?.trim() || '',
        }));

      let savedDesignations = [];

      if (newDesignationsToSave.length > 0) {
        savedDesignations = await designationsRepository.save(newDesignationsToSave);

        // ✅ Also update department's linked_designations if departmentId is passed
        if (departmentId) {
          const department = await departmentRepository.findOne({
            where: { departmentId },
          });

          if (department) {
            const currentLinked = Array.isArray(department.linked_designations)
              ? department.linked_designations
              : [];

            const newIds = savedDesignations.map((des) => des.designation_id);
            const updatedIds = Array.from(new Set([...currentLinked, ...newIds]));

            department.linked_designations = updatedIds;
            await departmentRepository.save(department);
          }
        }
      }

      if (savedDesignations.length > 0) {
        return {
          success: true,
          message: 'New designations added',
          data: savedDesignations,
        };
      } else {
        return { success: false, message: 'All designations already exist' };
      }
    } catch (error) {
      console.error('Error saving designations:', error);
      throw new BadRequestException('Error saving designations.');
    }
  }


  async editDesignation(
    designationId: number,
    newName: string,
    newDescription: string,
    departmentId: number,
  ): Promise<any> {
    if (!designationId || !newName?.trim()) {
      throw new BadRequestException('Invalid designation ID or name');
    }

    const designationRepo = this.dataSource.getRepository(Designations);
    const departmentRepo = this.dataSource.getRepository(Department);

    console.log('📥 Incoming:', { designationId, newName, departmentId });

    const existing = await designationRepo.findOneBy({ designation_id: designationId });
    if (!existing) throw new BadRequestException('Designation not found');

    const nameExists = await designationRepo
      .createQueryBuilder('d')
      .where('LOWER(d.designation_name) = LOWER(:name)', { name: newName.trim() })
      .andWhere('d.designation_id != :id', { id: designationId })
      .getOne();
    if (nameExists) throw new BadRequestException('Designation name already in use');

    // 🛡️ Only remove if department is different
    if (
      existing.parent_department &&
      existing.parent_department !== departmentId
    ) {
      console.log('🔁 Removing from previous dept:', existing.parent_department);
      await departmentRepo
        .createQueryBuilder()
        .update()
        .set({
          linked_designations: () =>
            `(SELECT jsonb_agg(e) FROM jsonb_array_elements(linked_designations) e WHERE e::text != '${designationId}')`,
        })
        .where('department_id = :prevDeptId', { prevDeptId: existing.parent_department })
        .execute();
    }

    // ✅ Add to new department
    if (departmentId) {
      const targetDept = await departmentRepo.findOneBy({ departmentId });
      if (!targetDept) throw new BadRequestException('Target department not found');

      const existingLinks = Array.isArray(targetDept.linked_designations)
        ? targetDept.linked_designations
        : [];

      // 🔒 Clean all values and ensure only numbers
      const currentLinks = existingLinks
        .filter((id) => typeof id === 'number' && !isNaN(id))
        .map((id) => Number(id));

      console.log('🏢 Dept before:', targetDept.departmentId, currentLinks);

      if (!currentLinks.includes(designationId)) {
        targetDept.linked_designations = Array.from(
          new Set([...currentLinks, Number(designationId)]),
        );
        await departmentRepo.save(targetDept);
        console.log('✅ Saved new department with:', targetDept.linked_designations);
      } else {
        console.log('⚠️ Designation already in department, skipping add.');
      }

      existing.parent_department = departmentId;
    }

    existing.designation_name = newName.trim();
    existing.desg_description = newDescription?.trim() || null;

    const updated = await designationRepo.save(existing);

    console.log('✅ Final update:', updated);

    return {
      success: true,
      message: 'Designation updated successfully',
      data: updated,
    };
  }





  async deleteDepartments(deleteDepartmentsDto: DeleteDepartmentsDto) {
    const { departmentIds } = deleteDepartmentsDto;

    if (!departmentIds.length) {
      throw new BadRequestException('No department IDs provided');
    }

    const departmentRepository = this.dataSource.getRepository(Department);

    const departments = await departmentRepository.findBy({
      departmentId: In(departmentIds),
    });

    if (!departments.length) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: 'No matching departments found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Perform soft delete
    departments.forEach((dept) => {
      dept.active = false;
      dept.deleted = true;
    });

    await departmentRepository.save(departments);

    return {
      status: HttpStatus.OK,
      message: `${departments.length} department(s) have been deactivated and marked as deleted`,
    };
  }

  async deleteDesignation(deleteDesignationDto: DeleteDesignationsDto) {
    const { designationIds } = deleteDesignationDto;

    if (!designationIds || !designationIds.length) {
      throw new BadRequestException('No designation IDs provided');
    }

    const designations = await this.designationsRepository.findBy({
      designation_id: In(designationIds),
    });

    if (!designations.length) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: 'No matching designations found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Perform soft delete
    designations.forEach((designation) => {
      designation.is_active = false;
      designation.is_deleted = true;
    });

    await this.designationsRepository.save(designations);

    return {
      status: HttpStatus.OK,
      message: `${designations.length} designation(s) have been deactivated and marked as deleted`,
    };
  }



  async fetchOrganizationDeparments(searchQuery: string = ''): Promise<any> {
    try {
      const rawResult = await this.dataSource
        .createQueryBuilder()
        .select('d.*')
        .addSelect('u.first_name', 'departmentHead_first_name')
        .addSelect('u.last_name', 'departmentHead_last_name')

        // 🧮 Department-level employee count
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(*)')
            .from(User, 'user')
            .where('user.department_id = d.department_id')
            .andWhere('user.is_active = 1')
            .andWhere('user.is_deleted = 0');
        }, 'employeeCount')

        // 🧾 Designation list with employee count per designation
        .addSelect((subQuery) => {
          return subQuery
            .select(`
            json_agg(
              json_build_object(
                'designation_id', des.designation_id,
                'designation_name', des.designation_name,
                'desg_description', des.desg_description,
                'parent_department', des.parent_department,
                'created_at', des.created_at,
                'updated_at', des.updated_at,
                'employee_count', (
                  SELECT COUNT(*)
                  FROM users usr
                  WHERE usr.designation_id = des.designation_id
                  AND usr.is_active = 1
                  AND usr.is_deleted = 0
                )
              )
            )
          `)
            .from(Designations, 'des')
            .where('des.parent_department = d.department_id')
            .andWhere('des.is_deleted = false')
            .andWhere('des.is_active = true');
        }, 'designations')

        .from(Department, 'd')
        .leftJoin('users', 'u', 'u.user_id = d.department_head_id')
        .where('d.is_active = true')
        .andWhere('d.is_deleted = false')
        .andWhere(searchQuery ? 'd.department_name ILIKE :search' : 'TRUE', {
          search: `%${searchQuery}%`,
        })
        .orderBy('d.department_name', 'ASC')
        .getRawMany();

      if (!rawResult || rawResult.length === 0) {
        throw new BadRequestException('No departments found.');
      }

      const result = rawResult.map((r) => ({
        departmentId: r.department_id,
        departmentName: r.department_name,
        dept_description: r.dept_description,
        departmentHeadId: r.department_head_id,
        departmentHeadName: [r.departmentHead_first_name, r.departmentHead_last_name].filter(Boolean).join(' '),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        deleted: r.is_deleted,
        active: r.is_active,
        employeeCount: Number(r.employeeCount) || 0,
        designationCount: Array.isArray(r.designations) ? r.designations.length : 0,
        designations: r.designations || [],
      }));

      return {
        status: 'success',
        message: 'Departments retrieved successfully.',
        data: result,
        pagination: {
          totalItems: result.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching departments: ${error.message}`,
      );
    }
  }







  async fetchOrganizationBranches1(): Promise<any> {
    try {
      const result = await this.dataSource
        .getRepository(Branch)
        .createQueryBuilder('branches')
        .leftJoinAndSelect('branches.primaryUser', 'primaryUser')
        .orderBy('branches.branch_name', 'ASC')
        .getMany();

      console.log('BRANCHES ', result);

      // Format the response for REST API
      return {
        status: 'success',
        message: 'Branches retrieved successfully.',
        data: result,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching Branches: ${error.message}`,
      );
    }
  }

  async fetchOrganizationBranches(): Promise<any> {
    try {

      const result = await this.dataSource
        .getRepository(Branch)
        .createQueryBuilder('branches')
        .where(
          'branches.is_active = :active AND branches.is_deleted = :deleted',
          {
            active: true,    // ✅ <-- You were missing this
            deleted: false,
          },
        )
        // .leftJoinAndSelect('branches.primaryUser', 'primaryUser')
        .orderBy('branches.branch_name', 'ASC')
        .getMany();

      return {
        status: 'success',
        message: 'Branches retrieved successfully.',
        data: result,
      };
    } catch (error) {
      console.error('Error in fetchOrganizationBranches', error);
      throw new BadRequestException(
        `Error fetching Branches: ${error.message}`,
      );
    }
  }


  async fetchOrganizationUsers1(
    page: number,
    limit: number,
    searchQuery: string,
  ): Promise<any> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(User)
        .createQueryBuilder('users')
        // .leftJoinAndSelect('users.user_branch', 'user_branch')
        .leftJoinAndSelect('users.user_role', 'user_role')
        .leftJoinAndSelect('users.user_designation', 'user_designation')
        .leftJoinAndSelect('users.user_department', 'user_department')
        .where('users.is_active = :isActive', { isActive: true })
        .andWhere('users.is_deleted = :isDeleted', { isDeleted: false });

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder.andWhere(
          `(users.first_name ILIKE :search OR users.middle_name ILIKE :search OR users.last_name ILIKE :search)`,
          { search: `%${searchQuery}%` },
        );
      }

      const [results, total] = await queryBuilder
        .orderBy('users.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        data: results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Error fetching Users: ${error.message}`);
    }
  }






  getFilterableUserColumns() {
    return [
      {
        key: 'branch_id',
        label: 'Branch',
        type: 'select',
        mandatory: false,
      },

      {
        key: 'department_id',
        label: 'Department',
        type: 'select',
        mandatory: false,
      },
      {
        key: 'created_at',
        label: 'Created At',
        type: 'date-range',
        mandatory: false,
      },
      // {
      //   key: 'is_active',
      //   label: 'Active Status',
      //   type: 'boolean',
      //   mandatory: false,
      // },
    ];
  }

  async getDepartmentDropdown() {
    const departments = await this.departmentRepository.find({
      where: { active: true, deleted: false },
    });

    return departments.map((dept) => ({
      label: dept.departmentName,
      value: dept.departmentId,
    }));
  }

  async getBranchDropdown() {
    const branches = await this.branchRepository.find({
      where: { is_active: true, is_deleted: false },
    });

    return branches.map((branch) => ({
      label: branch.branch_name,
      value: branch.branch_id,
    }));
  }

  async exportUserCSV() {
    try {
      const whereCondition = { is_active: 1, is_deleted: 0 };

      const [results, total] = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.user_branch', 'branch')
        .leftJoinAndSelect('user.user_department', 'department')
        .leftJoinAndSelect('user.user_designation', 'designation')
        .leftJoinAndSelect('user.added_by_user', 'added_by_user')
        .leftJoinAndSelect('user.user_role', 'role')
        .where(whereCondition)
        .orderBy('user.user_id', 'DESC')
        .getManyAndCount();

      const decodedResults = results.map((user) => ({
        ...user,
        // branch_name: user.user_branch?.branch_name || 'N/A',
        department_name: user.user_department?.departmentName || 'N/A',
        designation_name: user.user_designation?.designation_name || 'N/A',
        role_name: user.user_role?.role_name || 'N/A',
      }));

      return {
        decodedResults: decodedResults,
      };
    } catch (error) {
      console.error('Error in exportUserCSV:', error);
      throw new Error('An error occurred while fetching users.');
    }
  }

  async fetchOrganizationDesignation(searchQuery: string = ''): Promise<any> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(Designations)
        .createQueryBuilder('designation')
        .leftJoin('users', 'user', 'user.designation_id = designation.designation_id AND user.is_deleted = false')
        .leftJoin('designation.parentDepartment', 'parentDepartment')
        .select([
          'designation.designation_id',
          'designation.designation_name',
          'designation.desg_description',
          'designation.is_active',
          'designation.is_deleted',
          'designation.created_at',
          'designation.updated_at',
          'designation.parent_department',
          'parentDepartment.department_name', // <-- Add this line
          'COUNT(user.user_id) AS user_count',
        ])
        .where('designation.is_active = :isActive', { isActive: true })
        .andWhere('designation.is_deleted = :isDeleted', { isDeleted: false })
        .groupBy('designation.designation_id, parentDepartment.department_name'); // <-- Add dept groupBy

      if (searchQuery?.trim()) {
        queryBuilder.andWhere('designation.designation_name ILIKE :search', {
          search: `%${searchQuery}%`,
        });
      }

      const { raw, entities } = await queryBuilder
        .orderBy('designation.designation_name', 'ASC')
        .getRawAndEntities();
      console.log("queryBuilder raw", raw);
      console.log("queryBuilder entities", entities);

      const response = entities.map((designation, index) => ({
        ...designation,
        user_count: Number(raw[index]?.user_count || 0),
        parent_department_name: raw[index]?.department_name || null,
        created_at: raw[index]?.created_at || null,
        updated_at: raw[index]?.updated_at || null,
      }));

      console.log("RES DESIGNATION", response)
      return {
        status: 'success',
        message:
          response.length > 0
            ? 'Designation retrieved successfully.'
            : 'No designations found.',
        data: response,
        total: response.length,
      };

    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching designations: ${error.message}`,
      );
    }
  }

  // ===============================================================================
  async generateUserTemplate1() {
    try {
      const branches: any[] = await this.fetchOrganizationBranches();
      const departments: any[] = await this.fetchOrganizationDeparments();
      console.log('branches', branches); //
      // console.log('departments', departments);

      const designations: any[] = await this.fetchOrganizationDesignation();
      // console.log('designations', designations);

      const roles: any[] = await this.fetchOrganizationDesignation();
      // console.log('roles', roles);

      const workbook = await XlsxPopulate.fromBlankAsync();
      const mainSheet = workbook.sheet(0);
      mainSheet.name('user_template');
      const dataSheet = workbook.addSheet('Data');

      const headers = [
        'First Name',
        'Middle Name',
        'Last Name',
        'Phone Number',
        'Street',
        'Landmark',
        'City',
        'State',
        'Postal/Zip Code',
        'Country',
        'Email Address',
        'Branch',
        'Department',
        'Designation',
        'Role',
      ];

      headers.forEach((header, index) => {
        mainSheet
          .cell(1, index + 1)
          .value(header)
          .style({ bold: true });
      });

      const startRow = 2;
      const endRow = 100;

      // Static values
      const states = ['Maharashtra', 'Goa', 'Karnataka', 'Gujarat'];
      const countries = ['India'];

      states.forEach((state, i) => dataSheet.cell(i + 1, 1).value(state)); // A
      countries.forEach((country, i) =>
        dataSheet.cell(i + 1, 2).value(country),
      ); // B

      // ===== Data Validation (Dropdowns) =====

      // Column G = State
      mainSheet.range(`H${startRow}:H${endRow}`).dataValidation({
        type: 'list',
        formula1: `=Data!$A$1:$A$${states.length}`,
        showInputMessage: true,
      });

      // Column J = Country
      mainSheet.range(`J${startRow}:J${endRow}`).dataValidation({
        type: 'list',
        formula1: `=Data!$B$1:$B$${countries.length}`,
        showInputMessage: true,
      });

      // // Column L = Branch
      mainSheet.range(`L${startRow}:L${endRow}`).dataValidation({
        type: 'list',
        formula1: `=Data!$C$1:$C$${branches.length}`,
        showInputMessage: true,
      });

      // // Column M = Department
      mainSheet.range(`M${startRow}:M${endRow}`).dataValidation({
        type: 'list',
        formula1: `=Data!$D$1:$D$${departments.length}`,
        showInputMessage: true,
      });

      // // Column O = Role
      mainSheet.range(`O${startRow}:O${endRow}`).dataValidation({
        type: 'list',
        formula1: `=Data!$E$1:$E$${roles.length}`,
        showInputMessage: true,
      });

      // Optional: Hide the data sheet
      // dataSheet.hidden(true);
      const buffer = await workbook.outputAsync();
      return buffer;
    } catch (error) {
      console.error('Error generating user template:', error);
      throw new Error('Failed to generate Excel user template');
    }
  }

  async createNewPrimaryBranchUser(
    dto: CreateUserDto,
    organization_Id: number,
  ) {
    // Validate if the user exists
    // Check if the phone number already exists

    const existingUser = await this.userRepository.findOne({
      where: { phone_number: dto.phone_number },
    });
    if (existingUser) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: `Phone number '${dto.phone_number}' already exists in organization`,
        },
        HttpStatus.CONFLICT,
      );
    }

    const existingUserPublic = await this.registerUser.findOne({
      where: { phone_number: dto.phone_number },
    });

    const OrganizationDataFetch = await this.registerOrganization.findOne({
      where: { organization_id: organization_Id },
    });

    console.log(OrganizationDataFetch.organization_name);

    if (existingUserPublic) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: `Phone number '${dto.phone_number}' already exists in public schema`,
        },
        HttpStatus.CONFLICT,
      );
    }

    const newUserLogin = this.registerUser.create({
      first_name: dto.first_name,
      last_name: dto.last_name,
      business_email: dto.users_business_email,
      phone_number: dto.phone_number,
      organization_id: organization_Id,
      password: null,
      is_primary_user: 'N', // Default value
      verified: false, // Default to false until verification
      organization: { organization_id: organization_Id }, // Reference organization
    });

    const savedUserLogin = await this.registerUser.save(newUserLogin);

    // Create the new user
    const newUser = this.userRepository.create({
      first_name: dto.first_name,
      middle_name: dto.middle_name || '',
      last_name: dto.last_name,
      users_business_email: dto.users_business_email,
      phone_number: dto.phone_number,
      // branch_id: dto.branch_id,
      role_id: dto.role_id, // This can be a reference to a role ID
      designation_id: dto.designation_id, // This can be a reference to a Designation ID
      department_id: dto.department_id, // This can be a reference to a Department ID
      street: dto.street,
      landmark: dto.landmark,
      country: dto.country,
      city: dto.city,
      state: dto.state,
      zip: dto.zip,
      organization_id: organization_Id,
      register_user_login_id: savedUserLogin.user_id,
    });

    // Save the new user
    const savedUser = await this.userRepository.save(newUser);

    const invitationUrl = `${process.env.CLIENT_ORIGIN_URL}/authentication/passwordset/accept-invite?userId=${savedUserLogin.user_id}`;

    const fullname =
      dto.first_name + ' ' + dto.middle_name + ' ' + dto.last_name;
    const OrgName = OrganizationDataFetch.organization_name;

    // User this funtion to send mail
    await this.mailService.sendEmail(
      dto.users_business_email,
      "You're Invited to Join " + OrgName,
      await renderEmail(
        EmailTemplate.NEW_USER_INVITATION, // This should point to your React template
        {
          name: fullname,
          inviter: dto.first_name + ' ' + dto.last_name, // Or replace with actual inviter name if available
          companyName: OrgName,
          companyLogo: null, // Optional, or pass actual logo URL
          mailReply: 'support@norbik.in', // Or use a config-based dynamic address
          inviteUrl: invitationUrl,
        },
        this.mailConfigService, // Make sure it's configured correctly
      ),
    );

    // await this.sendUserInvitationMail(dto.users_business_email, OrgName, fullname, invitationUrl );

    // Return the success response in REST API format
    return savedUser.user_id;
  }

  async exportVendorCSV() {
    try {
      const vendors = await this.vendorRepository.find({
        where: { is_active: 1, is_deleted: 0 },
        relations: ['added_by_user'], // 👈 Load relation
      });

      return vendors.map((vendor) => {
        const fullName =
          vendor.added_by_user?.first_name && vendor.added_by_user?.last_name
            ? `${vendor.added_by_user.first_name} ${vendor.added_by_user.last_name}`
            : 'N/A';
        console.log('fullName', fullName);
        return {
          'Vendor Name': vendor.vendor_name,
          'GST No.': vendor.vendor_gst_no,
          Street: vendor.vendor_street,
          Landmark: vendor.vendor_landmark,
          City: vendor.vendor_city,
          State: vendor.vendor_state,
          Country: vendor.vendor_country,
          Pincode: vendor.vendor_pincode,
          'Contact Number': vendor.vendor_contact_number,
          Email: vendor.vendor_email,
          'Primary Contact Person': vendor.vendor_primary_contact,
          'Alternative Contact': vendor.vendor_alternative_contact_number || '',
          'Created By': fullName,
          'Created At': vendor.created_at
            ? new Date(vendor.created_at).toLocaleDateString()
            : '',
          'Updated At': vendor.updated_at
            ? new Date(vendor.updated_at).toLocaleDateString()
            : '',
        };
      });
    } catch (error) {
      console.error('Error exporting vendor CSV data:', error);
      throw new Error('An error occurred while exporting vendor data.');
    }
  }

  private async sendUserInvitationMail(
    email: string,
    organization_name: string,
    fullname: string,
    invitationUrl: string,
  ) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Organization's Invitation to Join the SP-IT Assets",
      html: `
        <p>Dear ${fullname},</p>
        <p>${organization_name} has given you access to the SP IT Solutions LLP account with XXXX.</p>
        <p>To accept the invite, please click on the link below:</p>
        <a href="${invitationUrl}" style="color: white; background-color: #007BFF; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <p>Thanks for trusting brand XXXX!</p>
        <p>SP-IT HRMS Support Team</p>
        <p><i>This is a system generated mail, do not reply to this mail. If you have any query, please write to support@spitsolutions.com</i></p>
  `,
    };

    await transporter.sendMail(mailOptions);
  }

  async fetchAllBranchusers(
    branch_id?: number,
    department_id?: number,
  ): Promise<any> {
    try {
      let query = this.dataSource
        .getRepository(User)
        .createQueryBuilder('users')
        .where('users.is_active = true')
        .andWhere('users.is_deleted = false');

      // Optional branch filter
      if (branch_id) {
        query = query.andWhere('users.branch_id = :branch_id', { branch_id });
      }

      // Optional department filter
      if (department_id) {
        query = query.andWhere('users.department_id = :department_id', {
          department_id,
        });
      }

      const result = await query.orderBy('users.first_name', 'ASC').getMany();

      if (!result || result.length === 0) {
        return { message: 'No users found.', data: [] };
      }

      return { message: 'Users fetched successfully', data: result };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new BadRequestException(`Error fetching Users: ${error.message}`);
    }
  }

  async fetchAllUsers(
    branch_id?: number,
    department_id?: number,
  ): Promise<any> {
    try {
      let query = this.dataSource
        .getRepository(User)
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.user_role', 'user_role')
        .leftJoinAndSelect('users.user_designation', 'user_designation')
        .leftJoinAndSelect('users.user_department', 'user_department')
        .where('users.is_active = true')
        .andWhere('users.is_deleted = false');

      if (branch_id) {
        query = query.andWhere('users.branch_id = :branch_id', { branch_id });
      }

      if (department_id) {
        query = query.andWhere('users.department_id = :department_id', {
          department_id,
        });
      }

      const result = await query.orderBy('users.first_name', 'ASC').getMany();

      if (!result || result.length === 0) {
        return { message: 'No users found.', data: [] };
      }

      // Map nested objects to only include id and name
      const cleanedData = result.map((user) => ({
        ...user,
        user_role: user.user_role
          ? {
            role_id: user.user_role.role_id,
            role_name: user.user_role.role_name,
          }
          : null,
        user_designation: user.user_designation
          ? {
            designation_id: user.user_designation.designation_id,
            designation_name: user.user_designation.designation_name,
          }
          : null,
        user_department: user.user_department
          ? {
            departmentId: user.user_department.departmentId,
            departmentName: user.user_department.departmentName,
          }
          : null,
      }));

      return {
        message: 'Users fetched successfully',
        data: cleanedData,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new BadRequestException(`Error fetching Users: ${error.message}`);
    }
  }








  getFilterableVendorColumns() {
    return [
      {
        key: 'vendor_type',
        label: 'Vendor Type',
        type: 'select',
        mandatory: false,
      },
      {
        key: 'vendor_category',
        label: 'Category',
        type: 'select',
        mandatory: false,
      },
      {
        key: 'country',
        label: 'Country',
        type: 'select',
        mandatory: false,
      },
      {
        key: 'created_at',
        label: 'Created At',
        type: 'date-range',
        mandatory: false,
      },
      {
        key: 'is_active',
        label: 'Active Status',
        type: 'boolean',
        mandatory: false,
      },
      {
        key: 'payment_terms',
        label: 'Payment Terms',
        type: 'select',
        mandatory: false,
      },

    ];
  }


  async getAllorganizationVenders(): Promise<any> {
    try {

      let whereCondition = { is_active: 1, is_deleted: 0 };

      // Fetch all records without pagination (skip and take are removed)
      const [results, total] = await this.vendorRepository
        .createQueryBuilder('vendors')
        .where(whereCondition)
        .orderBy('vendors.vendor_name', 'ASC')
        .getManyAndCount(); // Fetch all vendors matching the condition

      // Return results without pagination
      return {
        data: results,
        total, // Total number of results
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Error fetching vendors: ${error.message}`);
    }
  }





  async fetchSingleVendorsData(vendor_id: number) {

    if (!vendor_id) {
      throw new BadRequestException('Vendor ID is required');
    }

    try {
      const vendorsData = await this.vendorRepository
        .createQueryBuilder('vendors')
        .select('vendors') // selects all columns
        .where('vendors.vendor_id = :vendor_id', { vendor_id })
        .andWhere('vendors.is_active = :is_active', { is_active: 1 })
        .andWhere('vendors.is_deleted = :is_deleted', { is_deleted: 0 })
        .getOne();


      console.log("vendorsData", vendorsData);

      if (!vendorsData) {
        return {
          status: 404,
          message: `Vendor with ID ${vendor_id} not found or inactive`,
          data: null,
        };
      }

      return {
        status: 200,
        message: 'Vendor fetched successfully',
        data: vendorsData,
      };

    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the Vendor',
        error: error.message,
      };
    }

  }






  async deleteUserManagementData(userIds: number[]) {


    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: 'No user IDs provided',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const deletedUsers: any[] = [];
    const failedUsers: any[] = [];

    for (const user_id of userIds) {
      try {

        // ✅ Core logic unchanged
        const existingUser = await this.userRepository.findOne({
          where: { user_id },
        });

        if (!existingUser) {
          failedUsers.push({
            user_id,
            message: `User with ID ${user_id} not found`,
          });
          continue;
        }


        existingUser.is_active = 0;
        existingUser.is_deleted = 1;
        await this.userRepository.save(existingUser);

        const existingUserLogin = await this.dataSource
          .getRepository(RegisterUserLogin)
          .findOne({
            where: { user_id: existingUser.register_user_login_id },
          });

        if (existingUserLogin) {
          existingUserLogin.is_active = 0;
          existingUserLogin.is_deleted = 1;
          await this.dataSource
            .getRepository(RegisterUserLogin)
            .save(existingUserLogin);
        }

        // if (existingUserLogin) {
        //   await this.dataSource
        //     .getRepository(RegisterUserLogin)
        //     .save(existingUserLogin);
        // }

        deletedUsers.push({
          user_id,
          message: `User with ID ${user_id} has been deactivated and deleted`,
        });
      } catch (error) {
        failedUsers.push({
          user_id,
          message: `Error deleting user ID ${user_id}`,
        });
      }
    }

    return {
      status: HttpStatus.OK,
      message: 'Bulk user delete operation completed.',
      data: {
        deleted: deletedUsers,
        failed: failedUsers,
      },
    };
  }

  async deleteVendorData(deleteVendorDto: any) {
    console.log("deleteVendorDto", deleteVendorDto)
    const { vendor_ids } = deleteVendorDto; // vendor_id is an array

    console.log("vendor_ids", vendor_ids)

    if (!Array.isArray(vendor_ids) || vendor_ids.length === 0) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: 'No vendor IDs provided',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const deletedVendors = [];
    const failedVendors = [];

    for (const id of vendor_ids) {
      try {
        const existingVendor = await this.vendorRepository.findOne({
          where: { vendor_id: id },
        });

        if (!existingVendor) {
          failedVendors.push({
            vendor_ids: id,
            message: `Vendor with ID ${id} not found`,
          });
          continue;
        }

        // Soft delete: set flags
        existingVendor.is_active = 0;
        existingVendor.is_deleted = 1;

        await this.vendorRepository.save(existingVendor);

        deletedVendors.push({
          vendor_id: id,
          message: `Vendor with ID ${id} has been deactivated and deleted`,
        });
      } catch (error) {
        failedVendors.push({
          vendor_id: id,
          message: `Error deleting vendor ID ${id}`,
        });
      }
    }

    console.log("deletedVendors", deletedVendors)
    console.log("failedVendors", failedVendors)



    return {
      status: HttpStatus.OK,
      message: 'Bulk vendor delete operation completed.',
      data: {
        deleted: deletedVendors,
        failed: failedVendors,
      },
    };
  }

  async getUserByPublicID(public_user_id: number): Promise<number> {
    const userExists = await this.dataSource
      .getRepository(User)
      .findOne({ where: { register_user_login_id: public_user_id } });
    console.log('public user id in asset', public_user_id);
    if (!userExists) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'Invalid user ID' },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return userExists.user_id;
    }
  }

  async fetchDepartments1(
    page: number,
    limit: number,
    searchQuery: string,
  ): Promise<any> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(Department)
        .createQueryBuilder('department')
        .where('department.active = :isActive', { isActive: true })
        .andWhere('department.deleted = :isDeleted', { isDeleted: false });

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder.andWhere('department.department_name ILIKE :search', {
          search: `%${searchQuery}%`,
        });
      }

      const [result, total] = await queryBuilder
        .orderBy('department.department_name', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      if (!result || result.length === 0) {
        throw new BadRequestException(
          'No departments found with the specified criteria.',
        );
      }

      return {
        status: 'success',
        message: 'Departments retrieved successfully.',
        data: result,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching departments: ${error.message}`,
      );
    }
  }

  async fetchOrganizationRoles(): Promise<any> {
    const roles = await this.roleRepository.find({
      where: {
        is_active: true,
        is_deleted: false,
      },
      select: ['role_id', 'role_name'],
      order: { role_name: 'ASC' },
    });

    return {
      status: 'success',
      message: 'Roles retrieved successfully.',
      data: roles,
    };
  }

  // Department Services

  async createDepartments(
    createDepartmentsDto: CreateDepartmentsDto,
  ): Promise<any> {
    const {
      departmentIds,
      newDepartmentNames = [],
      existingDepartmentNames = [],
    } = createDepartmentsDto;

    // ✅ Trim names
    const trimmedNewNames = newDepartmentNames.map((name) => name.trim());
    const trimmedExistingNames = existingDepartmentNames.map((name) =>
      name.trim(),
    );

    const departmentNamesToProcess = [
      ...trimmedExistingNames,
      ...trimmedNewNames,
    ];

    if (departmentNamesToProcess.length === 0) {
      return { success: false, message: 'No departments provided' };
    }

    try {
      const departmentRepository = this.dataSource.getRepository(Department);

      // 🔍 Get all departments that match names case-insensitively
      const allDepartments = await departmentRepository.find();
      const existingNamesInDb = allDepartments.map((dept) =>
        dept.departmentName.trim().toLowerCase(),
      );

      // ❌ Avoid duplicates (in DB or in same request)
      const seen = new Set<string>();
      const newDepartmentsToSave = departmentNamesToProcess
        .filter((name) => {
          const lowerTrimmed = name.trim().toLowerCase();
          const isDuplicate =
            existingNamesInDb.includes(lowerTrimmed) || seen.has(lowerTrimmed);
          if (!isDuplicate) seen.add(lowerTrimmed);
          return !isDuplicate;
        })
        .map((name) => ({ departmentName: name.trim() }));

      if (newDepartmentsToSave.length > 0) {
        const savedDepartments =
          await departmentRepository.save(newDepartmentsToSave);
        return {
          success: true,
          message: 'New departments added',
          data: savedDepartments,
        };
      } else {
        return { success: false, message: 'All departments already exist' };
      }
    } catch (error) {
      console.error('Error saving departments:', error);
      throw new BadRequestException('Error saving departments.');
    }
  }

  // In organizational-profile.service.ts

  async editDepartment(
    id: number,
    dto: EditDepartmentDto,
  ): Promise<any> {
    const repo = this.dataSource.getRepository(Department);

    const existing = await repo.findOne({
      where: { departmentId: id, deleted: false },
      relations: ['departmentHead'],
    });

    if (!existing) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Update only passed fields
    if (dto.departmentName) existing.departmentName = dto.departmentName.trim();
    if (dto.dept_description) existing.dept_description = dto.dept_description.trim();

    if (dto.departmentHeadId) {
      const userRepo = this.dataSource.getRepository(User);
      const head = await userRepo.findOne({ where: { user_id: dto.departmentHeadId } });
      if (!head) throw new BadRequestException('Invalid department head ID');
      existing.departmentHead = head;
    }

    if (dto.active !== undefined) existing.active = dto.active;
    if (dto.deleted !== undefined) existing.deleted = dto.deleted;

    existing.updatedAt = new Date();

    const saved = await repo.save(existing);

    return {
      success: true,
      message: 'Department updated successfully',
      data: saved,
    };
  }

  async fetchDepartmentconfig(
    page: number,
    limit: number,
    searchQuery: string,
  ): Promise<any> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(DepartmentConifg)
        .createQueryBuilder('departmentconfig')
        .where('departmentconfig.is_active = :isActive', { isActive: true })
        .andWhere('departmentconfig.is_deleted = :isDeleted', {
          isDeleted: false,
        });

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder.andWhere(
          'departmentconfig.department_name ILIKE :search',
          { search: `%${searchQuery}%` },
        );
      }

      const [result, total] = await queryBuilder
        .orderBy('departmentconfig.department_name', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      if (!result || result.length === 0) {
        throw new BadRequestException(
          'No departments found with the specified criteria.',
        );
      }

      return {
        status: 'success',
        message: 'Departments retrieved successfully.',
        data: result,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching departments: ${error.message}`,
      );
    }
  }
  async fetchDepartments(
    page: number,
    limit: number,
    searchQuery: string,
  ): Promise<any> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(Department)
        .createQueryBuilder('department')
        .where('department.active = :isActive', { isActive: true })
        .andWhere('department.deleted = :isDeleted', { isDeleted: false });

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder.andWhere('department.department_name ILIKE :search', {
          search: `%${searchQuery}%`,
        });
      }

      const [result, total] = await queryBuilder
        .orderBy('department.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        status: 'success',
        message: result.length
          ? 'Departments retrieved successfully.'
          : 'No departments found.',
        data: result,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Error fetching departments: ${error.message}`,
      );
    }
  }

  // generate bulk user template and Bulk import service

  async generateUserTemplate() {
    try {
      // Fetch dropdown data
      const branchResponse: any = await this.fetchOrganizationBranches();
      const branches: any[] = branchResponse.data;
      console.log('branches', branches);

      const departmentResponse: any = await this.fetchOrganizationDeparments();
      const departments: any[] = departmentResponse.data;
      console.log('departments', departments);

      const designationResponse = await this.fetchOrganizationDesignation();
      const designations: any[] = designationResponse.data;
      console.log('designations', designations);

      const rolesResponse: any = await this.fetchOrganizationRoles();
      const roles: any[] = rolesResponse.data;
      console.log('roles', roles);

      // Create workbook and sheets
      const workbook = await XlsxPopulate.fromBlankAsync();
      const mainSheet = workbook.sheet(0);
      mainSheet.name('user_template');
      const dataSheet = workbook.addSheet('Data');

      // Instructions
      const instructions = [
        'Instructions:',
        '1. Fill in the required field (First Name) starting from row 7.',
        '2. Dropdown fields: State, Country, Branch, Department, Designation, Role.',
        '3. Do not edit the header row (Row 6).',
        '4. Phone Number, if provided, must be 10 digits starting with 9.',
        '5. Postal/Zip Code, if provided, must be a 6-digit number.',
      ];
      instructions.forEach((text, index) => {
        mainSheet
          .cell(index + 1, 1)
          .value(text)
          .style({
            bold: true,
            fontColor: '0000FF',
          });
      });

      // Set column widths
      const columnWidths = [
        20, // A - First Name
        20, // B - Middle Name
        20, // C - Last Name
        20, // D - Phone Number
        20, // E - Street
        20, // F - Landmark
        20, // G - City
        20, // H - State
        20, // I - Zip
        20, // J - Country
        30, // K - Email
        20, // L - Branch
        20, // M - Department
        20, // N - Designation
        20, // O - Role
      ];
      columnWidths.forEach((width, index) => {
        mainSheet.column(index + 1).width(width);
      });

      // Header row
      const headers = [
        { label: 'First Name', required: true },
        { label: 'Middle Name', required: false },
        { label: 'Last Name', required: false },
        { label: 'Phone Number', required: false },
        { label: 'Street', required: false },
        { label: 'Landmark', required: false },
        { label: 'City', required: false },
        { label: 'State', required: false },
        { label: 'Postal/Zip Code', required: false },
        { label: 'Country', required: false },
        { label: 'Email Address', required: false },
        { label: 'Branch', required: false },
        { label: 'Department', required: false },
        { label: 'Designation', required: false },
        { label: 'Role', required: false },
      ];

      headers.forEach((item, index) => {
        const cell = mainSheet.cell(6, index + 1);
        const label = item.required ? `${item.label} *` : item.label;
        cell.value(label).style({
          bold: true,
          fontColor: item.required ? 'FF0000' : '000000',
        });
      });

      // Populate Data sheet
      branches.forEach((branch, i) => {
        dataSheet.cell(i + 1, 3).value(branch.branch_name?.trim());
      });
      departments.forEach((department, i) => {
        dataSheet.cell(i + 1, 4).value(department.departmentName?.trim());
      });
      designations.forEach((designation, i) => {
        dataSheet.cell(i + 1, 5).value(designation.designation_name?.trim());
      });
      roles.forEach((role, i) => {
        dataSheet.cell(i + 1, 6).value(role.role_name?.trim());
      });

      const startRow = 7;
      const maxExcelRows = 1048576;

      // State and Country dropdowns
      const stateList = ['Maharashtra', 'Goa', 'Karnataka', 'Gujarat'];
      const countryList = ['India'];

      const quotedStateList = `"${stateList.join(',')}"`;
      const quotedCountryList = `"${countryList.join(',')}"`;

      mainSheet.range(`H${startRow}:H${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: quotedStateList,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Select State',
        prompt: 'Choose one from the dropdown',
        errorTitle: 'Invalid State',
        error: 'Please select a valid state from the list.',
      });

      mainSheet.range(`J${startRow}:J${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: quotedCountryList,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Select Country',
        prompt: 'Choose one from the dropdown',
        errorTitle: 'Invalid Country',
        error: 'Please select a valid country from the list.',
      });

      // Branch, Department, Designation, Role dropdowns
      mainSheet.range(`L${startRow}:L${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: `=Data!$C$1:$C$${branches.length}`,
        showInputMessage: true,
        allowBlank: true,
      });
      mainSheet.range(`M${startRow}:M${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: `=Data!$D$1:$D$${departments.length}`,
        showInputMessage: true,
        allowBlank: true,
      });
      mainSheet.range(`N${startRow}:N${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: `=Data!$E$1:$E$${designations.length}`,
        showInputMessage: true,
        allowBlank: true,
      });
      mainSheet.range(`O${startRow}:O${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: `=Data!$F$1:$F$${roles.length}`,
        showInputMessage: true,
        allowBlank: true,
      });

      // Field Validations
      mainSheet.range(`A${startRow}:A${maxExcelRows}`).dataValidation({
        type: 'textLength',
        operator: 'greaterThan',
        formula1: '0',
        allowBlank: false,
        showInputMessage: true,
        promptTitle: 'First Name',
        prompt: 'Required. Only letters allowed.',
        errorTitle: 'Invalid Input',
        error: 'First name is required and must be text.',
      });

      mainSheet.range(`B${startRow}:B${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(B7),ISTEXT(B7))`,
        showInputMessage: true,
        promptTitle: 'Middle Name',
        prompt: 'Optional. Only letters allowed.',
        errorTitle: 'Invalid Input',
        error: 'Middle name must be text.',
      });

      mainSheet.range(`C${startRow}:C${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(C7),ISTEXT(C7))`,
        showInputMessage: true,
        promptTitle: 'Last Name',
        prompt: 'Optional. Only letters allowed.',
        errorTitle: 'Invalid Input',
        error: 'Last name must be text.',
      });

      mainSheet.range(`D${startRow}:D${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(D7),AND(ISNUMBER(D7),LEN(D7)=10,LEFT(D7,1)="9"))`,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Phone Number',
        prompt: 'Optional. Must be 10 digits and start with 9 if provided.',
        errorTitle: 'Invalid Phone Number',
        error: 'Phone number must be 10 digits and start with 9.',
      });

      mainSheet.range(`I${startRow}:I${maxExcelRows}`).dataValidation({
        type: 'whole',
        operator: 'between',
        formula1: '100000',
        formula2: '999999',
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Zip Code',
        prompt: 'Optional. Must be a 6-digit number if provided.',
        errorTitle: 'Invalid Zip Code',
        error: 'Zip code must be a 6-digit number.',
      });

      mainSheet.range(`K${startRow}:K${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(K7),AND(LEN(K7)>5,ISNUMBER(FIND("@",K7)),ISNUMBER(FIND(".",K7))))`,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Email Address',
        prompt:
          'Optional. Must be a valid email (e.g., user@example.com) if provided.',
        errorTitle: 'Invalid Email',
        error: 'Email must be valid and include @ and .',
      });

      dataSheet.hidden(true);

      const buffer = await workbook.outputAsync();
      return buffer;
    } catch (error) {
      console.error('Error generating user template:', error);
      throw new Error('Failed to generate Excel user template');
    }
  }

  async bulkCreateUsers(

    dtos: any[],
    organization_Id: number,
    decrypted_system_user_id: number,
  ) {
    const successUsers = [];
    const errorUsers = [];
    const newUsers = [];

    console.log('🔵 [START] bulkCreateUsers called:', {
      organization_Id,
      decrypted_system_user_id,
      dtosLength: dtos.length,
    });

    if (!organization_Id || isNaN(organization_Id)) {
      console.error('❌ Invalid organization ID:', organization_Id);
      throw new Error('Invalid organization ID');
    }

    // Fetch existing users
    const existingUsers = await this.userRepository.find({
      where: { organization_id: organization_Id },
    });
    console.log('📦 Existing internal users count:', existingUsers.length);

    const existingPublicUsers = await this.registerUser.find();
    console.log('📦 Existing public users count:', existingPublicUsers.length);

    const OrganizationDataFetch = await this.registerOrganization.findOne({
      where: { organization_id: organization_Id },
    });
    const OrgName =
      OrganizationDataFetch?.organization_name || 'Your Organization';
    console.log('📦 Organization Name:', OrgName);

    const branchResponse: any = await this.fetchOrganizationBranches();
    const branches: any[] = branchResponse.data;

    const departmentResponse: any = await this.fetchOrganizationDeparments();
    const departments: any[] = departmentResponse.data;

    const designationResponse = await this.fetchOrganizationDesignation();
    const designations: any[] = designationResponse.data;

    const rolesResponse: any = await this.fetchOrganizationRoles();
    const roles: any[] = rolesResponse.data;

    // Process each DTO
    for (const dto of dtos) {
      console.log('🔄 Processing user DTO:', dto);

      // Validate required field
      const firstName = dto.first_name?.trim();
      if (!firstName) {
        errorUsers.push({
          ...dto,
          reason: 'First name is required',
        });
        console.warn('⚠️ Skipped: Missing first name');
        continue;
      }

      // Normalize input names
      dto.branch_name = dto.branch_name?.trim() || null;
      dto.department_name = dto.department_name?.trim() || null;
      dto.designation_name = dto.designation_name?.trim() || null;
      dto.role_name = dto.role_name?.trim() || null;

      // Map names to IDs if provided
      const branch = dto.branch_name
        ? branches.find(
          (b) =>
            b.branch_name?.trim().toLowerCase() ===
            dto.branch_name?.trim().toLowerCase(),
        )
        : null;
      const department = dto.department_name
        ? departments.find(
          (d) =>
            d.departmentName?.trim().toLowerCase() ===
            dto.department_name?.trim().toLowerCase(),
        )
        : null;
      const designation = dto.designation_name
        ? designations.find(
          (d) =>
            d.designation_name?.trim().toLowerCase() ===
            dto.designation_name?.trim().toLowerCase(),
        )
        : null;
      const role = dto.role_name
        ? roles.find(
          (r) =>
            r.role_name?.trim().toLowerCase() ===
            dto.role_name?.trim().toLowerCase(),
        )
        : null;

      dto.branch_id = branch?.branchId || null;
      dto.department_id = department?.departmentId || null;
      dto.designation_id = designation?.designation_id || null;
      dto.role_id = role?.role_id || null;

      console.log('🧩 Resolved IDs:', {
        branch_id: dto.branch_id,
        department_id: dto.department_id,
        designation_id: dto.designation_id,
        role_id: dto.role_id,
      });

      const phone = dto.phone_number?.trim();
      const email = dto.users_business_email?.trim()?.toLowerCase();

      // Validate optional fields if provided
      if (phone && !/^[9][0-9]{9}$/.test(phone)) {
        errorUsers.push({
          ...dto,
          reason: 'Phone number must be 10 digits and start with 9',
        });
        console.warn('⚠️ Skipped: Invalid phone number');
        continue;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorUsers.push({
          ...dto,
          reason: 'Invalid email format',
        });
        console.warn('⚠️ Skipped: Invalid email');
        continue;
      }

      if (dto.zip && !/^[0-9]{6}$/.test(dto.zip)) {
        errorUsers.push({
          ...dto,
          reason: 'Zip code must be a 6-digit number',
        });
        console.warn('⚠️ Skipped: Invalid zip code');
        continue;
      }

      // Duplicate checks for provided fields
      if (phone) {
        const userExistsByPhone = existingUsers.some(
          (user) => user.phone_number === phone,
        );
        const userExistsPublicByPhone = existingPublicUsers.some(
          (user) => user.phone_number === phone,
        );
        if (userExistsByPhone || userExistsPublicByPhone) {
          errorUsers.push({
            ...dto,
            reason: 'Phone number already exists',
          });
          console.warn('⚠️ Skipped: Phone number exists:', phone);
          continue;
        }
      }

      if (email) {
        const userExistsByEmail = existingUsers.some(
          (user) => user.users_business_email === email,
        );
        const userExistsPublicByEmail = existingPublicUsers.some(
          (user) => user.business_email === email,
        );
        if (userExistsByEmail || userExistsPublicByEmail) {
          errorUsers.push({
            ...dto,
            reason: 'Email already exists',
          });
          console.warn('⚠️ Skipped: Email exists:', email);
          continue;
        }
      }

      // Create registerUser entry
      const newUserLogin = this.registerUser.create({
        first_name: firstName,
        last_name: dto.last_name?.trim() || null,
        business_email: email || null,
        phone_number: phone || null,
        organization_id: organization_Id,
        password: null,
        is_primary_user: 'N',
        verified: false,
        organization: { organization_id: organization_Id },
      });

      let savedUserLogin: any;
      try {
        savedUserLogin = await this.registerUser.save(newUserLogin);
        console.log('✅ Saved register login:', savedUserLogin.user_id);
      } catch (err) {
        console.error('❌ Failed to save register user login:', err);
        errorUsers.push({
          ...dto,
          reason: 'Failed to save register user login: ' + err.message,
        });
        continue;
      }

      // Create internal user
      const newUser = this.userRepository.create({
        created_by: Number(decrypted_system_user_id),
        first_name: firstName,
        middle_name: dto.middle_name?.trim() || null,
        last_name: dto.last_name?.trim() || null,
        users_business_email: email || null,
        phone_number: phone || null,
        branches: dto.branch_id || null,
        role_id: dto.role_id || null,
        designation_id: dto.designation_id || null,
        department_id: dto.department_id || null,
        street: dto.street?.trim() || null,
        landmark: dto.landmark?.trim() || null,
        country: dto.country?.trim() || null,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        zip: dto.zip?.trim() || null,
        organization_id: organization_Id,
        register_user_login_id: savedUserLogin.user_id,
      });

      newUsers.push({ dto, newUser, savedUserLogin });
    }

    // Save all users
    try {
      const toSave = newUsers.map((entry) => entry.newUser);
      const savedUsers = await this.userRepository.save(toSave);
      console.log('✅ Saved user count:', savedUsers.length);

      for (let i = 0; i < savedUsers.length; i++) {
        const dto = newUsers[i].dto;
        const savedUserLogin = newUsers[i].savedUserLogin;

        const fullname =
          `${dto.first_name} ${dto.middle_name || ''} ${dto.last_name || ''}`.trim();

        const email = dto.users_business_email?.trim()?.toLowerCase();
        if (email) {
          const invitationUrl = `${process.env.CLIENT_ORIGIN_URL}/authentication/passwordset/accept-invite?userId=${savedUserLogin.user_id}`;
          const inviterProfile = await this.authService.fetchUserLoginProfile(
            Number(decrypted_system_user_id),
          );

          await this.mailService.sendEmail(
            email,
            `You're Invited to Join ${OrgName}`,
            await renderEmail(
              EmailTemplate.NEW_USER_INVITATION,
              {
                name: fullname,
                inviter: `${inviterProfile.first_name} ${inviterProfile.last_name}`,
                companyName: OrgName,
                companyLogo: null,
                mailReply: 'support@norbik.in',
                inviteUrl: invitationUrl,
              },
              this.mailConfigService,
            ),
          );
          console.log(`✉️ Invitation mail sent to ${email}`);
        } else {
          console.log(
            `✉️ Skipped sending mail for user: ${fullname} (no email)`,
          );
        }
        successUsers.push(dto);
      }
    } catch (error) {
      console.error('❌ Error during bulk save:', error);
      newUsers.forEach((entry) =>
        errorUsers.push({
          ...entry.dto,
          reason: 'Batch save error: ' + error.message,
        }),
      );
    }

    console.log('📦 Final result summary:', {
      created: successUsers.length,
      failed: errorUsers.length,
    });

    return {
      status: successUsers.length ? HttpStatus.CREATED : HttpStatus.CONFLICT,
      message:
        successUsers.length && errorUsers.length
          ? 'Bulk users created with some conflicts.'
          : successUsers.length
            ? 'All users created successfully.'
            : 'No users created. All entries had conflicts.',
      data: {
        created_count: successUsers.length,
        created_users: successUsers,
        error_users: errorUsers,
      },
    };
  }


  // New Backend APIS


  async findByPincode(pincode: string) {
    const record = await this.pincodesRepository.findOne({
      where: { pincode },
    });

    if (!record) {
      return { success: false, message: 'Pincode not found' };
    }

    return {
      success: true,
      city: record.city,
      state: record.state,
      latitude: record.latitude,
      longitude: record.longitude
    };
  }

  async createBranch1(createBranchInfo: CreateBranchDto): Promise<any> {



    console.log('createBranchInfo', createBranchInfo);

    // ✅ Duplicate check for branch name (case-insensitive)
    const existingBranch = await this.branchRepository.findOne({
      where: {
        branch_name: createBranchInfo.branch_name?.trim(),
      },
    });

    if (existingBranch) {
      throw new ConflictException(
        `Branch name '${createBranchInfo.branch_name}' already exists.`,
      );
    }

    // 👇 Original logic, now expanded with full DTO mapping
    const createBranchInfo2: any = {
      branch_name: createBranchInfo.branch_name,
      gstNo: createBranchInfo.gstNo,
      city: createBranchInfo.city,
      country: createBranchInfo.country,
      state: createBranchInfo.state,
      pincode: createBranchInfo.pincode ? Number(createBranchInfo.pincode) : null,
      branch_street: createBranchInfo.branch_street,
      branch_landmark: createBranchInfo.branch_landmark,
      established_date: createBranchInfo.established_date,
      contact_number: createBranchInfo.contact_number,
      alternative_contact_number: createBranchInfo.alternative_contact_number,
      branch_email: createBranchInfo.branch_email,

      // 🔁 Optional fields if provided
      city_id: createBranchInfo.city_id || null,
      country_id: createBranchInfo.country_id || null,
      location_id: createBranchInfo.location_id || null,
      is_active: createBranchInfo.is_active ?? true,
      is_deleted: createBranchInfo.is_deleted ?? false,
    };

    // 👇 Preserve old logic
    if (
      createBranchInfo.primary_user_id !== undefined &&
      createBranchInfo.primary_user_id !== null
    ) {
      createBranchInfo2.primary_user_id = createBranchInfo.primary_user_id;
    }

    const branchSave = this.branchRepository.create(createBranchInfo2);
    const savedBranch = await this.branchRepository.save(branchSave);

    return savedBranch;

  }


  getLogoAsBase64(logoPath: string): string | null {
    try {
      const relativePath = logoPath.replace('/uploads', 'uploads'); // convert to FS path
      const filePath = join(process.cwd(), relativePath);

      if (!existsSync(filePath)) return null;

      const fileBuffer = readFileSync(filePath);
      const ext = filePath.split('.').pop()?.toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext; // fix jpg → jpeg

      return `data:image/${mime};base64,${fileBuffer.toString('base64')}`;
    } catch (err) {
      console.error('Failed to convert logo to base64:', err);
      return null;
    }
  }


  async fetchOrganizationalProfile(): Promise<any> {
    console.log("abc")
    try {
      const result = await this.dataSource
        .getRepository(OrganizationalProfile)
        .createQueryBuilder('organization')
        .leftJoin('organization.users', 'user')
        .leftJoin('user.user_designation', 'designation')
        .leftJoin('organization.industry_type', 'industry_type')
        .where('user.organization_id = organization.tenant_org_id')
        .andWhere('user.is_primary_user = :isPrimary', { isPrimary: 'Y' })
        .getRawOne();

      console.log("RAW result", result);


      if (!result) {
        throw new BadRequestException(
          'No organizational profiles found with the specified criteria.',
        );
      }

      // console.log("result", result);

      const logoPath = result.logo ?? result.org_profile_image_address ?? null;
      console.log("logoPath", logoPath)
      const logoPreviewBase64 = logoPath ? this.getLogoAsBase64(logoPath) : null;
      // console.log("logoPreviewBase64", logoPreviewBase64);



      const primaryUser = result.users?.[0]; // ensure safe access

      const data: OrganizationResponseDto = {
        organization_profile_id: result.organization_profile_id,
        user_id: primaryUser?.user_id ?? null,
        industry_type_id: result.industry_type_id ?? null,
        department_id: primaryUser?.department_id ?? null,
        designation_id: primaryUser?.designation_id ?? null,
        role_id: primaryUser?.role_id ?? null,
        organization_id: primaryUser?.organization_id ?? null,

        organizationName: result.org_name ?? null,
        contactNumber: result.mobile_number ?? primaryUser?.phone_number ?? null,
        email: result.email ?? primaryUser?.users_business_email ?? null,
        hqAddress: result.organization_address ?? null,

        hqAddressFields: {
          street: result.street ?? null,
          city: result.city ?? null,
          state: result.state ?? null,
          postalCode: result.pincode ?? null,
          landmark: result.landmark ?? null,
          country: result.country ?? null,
        },

        industryType: result.industry_type?.industryName ?? null,
        establishedDate: result.established_date
          ? new Date(result.established_date).toISOString().split('T')[0]
          : null,
        website: result.website_url ?? null,
        financialYear: result.financial_year ?? null,
        baseCurrency: result.base_currency ?? null,
        dateFormat: result.dateformat ?? null,
        timeZone: result.time_zone ?? null,
        gstNumber: result.gst_no ?? null,

        primaryContactName: `${primaryUser?.first_name ?? ''} ${primaryUser?.last_name ?? ''}`.trim() || null,
        primaryContactEmail: primaryUser?.users_business_email ?? null,
        primaryContactPhone: primaryUser?.phone_number ?? null,
        primaryContactRole: primaryUser?.user_designation?.designation_name ?? null,

        // Optional fields — you might need to fetch or default these if not in DB
        billingContactName: result.billingContactName ?? null,
        billingContactEmail: result.billingContactEmail ?? null,
        billingContactPhone: result.billingContactPhone ?? null,
        // billingContactRole: result.billingContactRole ?? null, // Uncomment if available

        themeMode: result.themeMode ?? null,
        customThemeColor: result.customThemeColor ?? null,
        logo: result.logo ?? result.org_profile_image_address ?? null,
        logoPreviewBase64: logoPreviewBase64,


      };

      // console.log("data", data)

      return {
        status: 'success',
        message: 'Organizational profiles retrieved successfully.',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error(
        'Error fetching organizational profiles:',
        error?.message,
        error?.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while fetching organizational profiles.',
      );
    }
  }


  // organization.service.ts

  async getBranchById(branch_id: number) {
    if (!branch_id) {
      throw new Error('Branch ID is required');
    }

    const branch = await this.branchRepository.findOne({
      where: { branch_id },
      // relations: {
      //   primary_user: true, // if you want to fetch the primary user
      // },
    });

    if (!branch) {
      throw new Error(`Branch with ID ${branch_id} not found`);
    }

    return {
      branch_id: branch.branch_id,
      branch_name: branch.branch_name,
      contact_number: branch.contact_number,
      alternative_contact_number: branch.alternative_contact_number,
      gstNo: branch.gstNo,
      established_date: branch.established_date,
      branch_email: branch.branch_email,
      address: {
        branch_street: branch.branch_street,
        branch_landmark: branch.branch_landmark,
        city: branch.city,
        state: branch.state,
        pincode: branch.pincode,
        country: branch.country,
      },
      primary_user_id: branch.primary_user_id ?? null,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt

      // primaryUser: branch.primary_user ?? null, // optional, for showing full user
    };
  }

  async updateBranch(updateBranchInfo: Partial<UpdateBranchDto>) {

    const branch_id = updateBranchInfo.branch_id;

    if (!branch_id) {
      throw new Error('Branch ID is required for update');
    }

    // 🧱 Step 1: Build update object
    const updateBranchInfo2: any = {
      branch_name: updateBranchInfo.branch_name,
      city: updateBranchInfo.city,
      pincode: updateBranchInfo.pincode
        ? Number(updateBranchInfo.pincode)
        : undefined,
      branch_street: updateBranchInfo.branch_street,
      country: updateBranchInfo.country,
      gstNo: updateBranchInfo.gstNo,
      established_date: updateBranchInfo.established_date,
      branch_landmark: updateBranchInfo.branch_landmark,
      contact_number: updateBranchInfo.contact_number,
      branch_email: updateBranchInfo.branch_email,
      state: updateBranchInfo.state,
      alternative_contact_number: updateBranchInfo.alternative_contact_number,

      // 💡 Optional fields that may be sent
      city_id: updateBranchInfo.city_id,
      country_id: updateBranchInfo.country_id,
      location_id: updateBranchInfo.location_id,
      is_active: updateBranchInfo.is_active,
      is_deleted: updateBranchInfo.is_deleted,
      created_by: updateBranchInfo.created_by,
    };

    // ✅ Only if defined (already safe-check)
    if (updateBranchInfo.primary_user_id !== undefined && updateBranchInfo.primary_user_id !== null) {
      updateBranchInfo2.primary_user_id = updateBranchInfo.primary_user_id;
    }

    // 🧹 Remove undefined to support partial updates
    const cleanedUpdateData = Object.fromEntries(
      Object.entries(updateBranchInfo2).filter(([_, v]) => v !== undefined),
    );

    // 🛠 Step 2: Update and fetch latest
    await this.branchRepository.update({ branch_id }, cleanedUpdateData);

    const updatedBranch = await this.branchRepository.findOne({
      where: { branch_id },
    });

    return updatedBranch;

  }





  async deleteBranchById(payload: any) {
    const branch_id = payload.branch_id;

    if (!branch_id) {
      return {
        success: false,
        message: "Branch ID is missing in payload.",
      };
    }

    const branchRepo = this.dataSource.getRepository(Branch);
    const branch = await branchRepo.findOneBy({ branch_id });

    if (!branch) {
      return {
        success: false,
        message: `Branch with ID ${branch_id} not found.`,
      };
    }

    // Perform soft delete by setting status flags
    branch.is_deleted = true;
    branch.is_active = false;
    branch.updatedAt = new Date();

    await branchRepo.save(branch);

    return {
      success: true,
      message: `Branch with ID ${branch_id} deleted (soft delete).`,
    };
  }
  // venders

  async fetchOrganizationVendors(): Promise<any> {

    try {
      const result = await this.vendorRepository
        .createQueryBuilder('vendors')
        .select([
          'vendors.vendor_id',
          'vendors.vendor_name',
          'vendors.vendor_primary_contact',
          'vendors.vendor_email',
          'vendors.vendor_contact_number',
          'vendors.vendor_gst_no',
          'vendors.is_deleted',
          'vendors.is_active',
        ])
        .where('vendors.is_active = :active', { active: 1 })
        .andWhere('vendors.is_deleted = :deleted', { deleted: 0 })
        .orderBy('vendors.vendor_name', 'ASC')
        .getRawMany();


      //  console.log("result", result);

      return {
        status: 'success',
        message:
          result.length > 0
            ? 'Vendors retrieved successfully.'
            : 'No organizational vendors found.',
        data: result,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Error fetching vendors: ${error.message}`);
    }
  }
  async fetchOrganizationVendors1(payload: {
    gststatus?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string; // e.g. "vendor_name", "vendor_email"
    sortOrder?: 'ASC' | 'DESC'; // "ASC" or "DESC"
  }): Promise<any> {
    try {
      const {
        gststatus,
        status,
        page = 1,
        limit = 10,
        search,
        sortField = 'vendor_name', // default sort field
        sortOrder = 'ASC',          // default sort order
      } = payload;

      const query = this.vendorRepository
        .createQueryBuilder('vendors')
        .select([
          'vendors.vendor_id',
          'vendors.vendor_name',
          'vendors.vendor_primary_contact',
          'vendors.vendor_email',
          'vendors.vendor_contact_number',
          'vendors.vendor_gst_no',
          'vendors.is_deleted',
          'vendors.is_active',
          'vendors.vendor_gst_status'
        ])
        .where('vendors.is_deleted = :deleted', { deleted: 0 });
      if (status && status !== 'All') {
        const isActive = status === 'Active' ? 1 : 0;
        query.andWhere('vendors.is_active = :isActive', { isActive });
      }

      if (gststatus && gststatus !== 'All') {
        query.andWhere('vendors.vendor_gst_status = :gststatus', { gststatus });
      }

      if (search && search.trim() !== '') {
        query.andWhere(
          `(
            vendors.vendor_name LIKE :search OR 
            vendors.vendor_email LIKE :search OR 
            vendors.vendor_contact_number LIKE :search OR 
            vendors.vendor_gst_no LIKE :search OR
            vendors.vendor_gst_status LIKE :search OR
            vendors.vendor_primary_contact LIKE :search
          )`,
          { search: `%${search}%` }
        );
      }

      // ✅ Dynamic sorting
      query.orderBy(`vendors.${sortField}`, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

      const [data, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return {
        status: 'success',
        message: data.length > 0 ? 'Vendors retrieved successfully.' : 'No vendors found.',
        data,
        meta: {
          total,
          page,
          limit,
          hasNextPage: total > page * limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Error fetching vendors: ${error.message}`);
    }
  }





  // add vender

  async createNewVendor(payload: any, userId: number) {

    // Check if vendor name already exists (still required)
    const existingVendor = await this.vendorRepository.findOne({
      where: { vendor_name: payload.vendor_name, is_deleted: 0 },
    });

    if (existingVendor) {
      throw new HttpException(
        'Vendor name already exists',
        HttpStatus.CONFLICT,
      );
    }

    // Optional: Check if email already exists
    if (payload.vendor_email) {
      const existingEmail = await this.vendorRepository.findOne({
        where: { vendor_email: payload.vendor_email },
      });

      if (existingEmail) {
        throw new HttpException(
          `Vendor email '${payload.vendor_email}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    // Optional: Check if contact number already exists
    if (payload.vendor_contact_number) {
      const existingMobileNumber = await this.vendorRepository.findOne({
        where: { vendor_contact_number: payload.vendor_contact_number },
      });

      if (existingMobileNumber) {
        throw new HttpException(
          `Vendor contact number '${payload.vendor_contact_number}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const newVendor = this.vendorRepository.create({
      vendor_name: payload.vendor_name,
      vendor_gst_no: payload.vendor_gst_no,
      vendor_contact_number: payload.vendor_contact_number,
      vendor_alternative_contact_number: payload.vendor_alternative_contact_number,
      vendor_email: payload.vendor_email,
      vendor_primary_contact: payload.vendor_primary_contact,
      vendor_street: payload.vendor_street,
      vendor_landmark: payload.vendor_landmark,
      vendor_country: payload.vendor_country,
      vendor_city: payload.vendor_city,
      vendor_state: payload.vendor_state,
      vendor_pincode: payload.vendor_pincode,
      vendor_first_name: payload.vendor_first_name,
      vendor_middle_name: payload.vendor_middle_name,
      vendor_last_name: payload.vendor_last_name,
      vendor_gst_status: payload.vendor_gst_status,
      vendor_department: payload.vendor_department,
      vendor_degination: payload.vendor_degination,
    });

    const savedVendor = await this.vendorRepository.save(newVendor);

    return {
      status: HttpStatus.CREATED,
      message: 'Vendor created successfully',
      data: savedVendor,
    };
  }

  async updateVendorData(updatePayload: any) {
    const {
      vendor_id,
      vendor_name,
      vendor_gst_no,
      vendor_alternative_contact_number,
      vendor_contact_number,
      vendor_email,
      vendor_primary_contact,
      vendor_street,
      vendor_landmark,
      vendor_city,
      vendor_state,
      vendor_country,
      vendor_pincode,
      vendor_first_name,
      vendor_middle_name,
      vendor_last_name,
      vendor_gst_status,
      vendor_department,
      vendor_degination,
      vendor_display_name
    } = updatePayload;

    // Step 1: Find the existing vendor
    const existingVendor = await this.vendorRepository.findOne({
      where: { vendor_id },
    });

    if (!existingVendor) {
      throw new HttpException(
        `Vendor with ID ${vendor_id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Step 2: Check if vendor_name is already taken by another vendor
    const duplicateVendorName = await this.vendorRepository.findOne({
      where: { vendor_name },
    });

    if (duplicateVendorName && duplicateVendorName.vendor_id !== vendor_id) {
      throw new HttpException(
        `Vendor name '${vendor_name}' already exists`,
        HttpStatus.CONFLICT,
      );
    }

    // Step 3: Check if email already exists for another vendor
    if (vendor_email) {
      const duplicateEmail = await this.vendorRepository.findOne({
        where: { vendor_email },
      });

      if (duplicateEmail && duplicateEmail.vendor_id !== vendor_id) {
        throw new HttpException(
          `Vendor email '${vendor_email}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    // Step 4: Check if contact number already exists for another vendor
    if (vendor_contact_number) {
      const duplicateContact = await this.vendorRepository.findOne({
        where: { vendor_contact_number },
      });

      if (duplicateContact && duplicateContact.vendor_id !== vendor_id) {
        throw new HttpException(
          `Vendor contact number '${vendor_contact_number}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    // Step 5: Update fields
    existingVendor.vendor_name = vendor_name;
    existingVendor.vendor_gst_no = vendor_gst_no || '';
    existingVendor.vendor_alternative_contact_number = vendor_alternative_contact_number;
    existingVendor.vendor_email = vendor_email;
    existingVendor.vendor_primary_contact = vendor_primary_contact;
    existingVendor.vendor_contact_number = vendor_contact_number;
    existingVendor.vendor_street = vendor_street;
    existingVendor.vendor_landmark = vendor_landmark;
    existingVendor.vendor_city = vendor_city;
    existingVendor.vendor_country = vendor_country;
    existingVendor.vendor_state = vendor_state;
    existingVendor.vendor_pincode = vendor_pincode;
    existingVendor.vendor_first_name = vendor_first_name;
    existingVendor.vendor_middle_name = vendor_middle_name;
    existingVendor.vendor_last_name = vendor_last_name;
    existingVendor.vendor_gst_status = vendor_gst_status;
    existingVendor.vendor_department = vendor_department;
    existingVendor.vendor_degination = vendor_degination;
    existingVendor.vendor_display_name = vendor_display_name;

    // Step 6: Save updated vendor
    const updatedVendor = await this.vendorRepository.save(existingVendor);

    // Step 7: Return response
    return {
      status: HttpStatus.OK,
      message: 'Vendor updated successfully',
      data: updatedVendor,
    };
  }

  // Activate vendors (single or bulk)
  async activateVendors(dto: VendorIdListDto) {

    console.log("dto2", dto)

    const { vendor_ids } = dto;
    const updated = [];
    const failed = [];

    for (const id of vendor_ids) {
      try {
        const vendor = await this.vendorRepository.findOne({
          where: { vendor_id: id, is_deleted: 0 },
        });

        if (!vendor) {
          failed.push({ vendor_id: id, message: 'Vendor not found or deleted' });
          continue;
        }

        vendor.is_active = 1;
        await this.vendorRepository.save(vendor);

        updated.push({ vendor_id: id, status: 'activated' });
      } catch (error) {
        failed.push({ vendor_id: id, message: error.message });
      }
    }

    return {
      status: 'success',
      message: 'Activation process completed',
      data: { updated, failed },
    };

  }

  // Deactivate vendors (single or bulk)
  async deactivateVendors(dto: VendorIdListDto) {

    console.log("dto2", dto)


    const { vendor_ids } = dto;
    const updated = [];
    const failed = [];

    for (const id of vendor_ids) {
      try {
        const vendor = await this.vendorRepository.findOne({
          where: { vendor_id: id, is_deleted: 0 },
        });

        if (!vendor) {
          failed.push({ vendor_id: id, message: 'Vendor not found or deleted' });
          continue;
        }

        vendor.is_active = 0;
        await this.vendorRepository.save(vendor);

        updated.push({ vendor_id: id, status: 'deactivated' });
      } catch (error) {
        failed.push({ vendor_id: id, message: error.message });
      }
    }

    return {
      status: 'success',
      message: 'Deactivation process completed',
      data: { updated, failed },
    };
  }

  // BulkImport
  async generateVendorTemplate() {
    try {
      const workbook = await XlsxPopulate.fromBlankAsync();
      const mainSheet = workbook.sheet(0);
      mainSheet.name('Vendor_Template');
      const dataSheet = workbook.addSheet('Data');

      // Instructions (unchanged)
      const instructions = [
        'Instructions:',
        '1. Fill in the fields starting from row 7.',
        '2. Dropdown fields: State, Country.',
        '3. Do not edit the header row (Row 6).',
        '4. Phone Number and Alternative Contact Number, if provided, must be 10 digits starting with 9.',
        '5. Postal/Zip Code, if provided, must be a 6-digit number.',
        '6. GST No., if provided, must be a 15-character alphanumeric string.',
        '7. Email Address, if provided, must be a valid email (e.g., user@example.com).',
      ];
      instructions.forEach((text, index) => {
        mainSheet
          .cell(index + 1, 1)
          .value(text)
          .style({ bold: true, fontColor: '0000FF' });
      });

      // Final header list
      const headers = [
        { label: 'First Name', required: false },                 // A
        { label: 'Middle Name', required: false },                // B
        { label: 'Last Name', required: false },                  // C
        { label: 'Vendor Email', required: false },               // D
        { label: 'Phone Number', required: false },               // E
        { label: 'Department', required: false },                 // F
        { label: 'Organization Name', required: true },           // G
        { label: 'Display Name', required: true },                // H
        { label: 'GST Number', required: true },                  // I
        { label: 'Street Address', required: true },              // J
        { label: 'City', required: true },                        // K
        { label: 'State', required: true },                       // L
        { label: 'PinCode', required: true },                     // M
        { label: 'Landmark', required: true },                    // N
        { label: 'Country', required: true },                     // O
      ];

      const columnWidths = [
        20, // A - First Name
        20, // B - Middle Name
        20, // C - Last Name
        30, // D - Vendor Email
        20, // E - Phone Number
        25, // F - Department
        30, // G - Organization Name
        30, // H - Display Name
        20, // I - GST Number
        25, // J - Street Address
        20, // K - City
        20, // L - State
        15, // M - PinCode
        20, // N - Landmark
        20, // O - Country
      ];

      columnWidths.forEach((width, index) => {
        mainSheet.column(index + 1).width(width);
      });

      headers.forEach((item, index) => {
        mainSheet.cell(8, index + 1).value(item.label).style({
          bold: true,
          fontColor: '000000',
        });
      });

      // Populate Data Sheet
      const states = ['Maharashtra', 'Goa', 'Karnataka', 'Gujarat'];
      const countries = ['India'];
      const departments = ['Sales', 'Procurement', 'Marketing', 'Information-Technology', 'Human-Resources', 'Customer-Service', 'Finance', 'Operations'];

      states.forEach((state, index) => dataSheet.cell(index + 1, 1).value(state));
      countries.forEach((country, index) => dataSheet.cell(index + 1, 2).value(country));
      departments.forEach((departments, index) => dataSheet.cell(index + 1, 3).value(departments));

      const startRow = 9;
      const maxExcelRows = 1048576;
      const quotedStateList = `"${states.join(',')}"`;
      const quotedCountryList = `"${countries.join(',')}"`;
      const quotedDepartmentList = `"${departments.join(',')}"`;

      // Apply dropdowns
      mainSheet.range(`L${startRow}:L${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: quotedStateList,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Select State',
        prompt: 'Choose one from the dropdown',
        errorTitle: 'Invalid State',
        error: 'Please select a valid state from the list.',
      });

      mainSheet.range(`O${startRow}:O${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: quotedCountryList,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Select Country',
        prompt: 'Choose one from the dropdown',
        errorTitle: 'Invalid Country',
        error: 'Please select a valid country from the list.',
      });

      mainSheet.range(`F${startRow}:F${maxExcelRows}`).dataValidation({
        type: 'list',
        formula1: quotedDepartmentList,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: 'Select Department',
        prompt: 'Choose one from the dropdown',
        errorTitle: 'Invalid Department',
        error: 'Please select a valid department from the list.',
      });

      // Validations — update column letters to match new structure
      mainSheet.range(`E${startRow}:E${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(E7),AND(LEN(E7)=10,LEFT(E7,1)="9"))`,
        allowBlank: true,
        promptTitle: 'Phone Number',
        errorTitle: 'Invalid Phone Number',
        error: 'Phone number must be 10 digits and start with 9.',
      });

      mainSheet.range(`D${startRow}:D${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(D7),AND(LEN(D7)>5,ISNUMBER(FIND("@",D7)),ISNUMBER(FIND(".",D7))))`,
        allowBlank: true,
        promptTitle: 'Email Address',
        errorTitle: 'Invalid Email',
        error: 'Email must be valid and include @ and .',
      });

      mainSheet.range(`I${startRow}:I${maxExcelRows}`).dataValidation({
        type: 'custom',
        formula1: `=OR(ISBLANK(I7),AND(LEN(I7)=15,ISNUMBER(SUBSTITUTE(UPPER(I7)," ","")+0)=FALSE))`,
        allowBlank: true,
        promptTitle: 'GST Number',
        errorTitle: 'Invalid GST No.',
        error: 'GST No. must be a 15-character alphanumeric string.',
      });

      mainSheet.range(`M${startRow}:M${maxExcelRows}`).dataValidation({
        type: 'whole',
        operator: 'between',
        formula1: '100000',
        formula2: '999999',
        allowBlank: true,
        promptTitle: 'PinCode',
        errorTitle: 'Invalid Pin Code',
        error: 'Pin code must be a 6-digit number.',
      });

      dataSheet.hidden(true);

      const buffer = await workbook.outputAsync();
      return buffer;
    } catch (error) {
      console.error('Error generating vendor template:', error);
      throw new Error('Failed to generate Excel vendor template');
    }
  }

  async bulkCreateVendors(dtos: any[], user_id: number) {
    const successVendors = [];
    const errorVendors = [];
    const newVendors = [];

    const existingVendors = await this.vendorRepository.find({
      where: { is_active: 1, is_deleted: 0 },
    });

    for (const dto of dtos) {
      // Validations (same as before)
      if (dto.vendor_name && typeof dto.vendor_name !== 'string') {
        errorVendors.push({ ...dto, reason: 'Vendor organization name must be text.' });
        continue;
      }

      if (dto.vendor_contact_number) {
        const phoneRegex = /^9\d{9}$/;
        if (!phoneRegex.test(dto.vendor_contact_number)) {
          errorVendors.push({ ...dto, reason: 'Phone number must be 10 digits and start with 9.' });
          continue;
        }
      }

      if (dto.vendor_street && typeof dto.vendor_street !== 'string') {
        errorVendors.push({ ...dto, reason: 'Street must be text.' });
        continue;
      }

      if (dto.vendor_landmark && typeof dto.vendor_landmark !== 'string') {
        errorVendors.push({ ...dto, reason: 'Landmark must be text.' });
        continue;
      }

      if (dto.vendor_city && typeof dto.vendor_city !== 'string') {
        errorVendors.push({ ...dto, reason: 'City must be text.' });
        continue;
      }

      if (dto.vendor_state) {
        const validStates = ['Maharashtra', 'Goa', 'Karnataka', 'Gujarat'];
        if (!validStates.includes(dto.vendor_state)) {
          errorVendors.push({
            ...dto,
            reason: 'Invalid state. Must be one of: Maharashtra, Goa, Karnataka, Gujarat.',
          });
          continue;
        }
      }

      if (dto.vendor_pincode) {
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(dto.vendor_pincode)) {
          errorVendors.push({ ...dto, reason: 'Zip code must be a 6-digit number.' });
          continue;
        }
      }

      if (dto.vendor_country) {
        const validCountries = ['India'];
        if (!validCountries.includes(dto.vendor_country)) {
          errorVendors.push({ ...dto, reason: 'Invalid country. Must be India.' });
          continue;
        }
      }

      if (dto.vendor_alternative_contact_number) {
        const phoneRegex = /^9\d{9}$/;
        if (!phoneRegex.test(dto.vendor_alternative_contact_number)) {
          errorVendors.push({
            ...dto,
            reason: 'Alternative contact number must be 10 digits and start with 9.',
          });
          continue;
        }
      }

      if (dto.vendor_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.vendor_email) || dto.vendor_email.length <= 5) {
          errorVendors.push({ ...dto, reason: 'Email must be valid and include @ and .' });
          continue;
        }
      }

      if (dto.vendor_gst_no) {
        const gstRegex = /^[A-Za-z0-9]{15}$/;
        if (!gstRegex.test(dto.vendor_gst_no)) {
          errorVendors.push({ ...dto, reason: 'GST No. must be a 15-character alphanumeric string.' });
          continue;
        }
      }

      if (dto.vendor_primary_contact && typeof dto.vendor_primary_contact !== 'string') {
        errorVendors.push({ ...dto, reason: 'Primary contact details must be text.' });
        continue;
      }

      if (dto.vendor_first_name && typeof dto.vendor_first_name !== 'string') {
        errorVendors.push({ ...dto, reason: 'First Name must be text.' });
        continue;
      }

      if (dto.vendor_middle_name && typeof dto.vendor_middle_name !== 'string') {
        errorVendors.push({ ...dto, reason: 'Middle Name must be text.' });
        continue;
      }

      if (dto.vendor_last_name && typeof dto.vendor_last_name !== 'string') {
        errorVendors.push({ ...dto, reason: 'Last Name must be text.' });
        continue;
      }

      if (dto.vendor_department && typeof dto.vendor_department !== 'string') {
        errorVendors.push({ ...dto, reason: 'Department must be text.' });
        continue;
      }

      if (dto.vendor_display_name && typeof dto.vendor_display_name !== 'string') {
        errorVendors.push({ ...dto, reason: 'Display Name must be text.' });
        continue;
      }

      if (dto.vendor_degination && typeof dto.vendor_degination !== 'string') {
        errorVendors.push({ ...dto, reason: 'Designation must be text.' });
        continue;
      }

      const vendorExists = existingVendors.some(
        (vendor) =>
          vendor.vendor_name?.trim().toLowerCase() === dto.vendor_name?.trim().toLowerCase(),
      );

      if (vendorExists) {
        errorVendors.push({ ...dto, reason: 'Vendor already exists' });
        continue;
      }

      // ✅ Set GST Status based on GST No.
      dto.vendor_gst_status = dto.vendor_gst_no ? 'Register' : 'Unregister';

      // Create new vendor
      const newVendor = this.vendorRepository.create({
        vendor_name: dto.vendor_name,
        vendor_gst_no: dto.vendor_gst_no,
        vendor_contact_number: dto.vendor_contact_number,
        vendor_alternative_contact_number: dto.vendor_alternative_contact_number,
        vendor_email: dto.vendor_email,
        vendor_street: dto.vendor_street,
        vendor_landmark: dto.vendor_landmark,
        vendor_country: dto.vendor_country,
        vendor_city: dto.vendor_city,
        vendor_state: dto.vendor_state,
        vendor_pincode: dto.vendor_pincode,
        vendor_primary_contact: dto.vendor_primary_contact,
        vendor_first_name: dto.vendor_first_name,
        vendor_middle_name: dto.vendor_middle_name,
        vendor_last_name: dto.vendor_last_name,
        vendor_department: dto.vendor_department,
        vendor_display_name: dto.vendor_display_name,
        vendor_degination: dto.vendor_degination,
        vendor_gst_status: dto.vendor_gst_status,
        is_active: 1,
        is_deleted: 0,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
      });

      newVendors.push({ dto, newVendor });
    }

    try {
      const toSave = newVendors.map((entry) => entry.newVendor);
      const savedVendors = await this.vendorRepository.save(toSave);
      savedVendors.forEach((saved, index) => {
        successVendors.push(newVendors[index].dto);
      });
    } catch (error) {
      console.error('Error during bulk save:', error);
      newVendors.forEach((entry) =>
        errorVendors.push({ ...entry.dto, reason: 'Batch save error' }),
      );
    }

    return {
      status: successVendors.length ? HttpStatus.CREATED : HttpStatus.CONFLICT,
      message:
        successVendors.length && errorVendors.length
          ? 'Bulk vendors created with some conflicts.'
          : successVendors.length
            ? 'All vendors created successfully.'
            : 'No vendors created. All entries had conflicts or invalid data.',
      data: {
        created_count: successVendors.length,
        created_vendors: successVendors,
        error_vendors: errorVendors,
      },
    };
  }

  async exportOrganizationVendorsExcel(payload: {
    gststatus?: string;
    status?: string;
    search?: string;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    selectedIds?: number[];
  }): Promise<Buffer> {
    const {
      gststatus,
      status,
      search,
      sortField = 'vendor_name',
      sortOrder = 'ASC',
      selectedIds,
    } = payload;

    const query = this.vendorRepository
      .createQueryBuilder('vendors')
      .select([
        'vendors.vendor_id',
        'vendors.vendor_name',
        'vendors.vendor_primary_contact',
        'vendors.vendor_email',
        'vendors.vendor_contact_number',
        'vendors.vendor_gst_no',
        'vendors.is_deleted',
        'vendors.is_active',
        'vendors.vendor_gst_status',
        'vendors.created_at',
      ])
      .where('vendors.is_deleted = :deleted', { deleted: 0 });

    if (status && status !== 'All') {
      const isActive = status === 'Active' ? 1 : 0;
      query.andWhere('vendors.is_active = :isActive', { isActive });
    }

    if (gststatus && gststatus !== 'All') {
      query.andWhere('vendors.vendor_gst_status = :gststatus', { gststatus });
    }

    if (search && search.trim() !== '') {
      query.andWhere(
        `(
        vendors.vendor_name LIKE :search OR 
        vendors.vendor_email LIKE :search OR 
        vendors.vendor_contact_number LIKE :search OR 
        vendors.vendor_gst_no LIKE :search OR
        vendors.vendor_gst_status LIKE :search OR
        vendors.vendor_primary_contact LIKE :search
      )`,
        { search: `%${search}%` }
      );
    }

    // Optional: Export only selected vendors
    if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
      query.andWhere('vendors.vendor_id IN (:...selectedIds)', { selectedIds });
    }

    query.orderBy(`vendors.${sortField}`, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

    const results = await query.getMany();

    // Generate Excel
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name('Vendors');

    const headers = [
      'Sr. No.',
      'Vendor Name',
      'Contact Person',
      'Email',
      'Mobile',
      'GST No',
      'GST Status',
      'Status',
      'Created At',
    ];

    headers.forEach((header, i) => {
      sheet.cell(1, i + 1).value(header).style({ bold: true });
    });

    results.forEach((vendor, index) => {
      const row = index + 2;
      sheet.cell(row, 1).value(index + 1);
      sheet.cell(row, 2).value(vendor.vendor_name || '');
      sheet.cell(row, 3).value(vendor.vendor_primary_contact || '');
      sheet.cell(row, 4).value(vendor.vendor_email || '');
      sheet.cell(row, 5).value(vendor.vendor_contact_number || '');
      sheet.cell(row, 6).value(vendor.vendor_gst_no || '');
      sheet.cell(row, 7).value(vendor.vendor_gst_status || '');
      sheet.cell(row, 8).value(vendor.is_active ? 'Active' : 'Inactive');
      sheet.cell(row, 9).value(
        vendor.created_at
          ? new Date(vendor.created_at).toLocaleDateString()
          : ''
      );
    });

    headers.forEach((_, i) => {
      sheet.column(i + 1).width(headers[i].length + 10);
    });

    return await workbook.outputAsync();
  }

  async getAllAssetsLocations(payload: {
    status?: string; // ✅ not stats
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<any> {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        search,
        sortField = 'location_name', // default sort field
        sortOrder = 'ASC',           // default sort order
      } = payload;

      const query = this.locationRepository
        .createQueryBuilder('location')
        .leftJoinAndSelect('location.branch', 'branch')
        .select([
          'location.location_id',
          'location.location_name',
          'location.branch_id',
          'location.location_floor_room',
          'location.location_city',
          'location.location_state',
          'location.location_total_asset',
          'location.created_at',
          'location.is_active',
          'location.is_deleted',

          'branch.branch_id',
          'branch.branch_name',
          'branch.city',
          'branch.state',
        ])
        .where("location.is_deleted = :deleted", { deleted: 0 })

      if (status && status !== 'All') {
        const isActive = status === 'Active' ? 1 : 0;
        query.andWhere('location.is_active = :isActive', { isActive });
      }

      // ✅ Search functionality
      if (search && search.trim() !== '') {
        query.andWhere(
          `(
          location.location_name ILIKE :search OR
          location.location_floor_room ILIKE :search OR
          location.location_city ILIKE :search OR
          location.location_state ILIKE :search OR
          CAST(location.location_total_asset AS TEXT) ILIKE :search OR
          CAST(location.is_active AS TEXT) ILIKE :search OR
          branch.branch_name ILIKE :search OR
          branch.city ILIKE :search OR
          branch.state ILIKE :search
        )`,
          { search: `%${search}%` }
        );
      }

      // ✅ Dynamic sorting
      query.orderBy(`location.${sortField}`, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

      // ✅ Pagination
      const [data, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        status: 'success',
        message: data.length > 0 ? 'Locations retrieved successfully.' : 'No locations found.',
        data,
        meta: {
          total,
          page,
          limit,
          hasNextPage: total > page * limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Error fetching locations: ${error.message}`);
    }
  }


  async exportLocationsExcel(payload: {
    status?: string;
    search?: string;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    selectedIds?: number[];
  }): Promise<Buffer> {
    const {
      status,
      search,
      sortField = 'location_name', // default sort
      sortOrder = 'ASC',
      selectedIds,
    } = payload;

    try {
      const query = this.locationRepository
        .createQueryBuilder('location')
        .leftJoinAndSelect('location.branch', 'branch')
        .select([
          'location.location_id',
          'location.location_name',
          'location.branch_id',
          'location.location_floor_room',
          'location.location_city',
          'location.location_state',
          'location.location_total_asset',
          'location.created_at',
          'location.is_active',
          'location.is_deleted',

          'branch.branch_id',
          'branch.branch_name',
          'branch.city',
          'branch.state',
        ])
        .where('location.is_deleted = :deleted', { deleted: 0 });

      // ✅ Filter by status
      if (status && status !== 'All') {
        const isActive = status === 'Active' ? 1 : 0;
        query.andWhere('location.is_active = :isActive', { isActive });
      }

      // ✅ Search
      if (search && search.trim() !== '') {
        query.andWhere(
          `(
          location.location_name ILIKE :search OR
          location.location_floor_room ILIKE :search OR
          location.location_city ILIKE :search OR
          location.location_state ILIKE :search OR
          CAST(location.location_total_asset AS TEXT) ILIKE :search OR
          CAST(location.is_active AS TEXT) ILIKE :search OR
          branch.branch_name ILIKE :search OR
          branch.city ILIKE :search OR
          branch.state ILIKE :search
        )`,
          { search: `%${search}%` }
        );
      }

      // ✅ Export only selected IDs
      if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
        query.andWhere('location.location_id IN (:...selectedIds)', { selectedIds });
      }

      // ✅ Sorting
      query.orderBy(
        sortField.startsWith('branch.')
          ? sortField
          : `location.${sortField}`,
        sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      );

      const results = await query.getMany();

      // ✅ Create Excel workbook
      const workbook = await XlsxPopulate.fromBlankAsync();
      const sheet = workbook.sheet(0);
      sheet.name('Locations');

      const headers = [
        'Sr. No.',
        'Location Name',
        'Branch Name',
        'Floor/Room',
        'City',
        'State',
        'Total Assets',
        'Status',
        'Created At',
      ];

      // Header row
      headers.forEach((header, i) => {
        sheet.cell(1, i + 1).value(header).style({ bold: true });
      });

      // Data rows
      results.forEach((loc, index) => {
        const row = index + 2;
        sheet.cell(row, 1).value(index + 1); // Sr. No.
        sheet.cell(row, 2).value(loc.location_name || '');
        sheet.cell(row, 3).value(loc.branch?.branch_name || '');
        sheet.cell(row, 4).value(loc.location_floor_room || '');
        sheet.cell(row, 5).value(loc.location_city || '');
        sheet.cell(row, 6).value(loc.location_state || '');
        sheet.cell(row, 7).value(loc.location_total_asset || 0);
        sheet.cell(row, 8).value(loc.is_active ? 'Active' : 'Inactive');
        sheet.cell(row, 9).value(
          loc.created_at
            ? new Date(loc.created_at).toLocaleDateString()
            : ''
        );
      });

      // Auto column widths
      headers.forEach((_, i) => {
        sheet.column(i + 1).width(headers[i].length + 10);
      });

      return await workbook.outputAsync();
    } catch (error) {
      throw new BadRequestException(`Error exporting locations: ${error.message}`);
    }
  }


  async addNewLocation(payload: any, userId: number) {

    console.log("payload", payload);
    console.log("userId", userId);


    // Check if location name already exists
    const existingLocation = await this.locationRepository.findOne({
      where: { location_name: payload.location_name },
    });

    if (existingLocation) {
      throw new HttpException(
        'Location name already exists',
        HttpStatus.CONFLICT,
      );
    }

    const newLocation = this.locationRepository.create({
      location_name: payload.location_name,
      branch_id: parseInt(payload.branch_id),
      department_id: parseInt(payload.department_id),
      location_floor_room: payload.location_floor_room,
      // location_code: payload.location_code,
      // location_city: payload.location_city,
      // location_state: payload.location_state,
      location_total_asset: payload.location_total_asset ?? 0,
      location_street_address: payload.location_street_address,
      location_description: payload.location_description,
      // location_google_map_pin: payload.location_google_map_pin,

      //status 
      is_active: payload.is_active === true || payload.is_active === 'true' ? 1 : 0,

      created_at: new Date(),
      updated_at: new Date(),
      created_by: userId, // use logged-in user
      updated_by: null,
    });

    const savedLocation = await this.locationRepository.save(newLocation);


    return {
      status: HttpStatus.CREATED,
      message: 'Location created successfully',
      data: savedLocation,
    };
  }

  async getLocationById(location_id: number) {
    const location = await this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.branch', 'branch')
      .select([
        'location.location_id',
        'location.location_name',
        'location.branch_id',
        'location.location_floor_room',
        'location.location_city',
        'location.location_state',
        'location.location_total_asset',
        'location.created_at',
        'location.is_active',
        'location.is_deleted',
        'branch.branch_id',
        'branch.branch_name',
        'branch.city',
        'branch.state',
        'location.location_street_address',
        'location.location_description'
      ])
      .where('location.location_id = :id', { id: location_id })
      .getOne(); // Execute query

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: HttpStatus.OK,
      message: 'Location fetched successfully',
      data: location
    }
  }


  async deleteLocationsById(ids: number[] | number, userId: number) {
    const locationIds = Array.isArray(ids) ? ids : [ids];

    if (!locationIds.length) {
      throw new BadRequestException("No location IDs provided");
    }

    const locations = await this.locationRepository.find({
      where: { location_id: In(locationIds), is_deleted: 0 },
    });

    if (!locations.length) {
      throw new NotFoundException("No matching active locations found");
    }

    for (const location of locations) {
      location.is_deleted = 1;
      location.is_active = 0;
      location.updated_by = userId;
      location.updated_at = new Date();
    }

    await this.locationRepository.save(locations);

    return {
      message: `Soft deleted ${locations.length} location(s) successfully`,
      deletedIds: locations.map((loc) => loc.location_id),
    };
  }


  async updateLocation(payloadWithId: any, userId: number) {
    const { location_id, ...payload } = payloadWithId;

    // Find the existing location
    const location = await this.locationRepository.findOne({
      where: { location_id: location_id },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }


    // Merge new data into existing record
    const updatedLocation = this.locationRepository.merge(location, {
      location_name: payload.location_name,
      branch_id: payload.branch_id,
      department_id: payload.department_id,
      location_floor_room: payload.location_floor_room,
      // location_code: payload.location_code,
      // location_city: payload.location_city,
      // location_state: payload.location_state,
      // location_total_asset:payload.location_total_asset ?? location.location_total_asset,
      location_street_address: payload.location_street_address,
      location_description: payload.location_description,
      // location_google_map_pin: payload.location_google_map_pin,
      updated_at: new Date(),
      updated_by: userId,
    });

    const savedLocation = await this.locationRepository.save(updatedLocation);

    return {
      status: HttpStatus.OK,
      message: 'Location updated successfully',
      data: savedLocation,
    };
  }

  // Activate locations (single or bulk)
  async activateLocations(dto: { location_ids: number[] }) {
    const { location_ids } = dto;
    const updated = [];
    const failed = [];

    for (const id of location_ids) {
      try {
        const location = await this.locationRepository.findOne({
          where: { location_id: id, is_deleted: 0 },
        });

        if (!location) {
          failed.push({ location_id: id, message: 'Location not found or deleted' });
          continue;
        }

        location.is_active = 1;
        await this.locationRepository.save(location);

        updated.push({ location_id: id, status: 'activated' });
      } catch (error) {
        failed.push({ location_id: id, message: error.message });
      }
    }

    return {
      status: 'success',
      message: 'Activation process completed',
      data: { updated, failed },
    };
  }

  // Deactivate locations (single or bulk)
  async deactivateLocations(dto: { location_ids: number[] }) {
    const { location_ids } = dto;
    const updated = [];
    const failed = [];

    for (const id of location_ids) {
      try {
        const location = await this.locationRepository.findOne({
          where: { location_id: id, is_deleted: 0 },
        });

        if (!location) {
          failed.push({ location_id: id, message: 'Location not found or deleted' });
          continue;
        }

        location.is_active = 0; // ✅ deactivate
        await this.locationRepository.save(location);

        updated.push({ location_id: id, status: 'deactivated' });
      } catch (error) {
        failed.push({ location_id: id, message: error.message });
      }
    }

    return {
      status: 'success',
      message: 'Deactivation process completed',
      data: { updated, failed },
    };
  }

  async fetchOrganizationUsers(payload: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    customFilters?: Record<string, string[]>;
  }): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortField = 'first_name',
        sortOrder = 'ASC',
        customFilters = {},
      } = payload;

      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.user_role', 'role')
        .leftJoinAndSelect('user.user_department', 'department')
        .leftJoinAndSelect('user.user_designation', 'designation')
        .leftJoinAndSelect(Branch, 'branch', 'branch.branch_id = ANY(user.branches)') // branch join
        .select([
          'user.user_id',
          'user.first_name',
          'user.middle_name',
          'user.last_name',
          'user.users_business_email',
          'user.phone_number',
          'user.is_active',
          'user.is_deleted',
          'user.last_login',
          'user.branches', // array of branch ids

          'role.role_id',
          'role.role_name',

          'department.department_id',
          'department.department_name',

          'designation.designation_id',
          'designation.designation_name',

          'branch.branch_id',
          'branch.branch_name',
        ])
        .where('user.is_deleted = :deleted', { deleted: 0 });

      // ------------------- Filters -------------------
      for (const [filterKey, filterValues] of Object.entries(customFilters)) {
        if (!filterValues || filterValues.length === 0) continue;

        if (filterKey === 'status') {
          const filteredStatuses = filterValues.filter((v) => v !== 'All');
          if (filteredStatuses.length > 0) {
            const isActiveValues = filteredStatuses
              .map((status) => {
                if (status.toLowerCase() === 'active') return 1;
                if (status.toLowerCase() === 'inactive') return 0;
                return null;
              })
              .filter((v) => v !== null);

            if (isActiveValues.length > 0) {
              query.andWhere('user.is_active IN (:...isActiveValues)', {
                isActiveValues,
              });
            }
          }
        } else if (filterKey === 'branch_id') {
          // Postgres integer array overlap
          query.andWhere(`user.branches && :branchFilter`, {
            branchFilter: filterValues.map(Number),
          });
        } else {
          const allowedFilters = ['role_id', 'department_id', 'designation_id', 'city', 'state'];
          if (allowedFilters.includes(filterKey)) {
            query.andWhere(`user.${filterKey} IN (:...values)`, {
              values: filterValues,
            });
          }
        }
      }

      // ------------------- Search -------------------

      if (search && search.trim() !== '') {
        query.andWhere(
          `(
          CONCAT(user.first_name, ' ', user.last_name) LIKE :search OR
          user.users_business_email ILIKE :search OR
          user.phone_number ILIKE :search OR
          CAST(user.user_id AS TEXT) ILIKE :search OR
          branch.branch_name ILIKE :search OR
          role.role_name ILIKE :search
        )`,
          { search: `%${search}%` }
        );
      }

      // ------------------- Sorting -------------------
      const safeSortField = ['first_name', 'last_name', 'user_id', 'is_active'].includes(sortField)
        ? sortField
        : 'first_name';

      query.orderBy(`user.${safeSortField}`, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

      // ------------------- Pagination -------------------
      const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();

      return {
        status: 'success',
        message: data.length > 0 ? 'Users retrieved successfully.' : 'No users found.',
        data,
        meta: {
          total,
          page,
          limit,
          hasNextPage: total > page * limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new BadRequestException(`Error fetching users: ${error.message}`);
    }
  }



  async fetchSingleUsersData(user_id: number) {
    if (!user_id) throw new BadRequestException('User ID is required');

    try {
      // Fetch the user with role, designation, department
      const user = await this.userRepository.findOne({
        where: { user_id, is_active: 1, is_deleted: 0 },
        relations: ['user_role',
          'user_designation',
          'user_department',
          'assets_mapped',
          "assets_mapped",
          "assets_mapped.asset",
          "assets_mapped.asset.main_category",
          "assets_mapped.asset.sub_category",
          "assets_mapped.asset.asset_item",
          "assets_mapped.managed_user",
          "assets_mapped.status",
          "assets_mapped.added_by_user",
          "assets_mapped.user"
        ],
      });

      if (!user) {
        return {
          status: 404,
          message: `User with ID ${user_id} not found or inactive`,
          data: null,
        };
      }

      // Fetch branch details for this user
      const branches = await this.branchRepository
        .createQueryBuilder('branch')
        .where('branch.branch_id = ANY(:branchIds)', { branchIds: user.branches })
        .select(['branch.branch_id', 'branch.branch_name'])
        .getMany();

      // ✅ Fetch role with permissions
      const roleWithPermissions = await this.rolesPermissionRepository.findOne({
        where: { role_id: user.role_id, is_active: true, is_deleted: false },
        relations: ['permissions'],
      });

      let permissions: string[] = [];

      if (roleWithPermissions?.permissions?.length) {
        // Flatten role.permissions → module-level permissions
        roleWithPermissions.permissions.forEach((permEntity: any) => {
          if (Array.isArray(permEntity.permissions)) {
            permEntity.permissions.forEach((module: any) => {
              // If module has children
              if (Array.isArray(module.children)) {
                module.children.forEach((child) => {
                  const hasPermission = Object.entries(child).some(
                    ([key, value]) =>
                      ['edit', 'view', 'create', 'delete', 'export', 'import', 'fullaccess'].includes(
                        key,
                      ) && value === true,
                  );
                  if (hasPermission) permissions.push(module.moduleName);
                });
              } else {
                // Direct module permissions
                const hasPermission = Object.entries(module).some(
                  ([key, value]) =>
                    ['edit', 'view', 'create', 'delete', 'export', 'import', 'fullaccess'].includes(
                      key,
                    ) && value === true,
                );
                if (hasPermission) permissions.push(module.moduleName);
              }
            });
          }
        });
        // Remove duplicates
        permissions = [...new Set(permissions)];
      }

      // Replace branches array with detailed branch objects
      const formattedUser = {
        ...user,
        branches: branches.map((b) => ({
          branch_id: b.branch_id,
          branch_name: b.branch_name,
        })),
        permissions,
        assets_mapped: user.assets_mapped || [],
      };

      return {
        status: 200,
        message: 'User fetched successfully',
        data: formattedUser,
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the user',
        error: error.message,
      };
    }
  }

  async fetchSingleUsersDataOLD(fetchSingleUserDto: FetchSingleUserDto) {
    const { user_id } = fetchSingleUserDto;

    console.log('User ID payload:', user_id);

    // Validate if user_id is provided
    if (!user_id) {
      throw new BadRequestException('User ID is required');
    }

    try {
      // Fetch user data with related tables using QueryBuilder
      const usersData = await this.userRepository
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.user_role', 'user_role') // Join current_role_id with organization_roles
        .leftJoinAndSelect('users.user_department', 'user_department') // Join current_department_id with departments
        .leftJoinAndSelect('users.user_designation', 'user_designation') // Join current_designation_id with designations
        .leftJoinAndSelect('users.user_branch', 'user_branch') // Join branch_id with branches
        .leftJoinAndSelect('users.assets_mapped', 'assets_mapped') // Join branch_id with branches
        .leftJoinAndSelect('assets_mapped.asset', 'asset')
        .leftJoinAndSelect('assets_mapped.managed_user', 'managed_user')
        .leftJoinAndSelect('assets_mapped.status', 'status')
        .leftJoinAndSelect('assets_mapped.added_by_user', 'added_by_user')

        .leftJoinAndSelect('assets_mapped.user', 'user')

        .leftJoinAndSelect('asset.main_category', 'asset_main_category')
        .leftJoinAndSelect('asset.sub_category', 'asset_sub_category')
        .leftJoinAndSelect('asset.asset_item', 'asset_item')

        .where('users.user_id = :user_id', { user_id })
        .andWhere('users.is_active = :is_active', { is_active: true })
        .andWhere('users.is_deleted = :is_deleted', { is_deleted: false })
        .getOne();

      // Check if the user exists
      if (!usersData) {
        return {
          status: 404,
          message: `User with ID ${user_id} not found or inactive`,
          data: null,
        };
      }

      // Format the response
      return {
        status: 200,
        message: 'User fetched successfully',
        data: { usersData },
      };
    } catch (error) {
      return {
        status: 500,
        message: 'An error occurred while fetching the user',
        error: error.message,
      };
    }
  }

  async createNewUser(
    payload: any,
    organization_Id: number,
    decrypted_system_user_id: any,
  ) {

    // console.log("create new User:", payload)
    // console.log("organization_Id", organization_Id)
    // console.log("decrypted_system_user_id", decrypted_system_user_id)

    let existingUser = null;

    if (payload.phone_number) {

      existingUser = await this.userRepository.findOne({
        where: { phone_number: payload.phone_number },
      });

      if (existingUser) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: `Phone number '${payload.phone_number}' already exists in organization`,
          },
          HttpStatus.CONFLICT,
        );
      }
    }


    let existingUserPublic = null;
    let existingEmailPublic = null;

    if (payload.phone_number) {

      existingUserPublic = await this.registerUser.findOne({
        where: { phone_number: payload.phone_number },
      });

      if (existingUserPublic) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: `Phone number '${payload.phone_number}' is already used by another organization.`,
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    if (payload.users_business_email) {

      existingEmailPublic = await this.registerUser.findOne({
        where: { business_email: payload.users_business_email },
      });

      if (existingEmailPublic) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: `Email '${payload.users_business_email}' already exists in another organization.`,
          },
          HttpStatus.CONFLICT,
        );
      }

    }

    const OrganizationDataFetch = await this.registerOrganization.findOne({
      where: { organization_id: organization_Id },
    });

    console.log(OrganizationDataFetch.organization_name);


    const newUserLogin = this.registerUser.create({
      first_name: payload.first_name,
      last_name: payload.last_name,
      business_email: payload.users_business_email,
      phone_number: payload.phone_number,
      organization_id: organization_Id,
      password: null,
      is_primary_user: 'N',
      verified: false,
      organization: { organization_id: organization_Id },
    });

    let savedUserLogin: any;

    if (!existingUser && !existingUserPublic) {
      savedUserLogin = await this.registerUser.save(newUserLogin);
    }



    // console.log("branchArray", payload.branch);
    // console.log("Payload branch at create time:", payload.branch, Array.isArray(payload.branch));


    // const newUser = this.userRepository.create({
    //   created_by: Number(decrypted_system_user_id),
    //   first_name: payload.first_name,
    //   middle_name: payload.middle_name || '',
    //   last_name: payload.last_name,
    //   users_business_email: payload.users_business_email,
    //   phone_number: payload.phone_number,
    //   branches: payload.branch,
    //   role_id: payload.role_id,
    //   designation_id: payload.designation_id,
    //   department_id: payload.department_id,
    //   street: payload.street,
    //   landmark: payload.landmark,
    //   country: payload.country,
    //   city: payload.city,
    //   state: payload.state,
    //   zip: payload.zip,
    //   organization_id: organization_Id,
    //   register_user_login_id: savedUserLogin.user_id,
    //   is_department_head: payload.is_department_head
    // });
    const newUser = this.userRepository.create({
  created_by: Number(decrypted_system_user_id),
  first_name: payload.first_name,
  middle_name: payload.middle_name || '',
  last_name: payload.last_name,
  users_business_email: payload.users_business_email,
  phone_number: payload.phone_number,
  branches: payload.branch || [],
  role_id: payload.role_id ? Number(payload.role_id) : null,
  designation_id: payload.designation_id ? Number(payload.designation_id) : null,
  department_id: payload.department_id ? Number(payload.department_id) : null,
  street: payload.street || null,
  landmark: payload.landmark || null,
  country: payload.country || null,
  city: payload.city || null,
  state: payload.state || null,
  zip: payload.zip || null,
  organization_id: organization_Id,
  register_user_login_id: savedUserLogin.user_id,
  is_department_head: !!payload.is_department_head,
});


    let savedUser: any;

    if (!existingUser && !existingUserPublic) {

      console.log("newUser arrr ", newUser);
      savedUser = await this.userRepository.save(newUser);
    }

    // ✅ Send invitation only if email is provided
    if (payload.users_business_email) {
      const invitationUrl = `${process.env.CLIENT_ORIGIN_URL}/passwordset/accept-invite?userId=${savedUserLogin.user_id}`;

      const fullname = `${payload.first_name} ${payload.middle_name || ''} ${payload.last_name}`;
      const OrgName = OrganizationDataFetch.organization_name;

      const result = await this.authService.fetchUserLoginProfile(
        Number(decrypted_system_user_id),
      );

      const userLoginData = await this.registerUser.findOne({
        where: { user_id: savedUserLogin.user_id },
      });

      await this.mailService.sendEmail(
        payload.users_business_email,
        "You're Invited to Join " + OrgName,
        await renderEmail(
          EmailTemplate.NEW_USER_INVITATION,
          {
            name: fullname.trim(),
            inviter: `${result.first_name} ${result.last_name}`,
            companyName: OrgName,
            companyLogo: null,
            mailReply: 'support@norbik.in',
            inviteUrl: invitationUrl,
            verified: userLoginData?.verified || false,
          },
          this.mailConfigService,
        ),
      );
    }

    // Return the success response in REST API format
    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      data: {
        user: savedUser,
      },
    };
  }


  async updateUserManagementData(payload: any) {
    console.log("payload1", JSON.stringify(payload, null, 2));
    const {
      userId: user_id, // Rename userId to user_id
      first_name,
      middle_name,
      last_name,
      phone_number,
      users_business_email,
      role_id,
      department_id,
      designation_id,
      branch,
      street,
      landmark,
      city,
      state,
      country,
      zip,
      is_active,
      is_department_head,
    } = payload;

    console.log("user_id and first_name", user_id, first_name);

    // Validate required fields for private table
    if (!user_id || !first_name) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: 'User ID and first name are required' },
        HttpStatus.BAD_REQUEST
      );
    }

    // Fetch private user with related public user
    const existingUser = await this.userRepository.findOne({
      where: { user_id },
      relations: ['userLogintable'],
    });

    if (!existingUser) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: `User with ID ${user_id} not found` },
        HttpStatus.NOT_FOUND
      );
    }

    const existingUserLogin = existingUser.userLogintable;
    if (!existingUserLogin) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, message: `User login details not found for user ID ${user_id}` },
        HttpStatus.NOT_FOUND
      );
    }

    // Check email uniqueness in private table (if provided and different from current)
    if (users_business_email && users_business_email !== existingUser.users_business_email) {
      const emailInUsePrivate = await this.userRepository.findOne({
        where: { users_business_email, user_id: Not(user_id) },
      });

      if (emailInUsePrivate) {
        throw new HttpException(
          { status: HttpStatus.CONFLICT, message: `Email '${users_business_email}' is already in use` },
          HttpStatus.CONFLICT
        );
      }
    }

    // Check phone number uniqueness in private table (if provided and different from current)
    if (phone_number && phone_number !== existingUser.phone_number) {
      const phoneInUsePrivate = await this.userRepository.findOne({
        where: { phone_number, user_id: Not(user_id) },
      });

      if (phoneInUsePrivate) {
        throw new HttpException(
          { status: HttpStatus.CONFLICT, message: `Phone number '${phone_number}' is already in use` },
          HttpStatus.CONFLICT
        );
      }
    }

    // Update private user fields
    Object.assign(existingUser, {
      first_name,
      middle_name: middle_name || existingUser.middle_name || '',
      last_name: last_name || existingUser.last_name,
      users_business_email: users_business_email || existingUser.users_business_email,
      phone_number: phone_number || existingUser.phone_number,
      role_id: role_id || existingUser.role_id,
      department_id: department_id || existingUser.department_id,
      designation_id: designation_id || existingUser.designation_id,
      branches: branch?.map(Number) || existingUser.branches,
      street: street || existingUser.street,
      landmark: landmark || existingUser.landmark,
      city: city || existingUser.city,
      state: state || existingUser.state,
      country: country || existingUser.country,
      zip: zip || existingUser.zip,
      is_active: is_active !== undefined ? is_active : existingUser.is_active,
      is_department_head: is_department_head !== undefined ? is_department_head : existingUser.is_department_head,
      updated_at: new Date(),
    });

    // Save updated private user
    const updatedUser = await this.userRepository.save(existingUser);

    // Update public user fields (only if provided)
    Object.assign(existingUserLogin, {
      first_name: first_name !== undefined ? first_name : existingUserLogin.first_name,
      last_name: last_name !== undefined ? last_name : existingUserLogin.last_name,
      users_business_email: users_business_email !== undefined ? users_business_email : existingUserLogin.business_email,
      phone_number: phone_number !== undefined ? phone_number : existingUserLogin.phone_number,
    });

    // Save updated public user
    const updatedUserLogin = await this.registerUser.save(existingUserLogin);

    return {
      status: HttpStatus.OK,
      message: 'User updated successfully',
      data: { user: updatedUser, userLogin: updatedUserLogin },
    };
  }


  async activateUsers(userIds: number[], systemUserId: number) {
    const updated = [];
    const failed = [];

    for (const id of userIds) {
      try {
        // Find user in 'users' table
        const user = await this.userRepository.findOne({
          where: { user_id: id, is_deleted: 0 },
        });

        if (!user) {
          failed.push({ user_id: id, message: 'User not found or deleted' });
          continue;
        }

        // Activate user in 'users' table
        user.is_active = 1;
        await this.userRepository.save(user);

        // Activate corresponding login in 'register_user_login' table
        if (user.register_user_login_id) {
          await this.registerUser.update(
            { user_id: user.register_user_login_id },
            { is_active: 1 }
          );
        }

        updated.push({ user_id: id, status: 'activated' });

      } catch (error) {
        failed.push({ user_id: id, message: error.message });
      }
    }

    return {
      status: 'success',
      message: 'Activation process completed',
      data: { updated, failed },
    };
  }

  async deactivateUsers(userIds: number[], systemUserId: number) {
    const updated = [];
    const failed = [];

    for (const id of userIds) {
      try {
        // Find user in 'users' table
        const user = await this.userRepository.findOne({
          where: { user_id: id, is_deleted: 0 },
        });

        if (!user) {
          failed.push({ user_id: id, message: 'User not found or deleted' });
          continue;
        }

        // Activate user in 'users' table
        user.is_active = 0;
        await this.userRepository.save(user);

        // Activate corresponding login in 'register_user_login' table
        if (user.register_user_login_id) {
          await this.registerUser.update(
            { user_id: user.register_user_login_id },
            { is_active: 0 }
          );
        }

        updated.push({ user_id: id, status: 'deactivated' });

      } catch (error) {
        failed.push({ user_id: id, message: error.message });
      }
    }

    return {
      status: 'success',
      message: 'Activation process completed',
      data: { updated, failed },
    };
  }


  async exportFilteredExcelForUsers(payload: {
    search?: string;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    customFilters?: Record<string, string[]>;
    selectedIds?: number[];
  }): Promise<Buffer> {


    try {

      const {
        search,
        sortField = 'first_name',
        sortOrder = 'ASC',
        customFilters = {},
        selectedIds,
      } = payload;


      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.user_role', 'role')
        .leftJoinAndSelect('user.user_department', 'department')
        .leftJoinAndSelect('user.user_designation', 'designation')
        .leftJoinAndSelect(Branch, 'branch', 'branch.branch_id = ANY(user.branches)')
        .select([
          'user.user_id',
          'user.first_name',
          'user.middle_name',
          'user.last_name',
          'user.users_business_email',
          'user.phone_number',
          'user.is_active',
          'user.is_deleted',
          'user.last_login',
          'user.created_at',

          'role.role_id',
          'role.role_name',

          'department.department_id',
          'department.department_name',

          'designation.designation_id',
          'designation.designation_name',

          'branch.branch_id',
          'branch.branch_name',
        ])
        .where('user.is_deleted = :deleted', { deleted: 0 });


      // ------------------- Selected IDs -------------------
      if (selectedIds && selectedIds.length > 0) {
        query.andWhere('user.user_id IN (:...ids)', { ids: selectedIds });
      }

      // ------------------- Filters -------------------
      for (const [filterKey, filterValues] of Object.entries(customFilters)) {
        if (!filterValues || filterValues.length === 0) continue;

        if (filterKey === 'status') {
          const filteredStatuses = filterValues.filter((v) => v !== 'All');
          if (filteredStatuses.length > 0) {
            const isActiveValues = filteredStatuses
              .map((status) => {
                if (status.toLowerCase() === 'active') return 1;
                if (status.toLowerCase() === 'inactive') return 0;
                return null;
              })
              .filter((v) => v !== null);

            if (isActiveValues.length > 0) {
              query.andWhere('user.is_active IN (:...isActiveValues)', {
                isActiveValues,
              });
            }
          }
        } else if (filterKey === 'branch_id') {
          query.andWhere(`user.branches && :branchFilter`, {
            branchFilter: filterValues.map(Number),
          });
        } else {
          const allowedFilters = ['role_id', 'department_id', 'designation_id', 'city', 'state'];
          if (allowedFilters.includes(filterKey)) {
            query.andWhere(`user.${filterKey} IN (:...values)`, {
              values: filterValues,
            });
          }
        }
      }

      // ------------------- Search -------------------
      if (search && search.trim() !== '') {
        query.andWhere(
          `(
          CONCAT(user.first_name, ' ', user.last_name) ILIKE :search OR
          user.users_business_email ILIKE :search OR
          user.phone_number ILIKE :search OR
          CAST(user.user_id AS TEXT) ILIKE :search OR
          branch.branch_name ILIKE :search OR
          role.role_name ILIKE :search
        )`,
          { search: `%${search}%` },
        );
      }

      // ------------------- Sorting -------------------
      const safeSortField = ['first_name', 'last_name', 'user_id', 'is_active'].includes(sortField)
        ? sortField
        : 'first_name';

      query.orderBy(`user.${safeSortField}`, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

      // ------------------- Fetch Data -------------------
      const users = await query.getMany();


      // ------------------- Generate Excel -------------------
      const workbook = await XlsxPopulate.fromBlankAsync();
      const sheet = workbook.sheet(0);
      sheet.name('Users');

      const headers = [
        'Sr. No.',
        'First Name',
        'Middle Name',
        'Last Name',
        'Email',
        'Phone',
        'Branch',
        'Department',
        'Designation',
        'Role',
        'Status',
        'Created At',
        'Last Login',
      ];

      headers.forEach((header, index) => {
        sheet.cell(1, index + 1).value(header).style({ bold: true });
      });

      users.forEach((user, index) => {
        sheet.cell(index + 2, 1).value(index + 1);
        sheet.cell(index + 2, 2).value(user.first_name || '');
        sheet.cell(index + 2, 3).value(user.middle_name || '');
        sheet.cell(index + 2, 4).value(user.last_name || '');
        sheet.cell(index + 2, 5).value(user.users_business_email || '');
        sheet.cell(index + 2, 6).value(user.phone_number || '');
        sheet.cell(index + 2, 7).value(user['branch']?.branch_name || '');
        sheet.cell(index + 2, 8).value(user.user_department?.departmentName || '');
        sheet.cell(index + 2, 9).value(user.user_designation?.designation_name || '');
        sheet.cell(index + 2, 10).value(user.user_role?.role_name || '');
        sheet.cell(index + 2, 11).value(user.is_active ? 'Active' : 'Inactive');
        sheet.cell(index + 2, 12).value(
          user.created_at ? new Date(user.created_at).toLocaleString() : '',
        );
        sheet.cell(index + 2, 13).value(
          user.last_login ? new Date(user.last_login).toLocaleString() : '',
        );
      });

      headers.forEach((_, i) => {
        sheet.column(i + 1).width(headers[i].length + 10);
      });

      return await workbook.outputAsync();

    } catch (error) {

      console.error('Error exporting users:', error);
      throw new BadRequestException(`Error exporting users: ${error.message}`);
    }

  }



  async sendResetPasswordEmailByAdmin(
    userId: number,
    decrypted_system_user_id: number,
  ) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      // relations: ['register_user_login'],
    });

    console.log('USER FOR RESET', user);
    if (!user || !user.register_user_login_id) {
      throw new NotFoundException('User not found');
    }

    const loginUser = await this.registerUser.findOne({
      where: { user_id: user.register_user_login_id },
    });

    if (!loginUser) {
      throw new NotFoundException('Login user record not found');
    }

    // const admin = await this.registerUser.findOne({ where: { user_id: adminUserId } });
    const org = await this.registerOrganization.findOne({
      where: { organization_id: loginUser.organization_id },
    });
    const result = await this.authService.fetchUserLoginProfile(
      Number(decrypted_system_user_id),
    );
    // ✅ Create reset URL (same pattern as invite)
    const resetUrl = `${process.env.CLIENT_ORIGIN_URL}/authentication/passwordset/accept-invite?userId=${loginUser.user_id}`;

    await this.registerUser.update(
      { user_id: loginUser.user_id },
      { passwordReset: 'Y' },
    );

    // ✅ Send Email
    await this.mailService.sendEmail(
      loginUser.business_email,
      `Password Reset for your ${org.organization_name} Account`,
      await renderEmail(
        EmailTemplate.PASSWORD_RESET_BY_ADMIN,
        {
          name: `${loginUser.first_name} ${loginUser.last_name}`,
          inviter: `${result.first_name} ${result.last_name}`,
          companyName: org.organization_name,
          companyLogo: null,
          mailReply: 'support@norbik.in',
          resetPasswordUrl: resetUrl,
        },
        this.mailConfigService,
      ),
    );

    return {
      status: HttpStatus.OK,
      message: `Reset password email sent to ${loginUser.business_email}`,
    };
  }



  async getSubscriptionDetailsByOrganizationAsset(
    organization_profile_id: number,
  ): Promise<any> {
    try {
      // 1️⃣ Fetch subscription with joined plan, subscriptionType, and billing/payment relations
      const subscription = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .leftJoinAndSelect('sub.plan', 'plan')
        .leftJoinAndSelect('sub.subscriptionType', 'subscriptionType')
        .leftJoinAndSelect('sub.billingInfo', 'billingInfo') // <-- BillingInfo relation
        .leftJoinAndSelect('sub.paymentTransactions', 'paymentTransactions') // <-- PaymentTransactions relation
        .where('sub.organization_profile_id = :organization_profile_id', {
          organization_profile_id,
        })
        .andWhere('sub.is_active = :isActive', { isActive: true })
        .orderBy('sub.created_at', 'DESC') // latest subscription
        .getOne();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // 2️⃣ Fetch features via plan_id
      const featureMappings = await this.planFeatureMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.feature', 'feature')
        .where('mapping.plan = :plan_id', { plan_id: subscription.plan_id })
        .orderBy('feature.feature_name', 'ASC')
        .getMany();

      const features = featureMappings.map((mapping) => ({
        feature_id: mapping.feature?.feature_id,
        feature_name: mapping.feature?.feature_name,
        description: mapping.feature?.description,

        feature_value: mapping.feature_value,
      }));

      // 3️⃣ Return structured response
      return {
        subscription_id: subscription.subscription_id,
        organization_profile_id: subscription.organization_profile_id,
        plan: {
          plan_id: subscription.plan.plan_id,
          plan_name: subscription.plan.plan_name,
        },
        billingInfo: subscription.billingInfo?.map((b) => ({
          billing_id: b.billing_id,
          first_name: b.first_name,
          last_name: b.last_name,
          email: b.email,
          phone_number: b.phone_number,
          company_name: b.company_name,
          address_line1: b.address_line1,
          address_line2: b.address_line2,
          city: b.city,
          state: b.state,
          postal_code: b.postal_code,
          country: b.country,
          gst_number: b.gst_number,
          tax_id: b.tax_id,
          created_at: b.created_at,
          updated_at: b.updated_at,
        })) || [],
        paymentTransactions: subscription.paymentTransactions?.map((p) => ({
          transaction_id: p.transaction_id,
          amount: p.amount,
          currency: p.currency,
          payment_method: p.payment_method,
          card_last4: p.card_last4,
          card_expiry: p.card_expiry,
          card_holder_name: p.card_holder_name,
          transaction_status: p.transaction_status,
          transaction_reference: p.transaction_reference,
          paid_at: p.paid_at,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })) || [],
        subscription_type: subscription.subscriptionType?.type_name ?? null,
        price: subscription.price,
        discounted_price: subscription.discounted_price,
        grand_total: subscription.grand_total,
        start_date: subscription.start_date,
        renewal_date: subscription.renewal_date,
        payment_status: subscription.payment_status,
        payment_mode: subscription.payment_mode,
        purchase_date: subscription.purchase_date,
        plan_billing_id: subscription.plan_billing_id,
        auto_renewal: subscription.auto_renewal,
        features,
      };
    } catch (error) {
      console.error('Error fetching subscription details by org:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  // Payment modes
  async getAllPaymentModes(): Promise<PaymentMode[]> {
    try {
      return await this.paymentModeRepository.find({
        where: { is_deleted: false },   // exclude deleted modes
        order: { payment_mode_id: 'ASC' }, // order by ID
      });
    } catch (error) {
      throw new Error('Error fetching payment modes: ' + error.message);
    }
  }

  async createOfflinePaymentRequest(userId: number) {
    // 1️⃣ Find active subscription for the user
    const subscription = await this.subscriptionRepository.findOne({
      where: { created_by: userId, is_active: true },
      relations: ['billingInfo', 'plan'],
    });

    if (!subscription) {
      throw new Error('No active subscription found for this user');
    }

    // 2️⃣ Fetch user details from RegisterUserLogin
    const user = await this.registerUser.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2️⃣ Check or create billing info
    let billing = subscription.billingInfo?.[0];
    if (!billing) {
      // If no billing info exists, create it
      billing = this.billingInfoRepository.create({
        org_subscription_id: subscription.subscription_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.business_email,
        phone_number: user.phone_number,
        methodId: 5,
        created_at: new Date(),
        updated_at: new Date(),
      });

      billing = await this.billingInfoRepository.save(billing);
    }

    // 3️⃣ Create offline payment request
    const offlineRequest = this.offlinePaymentRepo.create({
      subscription_id: subscription.subscription_id,
      billing_id: billing.billing_id,
      plan_id: subscription.plan_id,
      amount: subscription.grand_total,
      currency: 'RS', // adjust if needed
      status: 'pending',
      created_by: userId,

    });

    return await this.offlinePaymentRepo.save(offlineRequest);
  }

  async createPayment(payload: CreatePaymentDto) {
    const { subscriptionId, billingData, transactionData } = payload;

    // 1️⃣ Find the subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { subscription_id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    // 2️⃣ Save Billing Info
    const billingInfo = this.billingInfoRepository.create({
      ...billingData,
      orgSubscription: subscription,
      methodId: 1,
    });
    await this.billingInfoRepository.save(billingInfo);

    // 3️⃣ Save Payment Transaction
    const paymentTransaction = this.paymentTransactionRepository.create({
      ...transactionData,
      orgSubscription: subscription,
      // payment_method: Number(transactionData.payment_method),
      payment_method: 1,

      methodId: 1,
      transaction_status: 'success', // Or get actual status from payment gateway
      paid_at: new Date(),
    });
    await this.paymentTransactionRepository.save(paymentTransaction);

    return { billingInfo, paymentTransaction };
  }

async getAllUsers(
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
): Promise<any> {
  try {
    const query = this.dataSource
      .getRepository(User)
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.user_role', 'user_role') // only join role
      .where('users.is_deleted = 0');

    // ✅ Search filter (first_name, last_name, email)
    if (search) {
      query.andWhere(
        '(users.first_name ILIKE :search OR users.last_name ILIKE :search OR users.users_business_email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // ✅ Status filter
    if (status) {
      if (status === 'Active') query.andWhere('users.is_active = :isActive', { isActive: 1 });
      if (status === 'Inactive') query.andWhere('users.is_active = :isActive', { isActive: 0 });
    }

    // ✅ Pagination
    const skip = (page - 1) * limit;
    const [result, total] = await query
      .orderBy('users.first_name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // ✅ Map user data
    const cleanedData = result.map((user) => ({
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.users_business_email,
      status: user.is_active === 1 ? 'Active' : 'Inactive',
      role: user.user_role?.role_name || null,
    }));

    return {
      message: 'Users fetched successfully',
      total,
      data: cleanedData,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new BadRequestException(`Error fetching Users: ${error.message}`);
  }
}



// subscription.service.ts or user.service.ts
async getAllUsersWithOrganization(
  page: number,
  limit: number,
  search: string,
  status: 'All' | 'Active' | 'Inactive',
): Promise<any> {
  try {
    const qb = this.registerUser
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization');

    // 🔹 Status filter
    if (status === 'Active') qb.andWhere('user.is_active = :active', { active: 1 });
    else if (status === 'Inactive') qb.andWhere('user.is_active = :active', { active: 0 });
    else qb.andWhere('user.is_deleted = :deleted', { deleted: 0 }); // default: only non-deleted users

    // 🔹 Search filter
    if (search) {
      qb.andWhere(
        '(LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(user.business_email) LIKE :search OR LOWER(organization.organization_name) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // 🔹 Pagination
    qb.orderBy('user.first_name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    // 🔹 Map results
    const mappedUsers = users.map((user) => ({
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.business_email,
      phoneNumber: user.phone_number,
      isPrimaryUser: user.is_primary_user,
      organization: {
        organizationId: user.organization?.organization_id,
        organizationName: user.organization?.organization_name,
        schemaName: user.organization?.organization_schema_name,
        industryId: user.organization?.industry_type_id,
      },
      status: user.is_active ? 'Active' : 'Inactive',
    }));

    return {
      data: mappedUsers,
      total,
      success: true,
      currentPage: page,
      pageSize: limit,
    };
  } catch (error) {
    console.error('Error fetching users with organization:', error);
    throw new BadRequestException(`Error fetching users: ${error.message}`);
  }
}



}
