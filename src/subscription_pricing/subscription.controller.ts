import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  HttpStatus,
  BadRequestException, NotFoundException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
  Get,
  Param,
  Query,
  HttpException,
  ExecutionContext
} from '@nestjs/common';
import { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { SubscriptionService } from './subscription.service';
import { OrganizationalProfileCommonData } from 'src/common/organizational-info/organizational-profile';
import { CreateSubscriptionTypeDto } from './dto/create-subscription-type.dto';
import { CreateOrgSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdateOrgSubscriptionDto } from './dto/update-subscription.dto';
import { CreateFeatureDto, UpdateFeatureDto } from './dto/feature.dto';
import { CreateMappingDto, UpdateMappingDto } from './dto/mapping.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { CreatePlanSettingDto, UpdatePlanSettingDto } from './dto/plan-setting.dto';
import { UpdateStatusDto } from './dto/billing-request.dto';
import { CreateCustomerDto } from './dto/create-customer.dto'
import { CreateOrderDto } from '../subscription_pricing/dto/create-order.dto'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@UseGuards(JwtAuthGuard, ApiKeyGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly organizationalProfileCommonData: OrganizationalProfileCommonData,

  ) { }
  //Create sunscription
  @Post('create-subscription-type')
  async createSubscriptionType(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createSubscriptionTypeDto: CreateSubscriptionTypeDto,
  ) {
    try {
      const organizationDetails = await this.organizationalProfileCommonData.getOrganizationDetails(req);
      const { loginUserId } = organizationDetails;
      console.log("loginUserId:", loginUserId);
      if (!loginUserId) {
        throw new NotFoundException('User is not logged in or organization details are incomplete');
      }
      console.log('Cookie Header Length:', req.headers.cookie?.length);

      const subscriptionType = await this.subscriptionService.createSubscriptionType(createSubscriptionTypeDto, loginUserId);

      return res.status(HttpStatus.CREATED).json({
        success: 200,
        message: 'Subscription type created successfully',
        data: subscriptionType,
      });
    } catch (error) {
      console.error('Error creating subscription type:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 400,
        message: error.message || 'Failed to create subscription type',
      });
    }
  }
  // Get subscription type
  @Get('subscription-types')
  async getAllSubscriptionTypes(@Res() res: Response) {

    try {
      const data = await this.subscriptionService.getAllSubscriptionTypes();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched subscription types successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching subscription types:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch subscription types',
      });
    }
  }
  //create the plan
  @Post('create-plan')
  async createNewPlan(
    @Body() payload: CreatePlanDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.subscriptionService.createPlan(payload);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Plan created successfully',
        data,
      });
    } catch (error) {
      console.error('Create Plan Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create plan',
      });
    }
  }
  // Update plan
  @Post('update-plan')
  async updatePlan(@Body() payload: any, @Res() res: Response) {
    try {
      if (!payload.plan_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'plan_id is required',
        });
      }

      const data = await this.subscriptionService.updatePlan(
        payload.plan_id,
        payload,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Plan updated successfully',
        data,
      });
    } catch (error) {
      console.error('Update Plan Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update plan',
      });
    }
  }

  // Fetch plan details by ID
  @Post('plan-details')
  async getPlanDetails(@Body() body: { plan_id: number }, @Res() res: Response) {
    try {
      const { plan_id } = body;

      if (!plan_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'plan_id is required',
        });
      }

      const data = await this.subscriptionService.getPlanDetailsById(plan_id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched plan details successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching plan details:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch plan details',
      });
    }
  }

  // Delete plan by ID
  @Post('delete-plan/:id')
  async deletePlan(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.subscriptionService.deletePlan(Number(id));
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Plan deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete plan',
      });
    }
  }

  //Get all plans
  @Get('fetch-all-plans')
  async getAllPlanDetails(@Res() res: Response) {

    try {
      const data = await this.subscriptionService.getAllPlanDetails();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched subscription types successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching subscription types:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch subscription types',
      });
    }
  }

  //Get Billing cycle for plan
  @Post('billing-cycles')
  async getBillingCyclesForPlanViaPayload(
    @Body() body: { plan_id: number },
    @Res() res: Response,
  ) {
    try {
      const { plan_id } = body;

      if (!plan_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'plan_id is required',
        });
      }

      const billingDetails = await this.subscriptionService.getBillingDetailsByPlanId(plan_id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched billing cycle details successfully',
        data: billingDetails,
      });
    } catch (error) {
      console.error('Error fetching billing cycles:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch billing cycle details',
      });
    }
  }
  //Get all billing cycles
  @Get('fetch-all-billing-cycles')
  async getAllBillingCycles(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getAllBillingCycles();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched all billing cycles successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching billing cycles:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch billing cycles',
      });
    }
  }
  //Get single billing cycles
  @Post('get-single-billing-cycles')
  async getBillingEntryById(
    @Body() body: { billing_id: number },
    @Res() res: Response,
  ) {
    const { billing_id } = body;

    if (!billing_id) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'billing_id is required',
      });
    }
    try {
      const data = await this.subscriptionService.getBillingEntryById(billing_id);

      if (!data) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: `Billing entry with id ${billing_id} not found`,
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched billing entry successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching billing entry:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch billing entry',
      });
    }
  }

  //Get features by plan
  @Post('plan-features')
  async getFeatureMappingsForPlan(
    @Body() body: { plan_id: number },
    @Res() res: Response,
  ) {
    try {
      const { plan_id } = body;

      if (!plan_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'plan_id is required',
        });
      }
      const data = await this.subscriptionService.getFeatureMappingsByPlanId(plan_id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched feature mappings successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching feature mappings:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch feature mappings',
      });
    }
  }
  //Get all plans with features
  @Post('plans-with-features')
  async getAllPlansWithFeatures(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getAllPlansWithFeatures();

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

  // Create subscription  
  @Post('create-org-subscription')
  async createOrgSubscription(
    @Body() payload: CreateOrgSubscriptionDto,
    @Res() res: Response,
    @Req() req,
  ) {
    const organizationDetails = await this.organizationalProfileCommonData.getOrganizationDetails(req);

    try {
      const result = await this.subscriptionService.createOrgSubscription(payload, organizationDetails.loginUserId);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Subscription(s) created successfully',
        data: result,
      });
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create subscription(s)',
      });
    }
  }

  // fetch single subscription  
  @Post('subscription-details')
  async getSubscriptionDetails(
    @Body() body: { subscription_id: number },
    @Res() res: Response,
  ) {
    try {
      const { subscription_id } = body;

      if (!subscription_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'subscription_id is required',
        });
      }

      const data = await this.subscriptionService.getSubscriptionDetailsById(subscription_id);

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

    // fetch single organisation  
  @Post('organization-details')
  async getOrganizationDetails(
    @Body() body: { organization_id: number },
    @Res() res: Response,
  ) {
    try {
      const { organization_id } = body;

      if (!organization_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'organization_id is required',
        });
      }

      const data = await this.subscriptionService.getOrganizationDetails(organization_id);

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
  // cancel subscription
  @Post('cancel-org-subscription')
  async cancelOrgSubscription(
    @Body() body: { organization_profile_id: number; subscription_id: number },
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const organizationDetails = await this.organizationalProfileCommonData.getOrganizationDetails(req);
      const { organization_profile_id, subscription_id } = body;
      console.log("organization_profile_id:", organization_profile_id, "or subscription_id:", subscription_id);

      if (!organization_profile_id || !subscription_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'organization_profile_id and subscription_id are required',
        });
      }


      // const message = await this.subscriptionService.cancelOrgSubscription(organization_profile_id, organizationDetails.loginUserId);
      const message = await this.subscriptionService.cancelOrgSubscription(
        organization_profile_id,
        subscription_id,
        organizationDetails.loginUserId,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('Subscription cancel failed:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to cancel subscription',
      });
    }
  }

  // update subscription
  @Post('update-subscription')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async updateOrgSubscription(
    @Body() dto: UpdateOrgSubscriptionDto,
    @Req() req,
  ) {
    const organizationDetails = await this.organizationalProfileCommonData.getOrganizationDetails(req);

    if (!dto.subscription_id) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'subscription_id is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const updatedSubscription = await this.subscriptionService.updateOrgSubscription(
        dto.subscription_id,
        dto,
        organizationDetails.organizationId,
        organizationDetails.loginUserId,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Subscription updated successfully',
        data: updatedSubscription,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || 'Failed to update subscription',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // get subscription history details
  @Post('subscription-history-details')
  async getSubscriptionHistoryDetails(
    @Body() body: { organisation_id: number },
    @Res() res: Response,
  ) {
    try {
      const { organisation_id } = body;

      if (!organisation_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'organisation_id is required',
        });
      }

      const data = await this.subscriptionService.getSubscriptionHistoryByOrgId(organisation_id);

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

  // get subscription log
  @Post('subscription-logs')
  async getSubscriptionLogs(
    @Body() body: { organization_profile_id: number },
    @Res() res: Response
  ) {
    const { organization_profile_id } = body;

    if (!organization_profile_id) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'organization_profile_id is required',
      });
    }
    try {
      const logs = await this.subscriptionService.getSubscriptionLogs(organization_profile_id);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch subscription logs',
      });
    }
  }

  // update the override values
  @Post('update-overrides')
  async updateOverrides(
    @Body('org_id') org_id: number,
    @Body('updates')
    updates:
      | { override_id?: number; feature_id: number; plan_id: number; mapping_id?: number; override_value: string; default_value?: string,  is_active?: boolean; is_deleted?: boolean; }[]
      | { override_id?: number; feature_id: number; plan_id: number; mapping_id?: number; override_value: string; default_value?: string,  is_active?: boolean; is_deleted?: boolean; },
  ) {
    try {
      const updated = await this.subscriptionService.updateOverrides(org_id, updates);

      return {
        statusCode: HttpStatus.OK,
        message: 'Override(s) upserted successfully',
        data: updated,
      };
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // get updated overrides values
  @Post('override-by-organisation')
  async getOverridesByOrganisation(
    @Body() body: { organisation_id: number },
    @Res() res: Response,
  ) {
    try {
      const { organisation_id } = body;

      if (!organisation_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'organisation_id is required',
        });
      }

      const data = await this.subscriptionService.getOverridesByOrgId(organisation_id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched overrides successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching overrides:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch overrides',
      });
    }
  }

  //Get all feature
  // controller
  @Get('get-all-features')
  async getAllFeatures(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'Active' | 'Inactive' = 'All',
    @Query('productId') productId?: number,
  ) {
    const { data, total } = await this.subscriptionService.getAllFeatures(
      Number(page),
      Number(limit),
      search,
      status,
      productId,
    );

    return {
      success: true,
      message: 'Fetched features successfully',
      data,
      total,
      page,
      limit,
    };
  }



  @Get('fetch-all-plans-with-billing')
  async getAllPlansWithBilling(
    @Res() res: Response,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'Active' | 'Inactive' = 'All',
    @Query('productId') productId?: number,
  ) {
    try {
      const { data, total } = await this.subscriptionService.getAllPlansWithBilling(
        Number(page),
        Number(limit),
        search,
        status,
        productId,
      );
      console.log("status:", status);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched plans with billing successfully',
        data,
        total,
        page,
        limit,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch plans with billing',
      });
    }
  }

  @Get('fetch-all-plans-with-billing-and-features')
  async getAllPlansWithBillingAndFeatures(
    @Res() res: Response,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'Active' | 'Inactive' = 'All',
    @Query('productId') productId?: number,
    @Query('planId') planId?: number,
  ) {
    try {
      const { data, total } =
        await this.subscriptionService.getAllPlansWithBillingAndFeatures(
          Number(page),
          Number(limit),
          search,
          status,
          productId ? Number(productId) : undefined,
          planId ? Number(planId) : undefined,
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched plans with billing and features successfully',
        data,
        total,
        page,
        limit,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || 'Failed to fetch plans with billing and features',
      });
    }
  }

  //add feature
  @Post('create-feature')
  async createFeature(@Body() payload: CreateFeatureDto, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.createFeature(payload);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Feature created successfully',
        data,
      });
    } catch (error) {
      console.error('Create Feature Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create feature',
      });
    }
  }

  // update feature
  @Post('update-feature')
  async updateFeature(
    @Body() payload: UpdateFeatureDto,
    @Res() res: Response,
  ) {
    try {
      if (!payload.feature_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'feature_id is required',
        });
      }

      const data = await this.subscriptionService.updateFeature(payload.feature_id, payload);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Feature updated successfully',
        data,
      });
    } catch (error) {
      console.error('Update Feature Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update feature',
      });
    }
  }

  // Fetch feature details by ID
  @Post('feature-details')
  async getFeatureDetails(
    @Body() body: { feature_id: number },
    @Res() res: Response,
  ) {
    try {
      const { feature_id } = body;

      if (!feature_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'feature_id is required',
        });
      }

      const data = await this.subscriptionService.getFeatureDetailsById(feature_id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched feature details successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching feature details:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch feature details',
      });
    }
  }

  // Delete feature by ID
  @Post('delete-feature/:id')
  async deleteFeature(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.subscriptionService.deleteFeature(Number(id));
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Feature deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete feature',
      });
    }
  }

  // ✅ Fetch active plans (id + name only) for dropdowns
  @Get('active-plans')
  async getActivePlans(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getActivePlans();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched active plans successfully',
        data,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch active plans',
      });
    }
  }

  // ✅ Fetch active features (id + name only) for dropdowns
  @Get('active-features')
  async getActiveFeatures(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getActiveFeatures();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched active features successfully',
        data,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch active features',
      });
    }
  }
  // Get all payment methods option
  @Get('active-payment-methods')
  async getActivePaymentMethods(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getActivePaymentMethods();
  
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched active payment methods successfully',
        data,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch active payment methods',
      });
    }
  }
  

  @Post('create-mapping')
  async createMapping(@Body() payload: CreateMappingDto, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.createMapping(payload);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Mapping created successfully',
        data,
      });
    } catch (error) {
      console.error('Create Mapping Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create mapping',
      });
    }
  }

  @Post('update-mapping')
  async updateMapping(@Body() payload: UpdateMappingDto, @Res() res: Response) {
    try {
      if (!payload.mapping_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'mapping_id is required',
        });
      }

      const data = await this.subscriptionService.updateMapping(payload.mapping_id, payload);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Mapping updated successfully',
        data,
      });
    } catch (error) {
      console.error('Update Mapping Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update mapping',
      });
    }
  }

  @Post('mapping-details')
  async getMappingDetails(@Body() body: { mapping_id: number }, @Res() res: Response) {
    try {
      const { mapping_id } = body;
      if (!mapping_id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'mapping_id is required',
        });
      }

      const data = await this.subscriptionService.getMappingDetailsById(mapping_id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched mapping details successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching mapping details:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch mapping details',
      });
    }
  }

  @Post('delete-mapping/:id')
  async deleteMapping(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.subscriptionService.deleteMapping(Number(id));
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Mapping deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete mapping',
      });
    }
  }

  // fetch single plan with details

  @Get('plan-with-all-details/:id')
  async getPlanWithFeaturesById(
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const data = await this.subscriptionService.getPlanWithFeaturesById(id);

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


  @Post('create-payment')
  async createPayment(
    @Body() payload: CreatePaymentDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const result = await this.subscriptionService.createPayment(payload, req.user.id); // assuming req.user.id is logged-in user
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

  @Post('org-subscription-details')
  async getOrgSubscriptionDetails(@Res() res: Response, @Req() req) {
    try {
      // ✅ Get organization details using org_id from cookies/session
      const organizationDetails =
        await this.organizationalProfileCommonData.getOrganizationDetails(req);

      if (!organizationDetails || !organizationDetails.organizationId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Organization not found for this request',
        });
      }

      // ✅ Fetch subscription details using organization_profile_id
      const data =
        await this.subscriptionService.getSubscriptionDetailsByOrganization(
          organizationDetails.organizationId,
        );

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
  
  // ✅ Create a new plan setting
  @Post('create-plan-setting')
  async createPlanSetting(
    @Body() payload: CreatePlanSettingDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.subscriptionService.createSetting(payload);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Plan setting created successfully',
        data,
      });
    } catch (error) {
      console.error('Create Plan Setting Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create plan setting',
      });
    }
  }

  // ✅ Update plan setting
  @Post('upsert-plan-setting')
  async upsertPlanSetting(
    @Body() payload: CreatePlanSettingDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.subscriptionService.upsertSetting(payload);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Plan setting upserted successfully',
        data,
      });
    } catch (error) {
      console.error('Upsert Plan Setting Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to upsert plan setting',
      });
    }
  }

  // ✅ Get all settings by plan
  @Get('get-settings/:planId')
  async getSettingsByPlan(
    @Param('planId') planId: number,
    @Res() res: Response,
  ) {
    try {
      const data = await this.subscriptionService.getSettingsByPlan(planId);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched plan settings successfully',
        data,
      });
    } catch (error) {
      console.error('Get Plan Settings Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch plan settings',
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

      const requestData = await this.subscriptionService.createOfflinePaymentRequest(
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

  @Get('offline-requests')
  async getOfflineRequests(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'pending' | 'approved' | 'rejected' = 'All',
    @Res() res: Response,
  ) {
    try {
      const { data, total, page: p, limit: l } = await this.subscriptionService.getOfflineRequests(
        +page,
        +limit,
        search,
        status,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Offline requests fetched successfully',
        data,  // ✅ ensure this is an array
        total,
        page: p,
        limit: l,
      });
    } catch (error) {
      console.error('Error fetching offline requests:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch offline requests',
      });
    }
  }

  @Post('update-request-status')
  async updateStatus(@Body() payload: UpdateStatusDto, @Res() res: Response) {
    try {
      if (!payload.request_id || !payload.status) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'request_id and action are required',
        });
      }

      const updated = await this.subscriptionService.updateStatus(
        payload.request_id,
        payload.status === 'approve' ? 'approved' : 'rejected',
      );

      if (!updated) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: `Request with ID ${payload.request_id} not found`,
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Request ${payload.status}d successfully`,
        data: updated,
      });
    } catch (error) {
      console.error('Update Status Error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update request status',
      });
    }
  }

  //fetch trial and live subscriptions
  @Get('trial-live-subscriptions')
  async getTrialAndLiveSubscriptions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live' = 'All',
    @Res() res: Response,
  ) {
    try {
      const { trial, live, total } = await this.subscriptionService.getTrialAndLiveSubscriptions(
        Number(page),
        Number(limit),
        search,
        status,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched subscriptions successfully',
        trial,
        live,
        total,
      });
    } catch (error) {
      console.error('Error fetching trial/live subscriptions:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch subscriptions',
        trial: [],
        live: [],
        total: 0,
      });
    }
  }

    //fetch trial and live subscriptions
  // @Get('get-all-renewals')
  // async getRenewals(
  //   @Query('page') page = 1,
  //   @Query('limit') limit = 10,
  //   @Query('search') search = '',
  //   @Query('status') status: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live' = 'All',
  //   @Res() res: Response,
  // ) {
  //   try {
  //     const { trial, live, total } = await this.subscriptionService.getRenewals(
  //       Number(page),
  //       Number(limit),
  //       search,
  //       status,
  //     );

  //     return res.status(HttpStatus.OK).json({
  //       success: true,
  //       message: 'Fetched subscriptions successfully',
  //       trial,
  //       live,
  //       total,
  //     });
  //   } catch (error) {
  //     console.error('Error fetching trial/live subscriptions:', error);
  //     return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
  //       success: false,
  //       message: error.message || 'Failed to fetch subscriptions',
  //       trial: [],
  //       live: [],
  //       total: 0,
  //     });
  //   }
  // }
@Get('get-all-renewals')
async getRenewals(
   @Res() res: Response,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live',
  @Query('renewalStatus') renewalStatus?: string,
  @Query('quoteStatus') quoteStatus?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('plan') plan?: string,
 
) {
  try {
    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 10;
    const searchTerm = search?.trim() || '';
    const filterStatus = status || 'All';

    const filters = { renewalStatus, quoteStatus, startDate, endDate, plan };

    const { trial, live, total } = await this.subscriptionService.getRenewals(
      currentPage,
      currentLimit,
      searchTerm,
      filterStatus,
      filters,
    );

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched subscriptions successfully',
      trial,
      live,
      total,
    });
  } catch (error) {
    console.error('Error fetching trial/live subscriptions:', error);

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch subscriptions',
      trial: [],
      live: [],
      total: 0,
    });
  }
}


  // trial subscription fetch
  @Post('trial-subscriptions')
  async getTrialSubscriptions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'Active' | 'Inactive' = 'All',
    @Res() res: Response,
  ) {
    try {
      const { data, total } = await this.subscriptionService.getTrialSubscriptions(
        Number(page),
        Number(limit),
        search,
        status
      );
      return res.status(HttpStatus.OK).json({ success: true, data, total });
    } catch (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, data: [], total: 0 });
    }
  }

  // live subscription fetch
  @Post('live-subscriptions')
  async getLiveSubscriptions(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status: 'All' | 'Active' | 'Inactive' = 'All',
    @Res() res: Response,
  ) {
    try {
      const { data, total } = await this.subscriptionService.getLiveSubscriptions(
        Number(page),
        Number(limit),
        search,
        status
      );
      return res.status(HttpStatus.OK).json({ success: true, data, total });
    } catch (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, data: [], total: 0 });
    }
  }


  @Post('delete/:id')
  async deleteSubscription(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.subscriptionService.DeleteSubscription(Number(id));

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Subscription deleted successfully (soft delete)',
      });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete subscription',
      });
    }
  }

  // Payment Modes
  @Get('payment-modes')
  async getAllPaymentModes(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getAllPaymentModes();

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

  // All customer & subscriptions
  @Get('all-subscriptions')
async getAllSubscriptions(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search = '',
  @Query('status') status: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live' = 'All',
  @Res() res: Response,
) {
  try {
    const { subscriptions, total } = await this.subscriptionService.getAllSubscriptionDetails(
      Number(page),
      Number(limit),
      search,
      status,
    );

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched subscriptions with all details successfully',
      subscriptions,
      total,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch subscriptions',
      subscriptions: [],
      total: 0,
    });
  }
}
//
  @Get('get-all-organisations')
  async getAllOrganizations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const result = await this.subscriptionService.getAllOrganizationsWithPrimaryUsers(
      parsedPage,
      parsedLimit,
      search,
    );

    return {
      statusCode: 200,
      message: 'Organizations fetched successfully',
      data: result.organizations,
      total: result.total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  @Post('create-customer')
  // @UseGuards(ApiKeyGuard)
  async createOrganization(@Body() createOrganizationDto: CreateCustomerDto, context: ExecutionContext) {
    return await this.subscriptionService.createCustomer(createOrganizationDto, context);
  }

  @Post('update-customer')
  async updateCustomer(@Body() body: any) {
    try {
      // Expect body to contain subscriptionId and other fields
      const { subscriptionId, ...updateData } = body;

      if (!subscriptionId) {
        throw new HttpException(
          { success: false, message: 'subscriptionId is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.subscriptionService.updateCustomer({ subscriptionId, ...updateData });
      return {
        success: true,
        message: 'Customer updated successfully',
        data: result.data,
      };
    } catch (error) {
      console.error('Update customer error:', error);
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update customer',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('fetch-single-user-profile')
  @UseGuards(ApiKeyGuard, JwtAuthGuard)
  async fetchSingleUsersProfile(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // 1️⃣ Get the logged-in user details
      const organizationDetails = await this.organizationalProfileCommonData.getOrganizationDetails(req);
      const { loginUserId } = organizationDetails;
  
      if (!loginUserId) {
        return res.status(400).json({ success: false, message: 'Logged-in user not found' });
      }
  
      // 2️⃣ Fetch the user profile using the loginUserId
      const response = await this.subscriptionService.fetchSingleUsersProfile(loginUserId);
  
      // 3️⃣ Return the response
      return res.status(response.status).json(response);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  
// Gert the organisations in dropdown
  @Get('all-organisations')
  async getOrganizations() {
    return await this.subscriptionService.getOrganizationsForSelect();
  }

  @Post('create-or-update')
  async createOrUpdateOrder(@Body() orderDto: CreateOrderDto, @Req() req: any) {
    try {
      console.log("Incoming DTO:", orderDto);
  
      const context = { userId: req.user?.id || null }; // 🔑 pass userId if logged in
      console.log("Context:", context);
  
      const result = await this.subscriptionService.createOrUpdateOrder(orderDto, context);
      return result;
    } catch (error) {
      console.error("Controller Error:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { statusCode: 500, message: 'Internal server error.', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-all-products')
  async getAllProducts(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getAllProducts();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched products successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch products',
      });
    }
  }

  // ✅ Controller
@Post('get-plans-by-product')
async getActivePlansByProduct(
  @Body('productId') productId: number,
  @Res() res: Response,
) {
  try {
    const data = await this.subscriptionService.getActivePlansByProduct(productId);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched active plans successfully',
      data,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch active plans',
    });
  }
}


@Post('get-features-by-product')
async getActiveFeaturesByProduct(
  @Body('productId') productId: number,
  @Res() res: Response,
) {
  try {
    const data = await this.subscriptionService.getActiveFeaturesByProduct(productId);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched active features successfully',
      data,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch active features',
    });
  }
}

@Post('list-products')
async listProducts(@Body() body: any, @Res() res: Response) {
  try {
    const { page = 1, limit = 10, search = '', status } = body;

    const result = await this.subscriptionService.listProducts({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
    });

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched products successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
}

  // ✅ 1. Create Product
  @Post('add-product')
  async addProduct(@Body() createProductDto: CreateProductDto, @Res() res: Response) {
    try {
      const product = await this.subscriptionService.addProduct(createProductDto);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create product',
      });
    }
  }

    // ✅ 3. Get Single Product
  @Get('get-product/:productId')
  async getProduct(@Param('productId') productId: number, @Res() res: Response) {
    try {
      const product = await this.subscriptionService.getProductById(productId);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched product successfully',
        data: product,
      });
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Product not found',
      });
    }
  }

  // ✅ 4. Update Product
  @Post('update-product/:productId')
  async updateProduct(
    @Param('productId') productId: number,
    @Body() updateProductDto: UpdateProductDto,
    @Res() res: Response,
  ) {
    try {
      const product = await this.subscriptionService.updateProduct(productId, updateProductDto);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update product',
      });
    }
  }

  // ✅ 5. Soft Delete Product
  @Post('delete-product/:productId')
  async deleteProduct(@Param('productId') productId: number, @Res() res: Response) {
    try {
      await this.subscriptionService.softDeleteProduct(productId);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete product',
      });
    }
  }

    @Get('get-all-status')
  async getAllStatus(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getAllStatus();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched renewal statuses successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching renewal statuses:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch renewal statuses',
      });
    }
  }

  @Get("dashboard-counts")
async getDashboardCounts() {
  return await this.subscriptionService.getDashboardCounts();
}


@Post('toggle-login/:id')
async toggleLoginRestriction(@Param('id') id: number, @Res() res: Response) {
  try {
    const updated = await this.subscriptionService.toggleLoginRestriction(Number(id));

    return res.status(HttpStatus.OK).json({
      success: true,
      message: `Login has been ${updated.restrict_login ? 'disabled' : 'enabled'} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('Error toggling login restriction:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to toggle login restriction',
    });
  }
}

   @Post('sales-requests-list')
  async listSalesRequests(@Body() body: any, @Res() res: Response) {
    try {
      const { page = 1, limit = 10, search = '', status } = body;

      const result = await this.subscriptionService.listSalesRequests({
        page: Number(page),
        limit: Number(limit),
        search,
        status,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Fetched sales requests successfully',
        ...result,
      });
    } catch (error) {
      console.error('Error fetching sales requests:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch sales requests',
      });
    }
  }

  @Get('get-sales-requests/:id')
async getSalesRequest(@Param('id') id: number, @Res() res: Response) {
  try {
    const request = await this.subscriptionService.getSalesRequestById(id);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched sales request successfully',
      data: request,
    });
  } catch (error) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: error.message || 'Sales request not found',
    });
  }
}
  @Post('delete-sales-request/:id')
  async deleteSalesRequest(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.subscriptionService.softDeleteSalesRequest(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Sales request deleted successfully',
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete sales request',
      });
    }
  }

@Post('disable-organization/:id')
async disableOrganization(@Param('id') id: number, @Res() res: Response) {
  try {
    await this.subscriptionService.disableOrganization(Number(id));

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Organization disabled successfully',
    });
  } catch (error) {
    console.error('Error disabling organization:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to disable organization',
    });
  }
}

} 