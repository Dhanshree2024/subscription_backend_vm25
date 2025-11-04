import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryFailedError } from 'typeorm';
import { Feature } from './entity/feature.entity';
import { PlanBilling } from './entity/plan-billing.entity';
import { PlanFeatureMapping } from './entity/plan-feature-mapping.entity';
import { Plan } from './entity/plan.entity';
import { SubscriptionType } from './entity/subscription-type.entity';
import { OrgSubscription } from './entity/org_subscription.entity';
import { CreateSubscriptionTypeDto } from './dto/create-subscription-type.dto';
import { CreateOrgSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdateOrgSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionLog } from './entity/subscription-log.entity';
import { OrgOverride } from 'src/organization_register/entities/org_overrides.entity';
import { OrgFeatureOverride } from '../subscription_pricing/entity/org_feature_overrides.entity';
import { RegisterOrganization } from 'src/organization_register/entities/register-organization.entity';
import { OrgFeatureOverrideLog } from './entity/org_feature_override_logs.entity';
import { CreateFeatureDto, UpdateFeatureDto } from './dto/feature.dto';
import { CreateMappingDto, UpdateMappingDto } from './dto/mapping.dto';
import { BillingInfo } from './entity/billing_info.entity';
import { PaymentTransaction } from './entity/payment_transaction.entity';
import { CreatePaymentDto } from './dto/payment.dto';
import { PlanSetting } from './entity/plan_setting.entity';
import { CreatePlanSettingDto, UpdatePlanSettingDto } from './dto/plan-setting.dto';
import { OfflinePaymentRequest } from './entity/offline_payment_requests.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
import { PaymentMethod } from './entity/payment_methods.entity';
import { PaymentMode } from './entity/payment_mode.entity';
import { CreateCustomerDto } from './dto/create-customer.dto'
import { MailService } from 'src/common/mail/mail.service';
import { renderEmail, EmailTemplate } from 'src/common/mail/render-email';
import { MailConfigService } from '../common/mail/mail-config.service';
import { CreateOrderDto } from '../subscription_pricing/dto/create-order.dto'
import { Product } from './entity/product.entity';
import { RenewalStatus } from './entity/renewal.entity';
// 
import { userDefaultPermission } from 'src/organization_register/default_permissions/UserDefaultPermission';
import { adminDefaultPermission } from 'src/organization_register/default_permissions/AdminDefaultPermission';
import * as bcrypt from 'bcrypt';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

// all scripts to use to create org
import { OrganizationProfileScript } from 'src/organization_register/onboarding_sql_scripts/organization_profile';
import { BranchesScript } from 'src/organization_register/onboarding_sql_scripts/branches';
import { DepartmentsScript } from 'src/organization_register/onboarding_sql_scripts/departments';
import { OrganizationPermissionScript } from 'src/organization_register/onboarding_sql_scripts/organization_permissions';
import { OrganizationRolesScript } from 'src/organization_register/onboarding_sql_scripts/organization_roles';
import { DesignationScript } from 'src/organization_register/onboarding_sql_scripts/designation';
import { assetFieldCategoryScript } from 'src/organization_register/onboarding_sql_scripts/assetfieldcategory';
import { ItemFieldsScript } from 'src/organization_register/onboarding_sql_scripts/assetitemfields';
import { SubCategoryScript } from 'src/organization_register/onboarding_sql_scripts/subcategory';
import { ItemsScript } from 'src/organization_register/onboarding_sql_scripts/items';
import { ItemFieldsMappingScript } from 'src/organization_register/onboarding_sql_scripts/assetitemfieldmapping';
import { CategoryScript } from 'src/organization_register/onboarding_sql_scripts/category';
import { AssetItemRelationScript } from 'src/organization_register/onboarding_sql_scripts/assetitemrelations';
import { AssetsScript } from 'src/organization_register/onboarding_sql_scripts/assets';
import { AssetStatusTypesScript } from 'src/organization_register/onboarding_sql_scripts/assetStatsutypes';
import { AssetOwnershipStatusTypesScript } from 'src/organization_register/onboarding_sql_scripts/assetOwnershipstatsutypes';
import { AssetWorkingStatusScript } from 'src/organization_register/onboarding_sql_scripts/assetWorkingstatus';
import { AssetMappingRelations } from 'src/organization_register/onboarding_sql_scripts/assetmapping';
import { StocksScript } from 'src/organization_register/onboarding_sql_scripts/stocks';
import { AssetStockSerialsScript } from 'src/organization_register/onboarding_sql_scripts/stockserial';
import { LicenceTypesScript } from 'src/organization_register/onboarding_sql_scripts/licencetypes';
import { AssetTransferHistoryScript } from 'src/organization_register/onboarding_sql_scripts/transferhistory';
import { VendersScript } from 'src/organization_register/onboarding_sql_scripts/venders';
import { UserScript } from 'src/organization_register/onboarding_sql_scripts/users';

import { OrganizationSchemaManager } from './utils/OrganisationSchemaManager';
import { HrmsOrganizationSchemaManager } from './utils/HrmsOrganisationSchemaManager';
import { AssetListViewScript } from 'src/organization_register/onboarding_sql_scripts/assetlistview';
import { otherSettingsOrgScript } from 'src/organization_register/onboarding_sql_scripts/othersetting';
import { qrCodeSettingsScript } from 'src/organization_register/onboarding_sql_scripts/assetqrsetting';
import { assetIdSettingsScript } from 'src/organization_register/onboarding_sql_scripts/assetidsettingsv2';
import { assetCostCenterScript } from 'src/organization_register/onboarding_sql_scripts/assetcostcenter';
import { assetProjectScript } from 'src/organization_register/onboarding_sql_scripts/assetproject';
import { orgStatsScriptScript } from 'src/organization_register/onboarding_sql_scripts/assetsorgstats';
import { assetLocationScript } from 'src/organization_register/onboarding_sql_scripts/assetlocation';
import { assetDepreciationMethodsScript } from 'src/organization_register/onboarding_sql_scripts/assetdepreciationmethods';
import { SuperAdminDefaultPermission } from 'src/organization_register/default_permissions/SuperAdminDefaultPermissions';
import { TechnicianDefaultPermission } from 'src/organization_register/default_permissions/TechnicianDefaultPermissions';
// End
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,

    @InjectRepository(PlanBilling)
    private readonly planBillingRepository: Repository<PlanBilling>,

    @InjectRepository(PlanFeatureMapping)
    private readonly planFeatureMappingRepository: Repository<PlanFeatureMapping>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(SubscriptionType)
    private readonly orgsubscriptionTypeRepository: Repository<SubscriptionType>,

    @InjectRepository(OrgSubscription)
    private readonly subscriptionRepository: Repository<OrgSubscription>,

    @InjectRepository(SubscriptionLog)
    private readonly subscriptionLogRepository: Repository<SubscriptionLog>,

    @InjectRepository(OrgFeatureOverride)
    private pricingOverrideRepo: Repository<OrgFeatureOverride>,

    @InjectRepository(OrgOverride)
    private publicOverrideRepo: Repository<OrgOverride>,

    @InjectRepository(RegisterOrganization)
    private orgRepo: Repository<RegisterOrganization>,

    @InjectRepository(OrgFeatureOverrideLog)
    private featureOverrideLogs: Repository<OrgFeatureOverrideLog>,

    @InjectRepository(BillingInfo)
    private billingInfoRepository: Repository<BillingInfo>,

    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepository: Repository<PaymentTransaction>,

    @InjectRepository(PlanSetting)
    private planSettingRepo: Repository<PlanSetting>,

    @InjectRepository(OfflinePaymentRequest)
    private offlinePaymentRepo: Repository<OfflinePaymentRequest>,

    @InjectRepository(RegisterUserLogin)
    private readonly registerUser: Repository<RegisterUserLogin>,

    @InjectRepository(PaymentMethod)
    private readonly paymentMethod: Repository<PaymentMethod>,

    @InjectRepository(PaymentMode)
    private readonly paymentModeRepository: Repository<PaymentMode>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(RenewalStatus)
    private readonly renewalStatusRepository: Repository<RenewalStatus>,

    @InjectDataSource() private readonly dataSource: DataSource,

    private readonly mailConfigService: MailConfigService, // Inject service

    private readonly mailService: MailService,
  ) { }

  //create the subscription type
  async createSubscriptionType(dto: CreateSubscriptionTypeDto, loginUserId: number): Promise<SubscriptionType> {
    const existingType = await this.orgsubscriptionTypeRepository.findOne({
      where: {
        type_name: dto.typeName,
      },
    });

    if (existingType) {
      throw new Error('A subscription type with the same name already exists.');
    }
    console.log("existingType:", existingType);
    const type = this.orgsubscriptionTypeRepository.create({
      type_name: dto.typeName,
      description: dto.description || '',
      created_by: loginUserId,
    });

    return this.orgsubscriptionTypeRepository.save(type);
  }

  //fetch type
  async getAllSubscriptionTypes(): Promise<any[]> {
    try {
      return await this.orgsubscriptionTypeRepository.find({
        order: { type_id: 'ASC' }, // Optional: sort by ID
      });
    } catch (error) {
      throw new Error('Error fetching subscription types: ' + error.message);
    }
  }

  //create the plan
  async createPlan(payload: CreatePlanDto): Promise<Plan> {
    const { plan_name, description, billing_cycle, price, subscription_type, product_id,    set_trial,              // new
    trial_period,       // new
    trial_period_count,      // new
     } = payload;

    // Check duplicate plan name
    const existing = await this.planRepository.findOne({ where: { plan_name } });
    if (existing) {
      throw new BadRequestException('Plan with this name already exists');
    }

    // 1️⃣ Create Plan
    const plan = this.planRepository.create({
      plan_name,
      description,
      is_active: true,
      productId: product_id,
        set_trial,            // ✅ add this
  trial_period_unit: trial_period,  // ✅ add this
  trial_period_count,   // ✅ add this
    });
    const savedPlan = await this.planRepository.save(plan);

    // 2️⃣ Create related PlanBilling
    const billing = this.planBillingRepository.create({
      billing_cycle,
      price,
      plan: savedPlan,
      // if you decide to add subscription_type_id column in PlanBilling
      subscription_type_id: subscription_type,
    });

    await this.planBillingRepository.save(billing);

    return savedPlan;
  }

  // updatePlan in subscription.service.ts
  async updatePlan(plan_id: number, payload: any): Promise<Plan> {
    const { plan_name, description, billing_cycle, price, subscription_type, product_id, set_trial,              // new
    trial_period,       // new
    trial_period_count,      // new

    } = payload;

    // Find plan
    const plan = await this.planRepository.findOne({ where: { plan_id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Update plan basic details
    Object.assign(plan, { plan_name, description, productId: product_id,  set_trial,
  trial_period_unit: payload.trial_period,
  trial_period_count: payload.trial_period_count, });
    const updatedPlan = await this.planRepository.save(plan);

    //  Check if billing exists for this plan + cycle
    let billing = await this.planBillingRepository.findOne({
      where: { plan: { plan_id }, billing_cycle },
    });

    if (billing) {
      // update
      billing.price = price;
      // billing.subscription_type_id = subscription_type;
    } else {
      // insert
      billing = this.planBillingRepository.create({
        billing_cycle,
        price,
        plan: updatedPlan,
        subscription_type_id: subscription_type,
      });
    }

    await this.planBillingRepository.save(billing);

    return updatedPlan;
  }


  // Get Plan details by ID (with billing info)
  async getPlanDetailsById(plan_id: number): Promise<any> {
    try {
      const plan = await this.planRepository.findOne({
        where: { plan_id, is_active: true },
        relations: ['billings', 'billings.subscriptionType', 'product',], // 👈 include billing info
      });

      if (!plan) {
        throw new Error('Plan not found');
      }

      return {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        description: plan.description,
        is_active: plan.is_active,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
        product: plan.product,
        isTrial: plan.set_trial,
        trial_period: plan.trial_period_unit,
        trial_period_count: plan.trial_period_count,
        billings: plan.billings.map(b => ({
          billing_id: b.billing_id,
          billing_cycle: b.billing_cycle,
          price: b.price,
          discounted_percentage: b.discounted_percentage,
          subscriptionType: {
            type_id: b.subscriptionType?.type_id,
            type_name: b.subscriptionType?.type_name,
          },
          created_at: b.created_at,
          updated_at: b.updated_at,
        })),
      };
    } catch (error) {
      console.error('Error fetching plan details:', error);
      throw new Error('Failed to fetch plan details');
    }
  }


  // Soft Delete Plan
  async deletePlan(id: number): Promise<void> {
    try {
      const plan = await this.planRepository.findOne({
        where: { plan_id: id },
      });

      if (!plan) {
        throw new Error('Plan not found');
      }

      // Soft delete
      plan.is_active = false;
      plan.is_deleted = true;

      await this.planRepository.save(plan);
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw new Error('Failed to delete plan');
    }
  }


  // Get all plan
  async getAllPlanDetails(): Promise<any[]> {
    try {
      return await this.planRepository.find({
        order: { plan_id: 'ASC' }, // Optional: sort by ID
      });
    } catch (error) {
      throw new Error('Error fetching subscription types: ' + error.message);
    }
  }

  //Get billing for plan

  async getBillingDetailsByPlanId(plan_id: number): Promise<any> {
    try {
      const billingDetails = await this.planBillingRepository
        .createQueryBuilder('plan_billing')
        .leftJoinAndSelect('plan_billing.plan', 'plan')
        .where('plan.plan_id = :plan_id', { plan_id })
        .orderBy('plan_billing.billing_cycle', 'ASC') // optional
        .getMany();

      return billingDetails;
    } catch (error) {
      console.error('Error fetching billing cycle details:', error);
      throw new Error('Failed to fetch billing cycle details');
    }
  }

  // get all billing

  async getAllBillingCycles(): Promise<any[]> {
    try {
      const billingCycles = await this.planBillingRepository
        .createQueryBuilder('plan_billing')
        .leftJoinAndSelect('plan_billing.plan', 'plan')
        .orderBy('plan_billing.plan', 'ASC')
        .addOrderBy('plan_billing.billing_cycle', 'ASC')
        .getMany();

      return billingCycles;
    } catch (error) {
      console.error('Error fetching all billing cycles:', error);
      throw new Error('Failed to fetch all billing cycles');
    }
  }

  // get single billing

  async getBillingEntryById(billing_id: number): Promise<any> {
    try {
      const billingEntry = await this.planBillingRepository
        .createQueryBuilder('plan_billing')
        .leftJoinAndSelect('plan_billing.plan', 'plan')
        .where('plan_billing.billing_id = :billing_id', { billing_id })
        .getOne();

      return billingEntry;
    } catch (error) {
      console.error('Error fetching billing entry:', error);
      throw new Error('Failed to fetch billing entry');
    }
  }

  // get all features for single plan

  async getFeaturesByPlanId(plan_id: number): Promise<any[]> {
    try {
      const features = await this.planFeatureMappingRepository
        .createQueryBuilder('plan_feature_mappings')
        .leftJoinAndSelect('plan_feature_mappings.plan', 'plan')
        .leftJoinAndSelect('plan_feature_mappings.feature', 'feature')
        .where('plan.plan_id = :plan_id', { plan_id })
        .orderBy('feature.feature_name', 'ASC') // optional
        .getMany();

      return features;
    } catch (error) {
      console.error('Error fetching features by plan_id:', error);
      throw new Error('Failed to fetch plan features');
    }
  }


  //feature for the plan
  async getFeatureMappingsByPlanId(plan_id: number): Promise<any[]> {
    try {
      const features = await this.planFeatureMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.feature', 'feature')
        .where('mapping.plan = :plan_id', { plan_id })
        .orderBy('feature.feature_name', 'ASC') // optional
        .getMany();

      return features;
    } catch (error) {
      console.error('Error fetching features for plan:', error);
      throw new Error('Failed to fetch features for the plan');
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



  //create subcription
  async createOrgSubscription(payload: CreateOrgSubscriptionDto, loginUserId: number): Promise<OrgSubscription> {
    const {
      organization_profile_id,
      plan_id,
      subscription_type_id,
      payment_status,
      payment_mode,
      purchase_date,
    } = payload;

    await this.subscriptionRepository.update(
      {
        organization_profile_id,
        is_active: true,
        is_deleted: false,
      },
      {
        is_active: false,
        is_deleted: true,
      },
    );
    const plan = await this.planRepository.findOne({
      where: { plan_id },
      relations: ['billings'],
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // 2. Pick default or first billing
    const billing = plan.billings?.[0]; // Adjust logic if needed
    if (!billing) {
      throw new NotFoundException('Billing info not found for plan');
    }

    // 3. Get pricing info from billing
    const price = +billing.price;
    const discountPercentage = billing.discounted_percentage ?? 0;

    const discounted_price =
      discountPercentage > 0
        ? +(price - (price * discountPercentage) / 100).toFixed(2)
        : null;

    const grand_total = discounted_price ?? price;

    // 4. Set renewal date (e.g., 1 year later)
    const start_date = new Date(purchase_date);
    const renewal_date = new Date(start_date);
    renewal_date.setFullYear(start_date.getFullYear() + 1);

    // 5. Create and save one subscription (no loop, no feature_id)
    const orgSub = this.subscriptionRepository.create({
      organization_profile_id,
      plan_id,
      billing_id: billing.billing_id,
      subscription_type_id,
      start_date,
      renewal_date,
      payment_status,
      payment_mode,
      purchase_date,
      price,
      discounted_price,
      grand_total,
    });

    const savedSub = await this.subscriptionRepository.save(orgSub);
    await this.logSubscriptionChange(
      savedSub.subscription_id,               // Subscription ID
      organization_profile_id,                // Org ID
      'create',                               // Action type
      loginUserId,                            // Performed by
      null,                                   // Old data (none on creation)
      savedSub,                               // New data
      'New subscription created'              // Remarks
    );
    return savedSub;

  }

  //get single subscription details
  async getSubscriptionDetailsById(subscription_id: number): Promise<any> {
    try {
      // 1. Fetch subscription with joined plan and subscriptionType
      const subscription = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .leftJoinAndSelect('sub.plan', 'plan')
        .leftJoinAndSelect('sub.organization', 'org')
        .leftJoinAndSelect('org.users', 'users')
        .leftJoinAndSelect('sub.subscriptionType', 'subscriptionType')
        .leftJoinAndSelect('sub.billingInfo', 'billing')
        .leftJoinAndSelect('billing.paymentMethod', 'billingMethod')
        .leftJoinAndSelect('sub.paymentTransactions', 'payment')
        .leftJoinAndSelect('sub.product', 'product') 
        .where('sub.subscription_id = :subscription_id', { subscription_id })
        .andWhere('sub.is_active = :isActive', { isActive: true })
        .getOne();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // 2. Fetch billing by billing_id (linked to subscription)
      const billing = subscription.billingInfo?.[0]
        ? {
          first_name: subscription.billingInfo[0].first_name,
          last_name: subscription.billingInfo[0].last_name,
          email: subscription.billingInfo[0].email,
          phone_number: subscription.billingInfo[0].phone_number,
          method: subscription.billingInfo[0].paymentMethod?.methodName || null,
          same_as_primary_contact: subscription.billingInfo[0].same_as_primary_contact,
          orderplacedby: subscription.billingInfo[0].orderplacedby,
          paymentterm: subscription.billingInfo[0].paymentterm,
          customerpo: subscription.billingInfo[0].customerpo,

        }
        : null;
      // 3. Fetch features using plan_id (you prefer this structure)
      const featureMappings = await this.planFeatureMappingRepository
        .createQueryBuilder('mapping')
        .leftJoinAndSelect('mapping.feature', 'feature')
        .where('mapping.plan = :plan_id', { plan_id: subscription.plan_id })
        .orderBy('feature.feature_name', 'ASC')
        .getMany();

      const features = featureMappings.map((mapping) => ({
        feature_id: mapping.feature?.feature_id,
        feature_name: mapping.feature?.feature_name,
        feature_value: mapping.feature_value ?? mapping.feature?.default_value ?? null,
        is_trial: mapping.is_trial,
      }));
      const paymentTransactions = subscription.paymentTransactions?.map((tx) => ({
        transaction_id: tx.transaction_id,
        amount: tx.amount,
        payment_method: tx.payment_method, // if stored separately from billingMethod
      })) || [];
      // 4. Combine all data

   // ✅ NEW PART: Fetch limitations for this subscription
const limitations = await this.pricingOverrideRepo
  .createQueryBuilder('lim') // changed alias from 'limit' → 'lim'
  .leftJoinAndSelect('lim.feature', 'feature')
  .where('lim.org_id = :orgId', { orgId: subscription.organization_profile_id }) // use org_id instead of subscription_id
  .andWhere('lim.is_active = :active', { active: true })
  .getMany();
const featureslimit = limitations.map((lim) => {
  const mapping = featureMappings.find(
    (m) => m.feature?.feature_id === lim.feature_id
  );

  return {
    feature_id: lim.feature?.feature_id || mapping?.feature?.feature_id,
    feature_name: lim.feature?.feature_name || mapping?.feature?.feature_name,
    feature_value:
      lim.override_value ??
      mapping?.feature_value ??
      mapping?.feature?.default_value ??
      null,
    is_trial: mapping?.is_trial ?? false,
  };
});


      return {
        subscription_id: subscription.subscription_id,
        organization_profile_id: subscription.organization_profile_id,
        organization_name: subscription.organization?.organization_name || null,
        industry_type_id: subscription.organization?.industry_type_id || null,
        users: subscription.organization?.users?.map((u) => ({
          user_id: u.user_id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.business_email,
          phone: u.phone_number,
        })) || [],
        plan: {
          plan_id: subscription.plan.plan_id,
          plan_name: subscription.plan.plan_name,
     
        },
        billing: billing ?? null,
        subscription_type: subscription.subscriptionType?.type_name ?? null,
        price: subscription.price,
        discounted_price: subscription.discounted_price,
        grand_total: subscription.grand_total,
        start_date: subscription.start_date,
        renewal_date: subscription.renewal_date,
        payment_status: subscription.payment_status,
        payment_mode: subscription.payment_mode,
        purchase_date: subscription.purchase_date,
        billing_cycle: subscription.plan_billing_id,
        is_active: subscription.is_active,
        autoRenewal: subscription.auto_renewal,
        isTrialPeriod: subscription.is_trial_period,

        trialPeriod: subscription.trial_period_unit || "",        // "days" / "months" / "years"
        trialPeriodCount: subscription.trial_period_count || "",  // number
        trialStartDate: subscription.trial_start_date || "",
        trialExpiryDate: subscription.trial_expiry_date || "",
        gracePeriod: subscription.grace_period || "",
        plan_billing_id: subscription.plan_billing_id,
        discount: subscription.percentage,
        limitations_features: featureslimit,
        features,
        paymentTransactions,
        product_id: subscription.productId,
         product: {
        product_id: subscription.product?.productId || subscription.productId,
        product_name: subscription.product?.name || null,
      },
      };
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  //cancel subscription
  async cancelOrgSubscription(
    organization_profile_id: number,
    subscription_id: number,
    loginUserId: number,
  ): Promise<string> {
    // Get current active subscription
    const existing = await this.subscriptionRepository.findOne({
      where: {
        subscription_id,
        organization_profile_id,
        is_active: true,
        is_deleted: false,
      },
    });
    console.log('Existing subscription:', existing);

    if (!existing) {
      throw new NotFoundException('No active subscription found to cancel');
    }

    // Perform cancellation
    const result = await this.subscriptionRepository.update(
      {
        subscription_id,
        is_active: true,
        is_deleted: false,
      },
      {
        is_active: false,
        is_deleted: true,
      },
    );

    //  Log cancellation
    await this.logSubscriptionChange(
      existing.subscription_id,
      organization_profile_id,
      'cancel',
      loginUserId,
      existing,
      { ...existing, is_active: false, is_deleted: true },
      'Subscription cancelled'
    );

    return 'Subscription cancelled successfully';
  }


//   async getOrganizationDetails(organization_id: number): Promise<any> {
//   try {
//     // 1️⃣ Fetch the organization along with its users
//     const organization = await this.orgRepo.findOne({
//       where: { organization_id },
//       relations: ['users'],
//     });

//     if (!organization) {
//       throw new Error('Organization not found');
//     }

//     // 2️⃣ Get primary user
//     const primaryUser = organization.users?.find(u => u.is_primary_user === 'Y') || null;

//     // 3️⃣ Return the data
//     return {
//       organization_id: organization.organization_id,
//       organization_name: organization.organization_name,
//       organization_schema_name: organization.organization_schema_name,
//       industry_type_id: organization.industry_type_id,
//       primary_user: primaryUser
//         ? {
//             user_id: primaryUser.user_id,
//             first_name: primaryUser.first_name,
//             last_name: primaryUser.last_name,
//             business_email: primaryUser.business_email,
//             phone_number: primaryUser.phone_number,
//           }
//         : null,
//     };
//   } catch (error) {
//     console.error('Error fetching organization details:', error);
//     throw new Error('Failed to fetch organization details');
//   }
// }

async getOrganizationDetails(organization_id: number): Promise<any> {
  try {
    // 1️⃣ Fetch organization + users + subscriptions + billing info
    const organization = await this.orgRepo.findOne({
      where: { organization_id },
      relations: [
        'users',
        'subscriptions',
        'subscriptions.billingInfo',
        'subscriptions.billingInfo.paymentMethod',
        'subscriptions.plan',
        'subscriptions.subscriptionType',
      ],
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // 2️⃣ Identify the primary user
    const primaryUser = organization.users?.find(u => u.is_primary_user === 'Y') || null;

    // 3️⃣ Get the most recent active subscription (if multiple exist)
    const activeSubscription = organization.subscriptions?.find(s => s.is_active) || null;

    // 4️⃣ Extract billing info if available
    const billing = activeSubscription?.billingInfo?.[0]
      ? {
          first_name: activeSubscription.billingInfo[0].first_name,
          last_name: activeSubscription.billingInfo[0].last_name,
          email: activeSubscription.billingInfo[0].email,
          phone_number: activeSubscription.billingInfo[0].phone_number,
          method: activeSubscription.billingInfo[0].paymentMethod?.methodName || null,
          same_as_primary_contact: activeSubscription.billingInfo[0].same_as_primary_contact,
          orderplacedby: activeSubscription.billingInfo[0].orderplacedby,
          paymentterm: activeSubscription.billingInfo[0].paymentterm,
          customerpo: activeSubscription.billingInfo[0].customerpo,
        }
      : null;

    // 5️⃣ Return consolidated data
    return {
      organization_id: organization.organization_id,
      organization_name: organization.organization_name,
      organization_schema_name: organization.organization_schema_name,
      industry_type_id: organization.industry_type_id,

      primary_user: primaryUser
        ? {
            user_id: primaryUser.user_id,
            first_name: primaryUser.first_name,
            last_name: primaryUser.last_name,
            business_email: primaryUser.business_email,
            phone_number: primaryUser.phone_number,
          }
        : null,

      subscription: activeSubscription
        ? {
            subscription_id: activeSubscription.subscription_id,
            plan_id: activeSubscription.plan_id,
            plan_name: activeSubscription.plan?.plan_name,
            subscription_type: activeSubscription.subscriptionType?.type_name,
            price: activeSubscription.price,
            discounted_price: activeSubscription.discounted_price,
            grand_total: activeSubscription.grand_total,
            payment_status: activeSubscription.payment_status,
            payment_mode: activeSubscription.payment_mode,
            start_date: activeSubscription.start_date,
            renewal_date: activeSubscription.renewal_date,
            is_trial_period: activeSubscription.is_trial_period,
            auto_renewal: activeSubscription.auto_renewal,
            billing,
          }
        : null,
    };
  } catch (error) {
    console.error('Error fetching organization details:', error);
    throw new Error('Failed to fetch organization details');
  }
}


  async updateOrgSubscription(
    subscription_id: number,
    dto: UpdateOrgSubscriptionDto,
    organizationId: number,
    updatedByUserId: number,
  ): Promise<OrgSubscription> {
    const existing = await this.subscriptionRepository.findOne({
      where: { subscription_id },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = this.subscriptionRepository.merge(existing, {
      ...dto,
      created_by: updatedByUserId,
      updated_at: new Date(),
    });

    const saved = await this.subscriptionRepository.save(updated);
    await this.logSubscriptionChange(
      subscription_id,
      organizationId,
      'update',
      updatedByUserId,
      existing,
      saved,
      'Subscription updated'
    );

    return saved;
  }

  async getSubscriptionHistoryByOrgId(orgId: number): Promise<any[]> {
    try {
      // 1. Fetch all subscriptions for the organization
      const subscriptions = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .leftJoinAndSelect('sub.plan', 'plan')
        .leftJoinAndSelect('sub.subscriptionType', 'subscriptionType')
        .where('sub.organization_profile_id = :orgId', { orgId })
        .orderBy('sub.created_at', 'DESC')
        .getMany();

      // 2. Map each subscription to include billing and feature info
      const history = await Promise.all(
        subscriptions.map(async (sub) => {
          const billing = await this.planBillingRepository
            .createQueryBuilder('billing')
            .where('billing.billing_id = :billing_id', { billing_id: sub.billing_id })
            .getOne();

          const featureMappings = await this.planFeatureMappingRepository
            .createQueryBuilder('mapping')
            .leftJoinAndSelect('mapping.feature', 'feature')
            .where('mapping.plan = :plan_id', { plan_id: sub.plan_id })
            .orderBy('feature.feature_name', 'ASC')
            .getMany();

          const features = featureMappings.map((mapping) => ({
            feature_id: mapping.feature?.feature_id,
            feature_name: mapping.feature?.feature_name,
            feature_value: mapping.feature_value,
          }));

          return {
            subscription_id: sub.subscription_id,
            organization_profile_id: sub.organization_profile_id,
            plan: {
              plan_id: sub.plan.plan_id,
              plan_name: sub.plan.plan_name,
            },
            billing: billing ?? null,
            subscription_type: sub.subscriptionType?.type_name ?? null,
            price: sub.price,
            discounted_price: sub.discounted_price,
            grand_total: sub.grand_total,
            start_date: sub.start_date,
            renewal_date: sub.renewal_date,
            payment_status: sub.payment_status,
            payment_mode: sub.payment_mode,
            purchase_date: sub.purchase_date,
            is_active: sub.is_active,
            features,
          };
        })
      );

      return history;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw new Error('Failed to fetch subscription history');
    }
  }

  //for the save logs
  async logSubscriptionChange(
    subscription_id: number,
    orgId: number,
    action: 'create' | 'update' | 'cancel',
    performed_by: number,
    oldData?: any,
    newData?: any,
    remarks?: string,
  ) {
    const log = this.subscriptionLogRepository.create({
      subscription_id,
      organization_profile_id: orgId,
      action,
      old_data: oldData || null,
      new_data: newData || null,
      remarks: remarks || '',
      performed_by,
    });

    await this.subscriptionLogRepository.save(log);
  }

  //get all log
  async getSubscriptionLogs(organization_profile_id: number): Promise<SubscriptionLog[]> {
    return this.subscriptionLogRepository.find({
      where: { organization_profile_id },
      order: { created_at: 'DESC' },
    });
  }


  //get the all values form the schema of pricing to the table from organization
  async updateOverrides(
    org_id: number,
    updates:
      | { feature_id: number; plan_id: number; mapping_id?: number; override_value: string; default_value?: string, is_active?: boolean; is_deleted?: boolean; }[]
      | { feature_id: number; plan_id: number; mapping_id?: number; override_value: string; default_value?: string, is_active?: boolean; is_deleted?: boolean; },
    changedBy?: number, // optional, pass userId from request context
  ) {
    const updatesArray = Array.isArray(updates) ? updates : [updates];

    return await this.dataSource.transaction(async (manager) => {
      const updatedPricing: OrgFeatureOverride[] = [];
      const updatedPublic: OrgOverride[] = [];
      const logs: OrgFeatureOverrideLog[] = [];

      for (const u of updatesArray) {
        let action: 'INSERT' | 'UPDATE' = 'INSERT';
        let oldValue: string | null = null;

        // 🔹 Check by org_id + plan_id + feature_id
        let pricingOverride = await manager.getRepository(OrgFeatureOverride).findOne({
          where: {
            org_id,
            plan_id: u.plan_id,
            feature_id: u.feature_id,
            is_deleted: false,
          },
        });

        if (!pricingOverride) {
          // insert new if not found
          pricingOverride = manager.getRepository(OrgFeatureOverride).create({
            org_id,
            plan_id: u.plan_id,
            feature_id: u.feature_id,
            mapping_id: u.mapping_id,
            override_value: u.override_value,
            default_value: u.default_value,
            is_active: u.is_active !== undefined ? u.is_active : true,
            is_deleted: u.is_deleted !== undefined ? u.is_deleted : false,
          });
          action = 'INSERT';
        } else {
          // update existing
          oldValue = pricingOverride.override_value;
          pricingOverride.override_value = u.override_value;
          pricingOverride.is_active = u.is_active !== undefined ? u.is_active : pricingOverride.is_active;
          pricingOverride.is_deleted = u.is_deleted !== undefined ? u.is_deleted : pricingOverride.is_deleted;
          pricingOverride.updated_at = new Date();
          action = 'UPDATE';
        }

        const savedPricing = await manager.getRepository(OrgFeatureOverride).save(pricingOverride);
        updatedPricing.push(savedPricing);

        // 🔹 Add log entry
        const log = manager.getRepository(OrgFeatureOverrideLog).create({
          override_id: savedPricing.override_id,
          org_id: savedPricing.org_id,
          plan_id: savedPricing.plan_id,
          feature_id: savedPricing.feature_id,
          mapping_id: savedPricing.mapping_id,
          old_value: oldValue,
          new_value: savedPricing.override_value,
          changed_by: changedBy ?? null,
          action,
        });
        logs.push(await manager.getRepository(OrgFeatureOverrideLog).save(log));

        // 🔹 Sync with public overrides too
        let publicOverride = await manager.getRepository(OrgOverride).findOne({
          where: {
            org_id,
            plan_id: savedPricing.plan_id,
            feature_id: savedPricing.feature_id,
            is_deleted: false,
          },
        });

        if (!publicOverride) {
          publicOverride = manager.getRepository(OrgOverride).create({
            override_id: savedPricing.override_id,
            org_id: savedPricing.org_id,
            plan_id: savedPricing.plan_id,
            feature_id: savedPricing.feature_id,
            mapping_id: savedPricing.mapping_id,
            override_value: savedPricing.override_value,
            default_value: savedPricing.default_value,
            is_active: savedPricing.is_active,
            is_deleted: savedPricing.is_deleted,
          });
        } else {
          publicOverride.override_value = savedPricing.override_value;
          publicOverride.is_active = savedPricing.is_active;
          publicOverride.is_deleted = savedPricing.is_deleted;
          publicOverride.updated_at = new Date();
        }

        updatedPublic.push(await manager.getRepository(OrgOverride).save(publicOverride));

      }

      return { pricing: updatedPricing, public: updatedPublic, logs };
    });
  }


  // async getOverridesByOrgId(orgId: number): Promise<OrgOverride[]> {
  //   try {
  //     return await this.publicOverrideRepo.find({
  //       where: { org_id: orgId, is_deleted: false },
  //       order: { updated_at: 'DESC' },
  //     });
  //   } catch (error) {
  //     console.error('Error fetching overrides:', error);
  //     throw new Error('Failed to fetch overrides');
  //   }
  // }
  async getOverridesByOrgId(orgId: number): Promise<any[]> {
    try {
      const overrides = await this.pricingOverrideRepo
        .createQueryBuilder('override')
        .leftJoinAndSelect('override.feature', 'feature') //  join with feature master
        .where('override.org_id = :orgId', { orgId })
        .andWhere('override.is_deleted = false')
        .orderBy('override.updated_at', 'DESC')
        .getMany();

      return overrides.map((o) => ({
        override_id: o.override_id,
        org_id: o.org_id,
        plan_id: o.plan_id,
        feature_id: o.feature_id,
        feature_name: o['feature']?.feature_name ?? null, //  human-readable
        default_value: o.default_value,
        override_value: o.override_value,
        is_active: o.is_active,
        created_at: o.created_at,
        updated_at: o.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching overrides:', error);
      throw new Error('Failed to fetch overrides');
    }
  }

  async getAllFeatures(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive',
    productId: number,
  ) {
    try {
      // const qb = this.featureRepository.createQueryBuilder('f');
      const qb = this.featureRepository
        .createQueryBuilder('f')
        .leftJoinAndSelect('f.product', 'p'); // ✅ join product
      // Always exclude soft-deleted
      // qb.andWhere('f.is_deleted = false');

      if (search) {
        qb.andWhere(
          '(LOWER(f.feature_name) LIKE :search OR LOWER(f.description) LIKE :search OR LOWER(p.name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      if (status === 'Active') {
        qb.andWhere('f.is_active = true');
      } else if (status === 'Inactive') {
        qb.andWhere('f.is_active = false');
      }
      if (productId) {
        qb.andWhere('f.product_id = :productId', { productId });
      }

      const [data, total] = await qb
        .orderBy('f.feature_id', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { data, total };
    } catch (error) {
      throw new Error('Error fetching features: ' + error.message);
    }
  }


  async getAllPlansWithBilling(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive',
    productId?: number,
  ): Promise<{ data: Plan[]; total: number }> {
    try {
      const qb = this.planRepository.createQueryBuilder('p')
        .leftJoinAndSelect('p.billings', 'b')
        .leftJoinAndSelect('p.product', 'prod')
              .loadRelationCountAndMap(
        'p.organization_count', // maps the count to p.organization_count
        'p.subscriptions', // relation to count
        'subs', // alias for OrgSubscription
        (qb) => qb
          .where('subs.is_active = true')
          .andWhere('subs.is_activated = true'),
      );

      if (search) {
        qb.andWhere('(LOWER(p.plan_name) LIKE :search OR LOWER(p.description) LIKE :search)', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      if (status === 'Active') qb.andWhere('p.is_active = true');
      else if (status === 'Inactive') qb.andWhere('p.is_active = false');
      if (productId) {
        qb.andWhere('p.product_id = :productId', { productId });
      }
      const [data, total] = await qb
        .orderBy('p.plan_id', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { data, total };
    } catch (error) {
      throw new Error('Error fetching plans with billing: ' + error.message);
    }
  }

  async getAllPlansWithBillingAndFeatures(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive',
    productId?: number,
    planId?: number,
  ): Promise<{ data: any[]; total: number }> {
    try {
      const qb = this.planFeatureMappingRepository
        .createQueryBuilder('fm')
        .leftJoinAndSelect('fm.plan', 'p')
        .leftJoinAndSelect('fm.feature', 'f')
        .leftJoinAndSelect('p.billings', 'b') // safely join billings
        .leftJoinAndSelect('fm.product', 'pr');

      // Search filter
      if (search) {
        qb.andWhere(
          '(LOWER(p.plan_name) LIKE :search OR LOWER(f.feature_name) LIKE :search OR LOWER(pr.name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // Status filter on plan
      if (status === 'Active') qb.andWhere('p.is_active = true');
      else if (status === 'Inactive') qb.andWhere('p.is_active = false');
      // Product filter
      if (productId) {
        qb.andWhere('pr.product_id = :productId', { productId });
      }

      // Plan filter
      if (planId) {
        qb.andWhere('p.plan_id = :planId', { planId });
      }
      // Pagination
      const [rows, total] = await Promise.all([
        qb
          .orderBy('fm.mapping_id', 'ASC') // use correct column name
          .skip((page - 1) * limit)
          .take(limit)
          .getMany(),
        qb.getCount(),
      ]);

      // Format output
      const data = rows.map((r) => ({
        mapping_id: r.mapping_id,
        mapping_status: r.status,
        feature_name: r.feature?.feature_name || null,
        feature_value: r.feature_value,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        product: r.product
          ? {
            id: r.product.productId,
            name: r.product.name,
            description: r.product.description,
            isActive: r.product.isActive,
          }
          : null,

        plan: {
          id: r.plan?.plan_id || null,
          name: r.plan?.plan_name || null,
          description: r.plan?.description || null,
          status: r.plan?.is_active ? 'Active' : 'Inactive',
        },
        billing: r.plan?.billings?.length
          ? r.plan.billings.map((b) => ({
            id: b.billing_id,
            cycle: b.billing_cycle,
            price: b.price,
            discount: b.discounted_percentage,
          }))
          : [],
      }));

      return { data, total };
    } catch (error) {
      throw new Error(
        'Error fetching plans with billing and features: ' + error.message,
      );
    }
  }

  // create feature
  async createFeature(payload: CreateFeatureDto): Promise<Feature> {
    const { feature_name, description, default_value, product_id } = payload;

    // Check if feature already exists
    const existing = await this.featureRepository.findOne({
      where: { feature_name, product_id, is_deleted: false },
    });
    if (existing) {
      throw new BadRequestException('Feature with this name already exists for this product');
    }

    const feature = this.featureRepository.create({
      feature_name,   // ✅ matches entity column
      description,
      default_value,
      product_id,
    });

    return await this.featureRepository.save(feature);
  }



  // update feature
  // feature.service.ts
  async updateFeature(feature_id: number, payload: UpdateFeatureDto): Promise<Feature> {
    const feature = await this.featureRepository.findOne({ where: { feature_id } });
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    Object.assign(feature, payload);
    return await this.featureRepository.save(feature);
  }

  // Get feature details by ID
  async getFeatureDetailsById(feature_id: number): Promise<any> {
    try {
      const feature = await this.featureRepository.findOne({
        where: { feature_id, is_active: true },
        // eager: true in entity will already load 'product'
      });

      if (!feature) {
        throw new Error('Feature not found');
      }

      return {
        feature_id: feature.feature_id,
        feature_name: feature.feature_name,
        description: feature.description,
        default_value: feature.default_value,
        is_active: feature.is_active,
        set_limit: feature.set_limit,
        product_id: feature.product?.productId || feature.product_id || null,
        created_at: feature.created_at,
        updated_at: feature.updated_at,
      };
    } catch (error) {
      console.error('Error fetching feature details:', error);
      throw new Error('Failed to fetch feature details');
    }
  }


  // Delete feature by ID
  async deleteFeature(id: number): Promise<void> {
    try {
      const feature = await this.featureRepository.findOne({
        where: { feature_id: id },
      });

      if (!feature) {
        throw new Error('Feature not found');
      }

      // Soft delete
      feature.is_active = false;
      feature.is_deleted = true;

      await this.featureRepository.save(feature);
    } catch (error) {
      console.error('Error deleting feature:', error);
      throw new Error('Failed to delete feature');
    }
  }

  async getActivePlans(): Promise<{ id: number; name: string }[]> {
    try {
      const plans = await this.planRepository.find({
        select: ['plan_id', 'plan_name'],
        where: { is_active: true },
        order: { plan_name: 'ASC' },
      });

      return plans.map(p => ({ id: p.plan_id, name: p.plan_name }));
    } catch (error) {
      throw new Error('Error fetching active plans: ' + error.message);
    }
  }

  async getActiveFeatures(): Promise<{ id: number; name: string }[]> {
    try {
      const features = await this.featureRepository.find({
        select: ['feature_id', 'feature_name', 'set_limit'],
        where: { is_active: true },
        order: { feature_name: 'ASC' },
      });

      return features.map(f => ({ id: f.feature_id, name: f.feature_name, limit: f.set_limit, }));
    } catch (error) {
      throw new Error('Error fetching active features: ' + error.message);
    }
  }
  // subscription.service.ts (or payment.service.ts)
  async getActivePaymentMethods(): Promise<{ id: number; name: string }[]> {
    try {
      const methods = await this.paymentMethod.find({
        select: ['methodId', 'methodName'],  // adjust if your column names differ
        where: { isActive: true },
        order: { displayOrder: 'ASC' },
      });

      return methods.map(m => ({ id: m.methodId, name: m.methodName }));
    } catch (error) {
      throw new Error('Error fetching active payment methods: ' + error.message);
    }
  }

  // create mapping
  // async createMapping(payload: CreateMappingDto): Promise<PlanFeatureMapping[]> {
  //   const mappings: PlanFeatureMapping[] = [];

  //   for (const f of payload.features) {
  //     const featureValue = f.limit === "" ? null : f.limit;

  //     // Check any mapping for the same plan & feature
  //     const existing = await this.planFeatureMappingRepository.findOne({
  //       where: { product_id: payload.product_id, plan_id: payload.plan_id, feature_id: f.feature_id },
  //     });

  //     if (existing) {
  //       // If it’s Active, update feature_value
  //       existing.feature_value = featureValue;
  //       existing.status = 'Active';
  //       const updated = await this.planFeatureMappingRepository.save(existing);
  //       mappings.push(updated);
  //     } else {
  //       // Create new mapping
  //       const newMapping = this.planFeatureMappingRepository.create({
  //         product_id: payload.product_id,
  //         plan_id: payload.plan_id,
  //         feature_id: f.feature_id,
  //         feature_value: featureValue,
  //         status: 'Active',
  //       });
  //       const saved = await this.planFeatureMappingRepository.save(newMapping);
  //       mappings.push(saved);
  //     }
  //   }

  //   return mappings;
  // }
async createMapping(payload: CreateMappingDto): Promise<PlanFeatureMapping[]> {
  const mappings: PlanFeatureMapping[] = [];

  // Combine both feature sets with a flag
  const allFeatures = [
    ...(payload.features || []).map(f => ({ ...f, isTrial: false })),
    ...(payload.trial_features || []).map(f => ({ ...f, isTrial: true })),
  ];

  for (const f of allFeatures) {
    const featureValue = f.limit === "" ? null : f.limit;

    // Check existing mapping for same product, plan, feature & trial flag
    const existing = await this.planFeatureMappingRepository.findOne({
      where: {
        product_id: payload.product_id,
        plan_id: payload.plan_id,
        feature_id: f.feature_id,
        is_trial: f.isTrial, // 👈 add this column in entity if not present
      },
    });

    if (existing) {
      // 🔄 Update existing
      existing.feature_value = featureValue;
      existing.status = payload.status || "Active";
      const updated = await this.planFeatureMappingRepository.save(existing);
      mappings.push(updated);
    } else {
      // 🆕 Create new mapping
      const newMapping = this.planFeatureMappingRepository.create({
        product_id: payload.product_id,
        plan_id: payload.plan_id,
        feature_id: f.feature_id,
        feature_value: featureValue,
        status: payload.status || "Active",
        is_trial: f.isTrial, // 👈 differentiate trial vs normal
      });

      const saved = await this.planFeatureMappingRepository.save(newMapping);
      mappings.push(saved);
    }
  }

  return mappings;
}

  async updateMapping(mapping_id: number, payload: UpdateMappingDto): Promise<PlanFeatureMapping> {
    // find existing mapping
    const existing = await this.planFeatureMappingRepository.findOne({
      where: { mapping_id },
    });

    if (!existing) {
      throw new NotFoundException(`Mapping with ID ${mapping_id} not found`);
    }

    // update only provided fields
    if (payload.product_id !== undefined) {
      existing.product_id = payload.product_id;
    }
    if (payload.plan_id !== undefined) {
      existing.plan_id = payload.plan_id;
    }
    if (payload.feature_id !== undefined) {
      existing.feature_id = payload.feature_id;
    }
    if (payload.limit !== undefined) {
      existing.feature_value = payload.limit;
    }
    if (payload.status !== undefined) {
      existing.status = payload.status;
    }

    return await this.planFeatureMappingRepository.save(existing);
  }



  // get mapping details by ID
  async getMappingDetailsById(mapping_id: number): Promise<any> {
    try {
      const mapping = await this.planFeatureMappingRepository.findOne({
        where: { mapping_id },
        relations: ['feature', 'plan'], // optional, fetch names
      });

      if (!mapping) {
        throw new Error('Mapping not found');
      }

      return {
        mapping_id: mapping.mapping_id,
        feature_id: mapping.feature_id,
        feature_name: mapping.feature?.feature_name || null,
        feature_value: mapping.feature_value || null,
        plan_id: mapping.plan_id,
        plan_name: mapping.plan?.plan_name || null,
        limit: mapping.feature_value,
        status: mapping.status,
        created_at: mapping.created_at,
        updated_at: mapping.updated_at,
        product_id: mapping.product_id,
      };
    } catch (error) {
      console.error('Error fetching mapping details:', error);
      throw new Error('Failed to fetch mapping details');
    }
  }

  // delete mapping by ID (soft delete)
  async deleteMapping(mapping_id: number): Promise<void> {
    try {
      const mapping = await this.planFeatureMappingRepository.findOne({ where: { mapping_id } });
      if (!mapping) {
        throw new Error('Mapping not found');
      }

      // Soft delete
      mapping.status = 'Inactive';
      await this.planFeatureMappingRepository.save(mapping);
    } catch (error) {
      console.error('Error deleting mapping:', error);
      throw new Error('Failed to delete mapping');
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

  async createPayment(payload: CreatePaymentDto, userId: number) {
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
      payment_method: Number(transactionData.payment_method),
      methodId: 1,
      transaction_status: 'success', // Or get actual status from payment gateway
      paid_at: new Date(),
    });
    await this.paymentTransactionRepository.save(paymentTransaction);

    return { billingInfo, paymentTransaction };
  }

  async getSubscriptionDetailsByOrganization(
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

  async createSetting(dto: CreatePlanSettingDto): Promise<PlanSetting> {
    const setting = this.planSettingRepo.create(dto);
    return await this.planSettingRepo.save(setting);
  }

  async upsertSetting(dto: CreatePlanSettingDto): Promise<PlanSetting> {
    let setting = await this.planSettingRepo.findOne({
      where: { plan_id: dto.plan_id, setting_name: dto.setting_name },
    });

    if (setting) {
      Object.assign(setting, dto); // update
    } else {
      setting = this.planSettingRepo.create(dto); // create new
    }

    return await this.planSettingRepo.save(setting);
  }


  async getSettingsByPlan(plan_id: number): Promise<PlanSetting[]> {
    return await this.planSettingRepo.find({
      where: { plan_id, is_deleted: false },
    });
  }

  // async createOfflinePaymentRequest(userId: number) {
  //   // ✅ find active subscription of user
  //   const subscription = await this.subscriptionRepository.findOne({
  //     where: { created_by: userId, is_active: true },
  //     relations: ['billingInfo', 'plan'],
  //   });

  //   if (!subscription) {
  //     throw new Error('No active subscription found for this user');
  //   }

  //   // pick the first billing info (or handle differently if multiple exist)
  //   const billing = subscription.billingInfo?.[0];
  //   if (!billing) {
  //     throw new Error('No billing info found for this subscription');
  //   }

  //   // create offline request
  //   const request = this.offlinePaymentRepo.create({
  //     subscription_id: subscription.subscription_id,
  //     billing_id: billing.billing_id,
  //     plan_id: subscription.plan_id,
  //     amount: subscription.grand_total,
  //     currency: 'USD',
  //     status: 'pending',
  //     created_by: userId,
  //   });

  //   return await this.offlinePaymentRepo.save(request);
  // }
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

  async getOfflineRequests(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'pending' | 'approved' | 'rejected'
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const qb = this.billingInfoRepository
        .createQueryBuilder('billing')
        .leftJoinAndSelect('billing.orgSubscription', 'sub')
        .leftJoinAndSelect('sub.plan', 'plan')
        .leftJoinAndSelect('billing.product', 'product')
        .orderBy('billing.created_at', 'DESC');
      qb.andWhere('billing.method_id = :methodId', { methodId: 5 });
      qb.andWhere('sub.is_active = :isActive', { isActive: true });
      qb.andWhere('sub.is_activated = :isActive', { isActive: true });

      if (search) {
        qb.andWhere(
          `(LOWER(billing.first_name) LIKE :search OR LOWER(billing.last_name) LIKE :search OR LOWER(billing.email) LIKE :search)`,
          { search: `%${search.toLowerCase()}%` }
        );
      }

      // Add pagination
      qb.skip((page - 1) * limit).take(limit);

      const [billingData, total] = await qb.getManyAndCount();

      const data = billingData.map((b) => ({
        billing_id: b.billing_id,
        first_name: b.first_name,
        last_name: b.last_name,
        email: b.email,
        phone_number: b.phone_number,
        company_name: b.company_name,
        status: b.status,
        order_placed_by: b.orderplacedby, // ✅ include orderplacedby
        customer_po: b.customerpo,
        payment_term: b.paymentterm,
        product: b.product
          ? {
            product_id: b.product.productId,
            product_name: b.product.name,
          }
          : null,

        subscription: b.orgSubscription
          ? {
            subscription_id: b.orgSubscription.subscription_id,
            organization_profile_id: b.orgSubscription.organization_profile_id,
            start_date: b.orgSubscription.start_date,
            renewal_date: b.orgSubscription.renewal_date,
            payment_status: b.orgSubscription.payment_status,
            billing_id: b.orgSubscription.sub_billing_id,
            price: b.orgSubscription.price,
            grand_total: b.orgSubscription.grand_total,
            discount: b.orgSubscription.percentage,

            plan: b.orgSubscription.plan
              ? {
                plan_id: b.orgSubscription.plan.plan_id,
                plan_name: b.orgSubscription.plan.plan_name,
              }
              : null,
          }
          : null,
      }));

      return { data, total, page, limit };
    } catch (error) {
      throw new Error('Error fetching all billing and subscription info: ' + error.message);
    }
  }

  async updateStatus(request_id: number, status: 'approved' | 'rejected'): Promise<any> {
    const existing = await this.billingInfoRepository.findOne({
      where: { billing_id: request_id },
    });

    if (!existing) return null;

    existing.status = status;
    return await this.billingInfoRepository.save(existing);
  }

  // combine data of the trial and the live
  async getTrialAndLiveSubscriptions(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live',
  ): Promise<{ trial: any[]; live: any[]; total: number }> {
    try {
      const qb = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .leftJoinAndSelect('subscription.product', 'product')
        .leftJoinAndSelect('subscription.organization', 'org')
        .addSelect(['org.organization_name', 'product.name'])
        .orderBy('subscription.created_at', 'DESC');
      qb.andWhere('subscription.is_active = :active', { active: true });
      qb.andWhere('subscription.is_activated = :active', { active: true });

      // 🔹 Apply search (plan name or org name)
      if (search) {
        qb.andWhere(
          '(LOWER(plan.plan_name) LIKE :search OR LOWER(org.organization_name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // 🔹 Apply status filter
      // if (status === 'Active') {
      //   qb.andWhere('subscription.is_active = :active', { active: true });
      // } else if (status === 'Inactive') {
      //   qb.andWhere('subscription.is_active = :active', { active: false });
      // }
      if (status === 'Trial') {
        qb.andWhere('subscription.is_trial_period = :trial', { trial: true });
      } else if (status === 'Live') {
        qb.andWhere('subscription.is_trial_period = :trial', { trial: false });
      }

      // 🔹 Fetch paginated subscriptions
      const [subscriptions, total] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // 🔹 Split into Trial & Live arrays
      const trial: any[] = [];
      const live: any[] = [];

      subscriptions.forEach((sub: any) => {
        const mapped = {
          subscription_id: sub.subscription_id,
          organization_profile_id: sub.organization_profile_id,
          organization_name: sub.organization?.organization_name || null,
          billing_id: sub.sub_billing_id,
          order_id: sub.sub_order_id,
          start_date: sub.start_date,
          renewal_date: sub.renewal_date,
          payment_status: sub.payment_status,
          is_trial_period: sub.is_trial_period,
          is_active: sub.is_active,
          plan_billing_id: sub.plan_billing_id,
          renewal: sub.auto_renewal,
          restrict_login: sub.restrict_login,
          plan: {
            plan_id: sub.plan?.plan_id,
            plan_name: sub.plan?.plan_name,
            description: sub.plan?.description,
            set_trial: sub.plan?.set_trial,
          },
        product: {
          product_id: sub.product?.product_id,
          product_name: sub.product?.name || null,
        },
        };

        if (sub.is_trial_period) {
          trial.push(mapped);
        } else {
          live.push(mapped);
        }
      });

      return { trial, live, total };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }

  // Get all renewals
    async getRenewals(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live',
      filters?: {
    renewalStatus?: string;
    quoteStatus?: string;
    startDate?: string;
    endDate?: string;
    plan?: string;
  },

  ): Promise<{ trial: any[]; live: any[]; total: number }> {
    try {
      const qb = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .leftJoinAndSelect('subscription.organization', 'org')
        .leftJoinAndSelect('subscription.renewalStatus', 'renewalStatus') // 🔹 join renewal status
        .addSelect(['org.organization_name', 'renewalStatus.status_name', 'renewalStatus.status_id'])
        .addSelect(['org.organization_name'])
        .orderBy('subscription.renewal_date', 'DESC');
      qb.andWhere('subscription.is_active = :active', { active: true });
      qb.andWhere('subscription.is_activated = :active', { active: true });

      // 🔹 Apply search (plan name or org name)
      if (search) {
        qb.andWhere(
          '(LOWER(plan.plan_name) LIKE :search OR LOWER(org.organization_name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // 🔹 Apply status filter
      // if (status === 'Active') {
      //   qb.andWhere('subscription.is_active = :active', { active: true });
      // } else if (status === 'Inactive') {
      //   qb.andWhere('subscription.is_active = :active', { active: false });
      // }
      if (status === 'Trial') {
        qb.andWhere('subscription.is_trial_period = :trial', { trial: true });
      } else if (status === 'Live') {
        qb.andWhere('subscription.is_trial_period = :trial', { trial: false });
      }


          // ✅ 🔹 Apply Additional Filters (from frontend)
    if (filters) {
      const { renewalStatus, quoteStatus, startDate, endDate, plan } = filters;

      // Renewal Status Filter
      if (renewalStatus && renewalStatus !== 'All') {
        // Use subscription.renewal_status (numeric id) instead of status_name
        qb.andWhere('subscription.renewal_status = :rStatusId', {
          rStatusId: Number(renewalStatus),
        });
      }


      // Quote Status Filter (if your subscription table has a column for it)
      if (quoteStatus && quoteStatus !== 'All') {
        qb.andWhere('subscription.quote_status = :qStatus', { qStatus: quoteStatus });
      }

      // Plan Filter
      if (plan && plan !== 'All') {
        qb.andWhere('plan.plan_id = :planId', { planId: Number(plan) });
      }

      // Date Range Filter
      if (startDate && endDate) {
        qb.andWhere('subscription.renewal_date BETWEEN :start AND :end', {
         start: `${startDate} 00:00:00`,
         end: `${endDate} 23:59:59`,
        });
      } else if (startDate) {
        qb.andWhere('subscription.renewal_date >= :start', { start: `${startDate} 00:00:00` });
      } else if (endDate) {
        qb.andWhere('subscription.renewal_date <= :end', { end: `${endDate} 23:59:59` });
      }
    }

      // 🔹 Fetch paginated subscriptions
      const [subscriptions, total] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // 🔹 Split into Trial & Live arrays
      const trial: any[] = [];
      const live: any[] = [];

      subscriptions.forEach((sub: any) => {
        const mapped = {
          subscription_id: sub.subscription_id,
          organization_profile_id: sub.organization_profile_id,
          organization_name: sub.organization?.organization_name || null,
          billing_id: sub.sub_billing_id,
          order_id: sub.sub_order_id,
          start_date: sub.start_date,
          renewal_date: sub.renewal_date,
          payment_status: sub.payment_status,
          is_trial_period: sub.is_trial_period,
          is_active: sub.is_active,
          plan_billing_id: sub.plan_billing_id,
          renewal: sub.auto_renewal,
          plan: {
            plan_id: sub.plan?.plan_id,
            plan_name: sub.plan?.plan_name,
            description: sub.plan?.description,
            set_trial: sub.plan?.set_trial,
          },
          renewalStatus: sub.renewalStatus
          ? {
              status_id: sub.renewalStatus.status_id,
              status_name: sub.renewalStatus.status_name,
            }
          : null,
        };

        if (sub.is_trial_period) {
          trial.push(mapped);
        } else {
          live.push(mapped);
        }
      });

      return { trial, live, total };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }
  // get the trial data only
  async getTrialSubscriptions(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive' = 'All',
  ): Promise<{ data: any[]; total: number }> {
    try {
      const qb = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .leftJoinAndSelect('subscription.organization', 'org')
        .addSelect(['org.organization_name'])
        .where('subscription.is_trial_period = :trial', { trial: true })
        .orderBy('subscription.created_at', 'DESC');

      // Apply search filter
      if (search) {
        qb.andWhere(
          '(LOWER(plan.plan_name) LIKE :search OR LOWER(org.organization_name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // Apply status filter
      if (status === 'Active') qb.andWhere('subscription.is_active = :active', { active: true });
      else if (status === 'Inactive') qb.andWhere('subscription.is_active = :active', { active: false });

      const [subscriptions, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

      const data = subscriptions.map((sub: any) => ({
        subscription_id: sub.subscription_id,
        organization_profile_id: sub.organization_profile_id,
        organization_name: sub.organization?.organization_name || null,
        start_date: sub.start_date,
        renewal_date: sub.renewal_date,
        payment_status: sub.payment_status,
        is_trial_period: sub.is_trial_period,
        is_active: sub.is_active,
        plan: {
          plan_id: sub.plan?.plan_id,
          plan_name: sub.plan?.plan_name,
          description: sub.plan?.description,
          set_trial: sub.plan?.set_trial,
        },
      }));

      return { data, total };
    } catch (error) {
      console.error('Error fetching trial subscriptions:', error);
      throw new Error('Failed to fetch trial subscriptions');
    }
  }

  //get live data only
  async getLiveSubscriptions(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive' = 'All',
  ): Promise<{ data: any[]; total: number }> {
    try {
      const qb = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .leftJoinAndSelect('subscription.organization', 'org')
        .addSelect(['org.organization_name'])
        .where('subscription.is_trial_period = :trial', { trial: false })
        .orderBy('subscription.created_at', 'DESC');

      // Apply search filter
      if (search) {
        qb.andWhere(
          '(LOWER(plan.plan_name) LIKE :search OR LOWER(org.organization_name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // Apply status filter
      if (status === 'Active') qb.andWhere('subscription.is_active = :active', { active: true });
      else if (status === 'Inactive') qb.andWhere('subscription.is_active = :active', { active: false });

      const [subscriptions, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

      const data = subscriptions.map((sub: any) => ({
        subscription_id: sub.subscription_id,
        organization_profile_id: sub.organization_profile_id,
        organization_name: sub.organization?.organization_name || null,
        start_date: sub.start_date,
        renewal_date: sub.renewal_date,
        payment_status: sub.payment_status,
        is_trial_period: sub.is_trial_period,
        is_active: sub.is_active,
        plan: {
          plan_id: sub.plan?.plan_id,
          plan_name: sub.plan?.plan_name,
          description: sub.plan?.description,
          set_trial: sub.plan?.set_trial,
        },
      }));

      return { data, total };
    } catch (error) {
      console.error('Error fetching live subscriptions:', error);
      throw new Error('Failed to fetch live subscriptions');
    }
  }


  async DeleteSubscription(id: number): Promise<void> {
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { subscription_id: id },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Soft delete
      subscription.is_active = false;
      subscription.is_deleted = true;

      await this.subscriptionRepository.save(subscription);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw new Error('Failed to delete subscription');
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

  // All customer details
  async getAllSubscriptionDetails(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive' | 'Trial' | 'Live',
  ): Promise<{ subscriptions: any[]; total: number }> {
    try {
      const qb = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .leftJoinAndSelect('subscription.organization', 'org')
        .leftJoinAndSelect('subscription.product', 'product')
        .leftJoinAndSelect('subscription.billingInfo', 'billing')
        .leftJoinAndSelect('billing.paymentMethod', 'billingMethod')
        .leftJoinAndSelect('subscription.paymentTransactions', 'payment') // <--- use paymentTransactions
        .leftJoinAndSelect('payment.method', 'paymentMethod')
        .leftJoinAndSelect('subscription.subscriptionType', 'type')
        .orderBy('subscription.created_at', 'DESC');

      // 🔹 Apply search (organization name, plan name, or billing info)
      if (search) {
        qb.andWhere(
          '(LOWER(plan.plan_name) LIKE :search OR LOWER(org.organization_name) LIKE :search OR LOWER(billing.invoice_number) LIKE :search OR LOWER(product.name) LIKE :search))',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // 🔹 Apply status filter
      if (status === 'Active') {
        qb.andWhere('subscription.is_active = :active', { active: true });
      } else if (status === 'Inactive') {
        qb.andWhere('subscription.is_active = :active', { active: false });
      } else if (status === 'Trial') {
        qb.andWhere('subscription.is_trial_period = :trial', { trial: true });
      } else if (status === 'Live') {
        qb.andWhere('subscription.is_trial_period = :trial', { trial: false });
      }

      // 🔹 Pagination
      const [subscriptions, total] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // 🔹 Map the data
      const mappedSubs = subscriptions.map((sub: any) => ({
        subscription_id: sub.subscription_id,
        organization_profile_id: sub.organization_profile_id,
        organization_name: sub.organization?.organization_name || null,
        start_date: sub.start_date,
        renewal_date: sub.renewal_date,
        payment_status: sub.payment_status,
        is_trial_period: sub.is_trial_period,
        is_active: sub.is_active,
        amount: sub.price,
        product: sub.product ? {
          product_id: sub.product.productId,
          name: sub.product.name
        } : null,
        plan: {
          plan_id: sub.plan?.plan_id,
          plan_name: sub.plan?.plan_name,
          description: sub.plan?.description,
          set_trial: sub.plan?.set_trial,
        },
        // Take first billing info (if exists)
        billing: sub.billingInfo && sub.billingInfo.length > 0 ? {
          first_name: sub.billingInfo[0].first_name,
          last_name: sub.billingInfo[0].last_name,
          email: sub.billingInfo[0].email,
          phone_number: sub.billingInfo[0].phone_number,
          status: sub.billingInfo[0].status,
          method: sub.billingInfo[0].paymentMethod?.methodName || null,

        } : null,
        // All payment transactions
        payments: sub.paymentTransactions ? sub.paymentTransactions.map((p: any) => ({
          payment_id: p.payment_id,
          amount: p.amount,
          status: p.status,
          date: p.created_at,
          method: p.paymentMethod?.methodName || null,
        })) : [],
      }));


      return { subscriptions: mappedSubs, total };
    } catch (error) {
      console.error('Error fetching subscriptions with billing:', error);
      throw new Error('Failed to fetch subscriptions with billing');
    }
  }

  //
  async getAllOrganizationsWithPrimaryUsers(
  page: number,
  limit: number,
  search: string,
): Promise<{ organizations: any[]; total: number }> {
  try {
    const qb = this.registerUser
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'org')
      .where('user.is_primary_user = :primary', { primary: 'Y' })
      .orderBy('org.organization_name', 'ASC');

    // 🔹 Apply search on organization name or primary user name/email
    if (search) {
      qb.andWhere(
        '(LOWER(org.organization_name) LIKE :search OR LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(user.business_email) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // 🔹 Pagination
    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 🔹 Map to return organization + primary user
    const mappedOrgs = users.map((user: any) => ({
      organization_id: user.organization.organization_id,
      organization_name: user.organization.organization_name,
      organization_schema_name: user.organization.organization_schema_name,
      industry_type_id: user.organization.industry_type_id,
      primary_user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        business_email: user.business_email,
        phone_number: user.phone_number,
      },
    }));

    return { organizations: mappedOrgs, total };
  } catch (error) {
    console.error('Error fetching organizations with primary users:', error);
    throw new Error('Failed to fetch organizations with primary users');
  }
}


  async createCustomer(
    createOrganizationDto: CreateCustomerDto,
    context: any,
  ): Promise<any> {
    const {
      companyName,
      firstName,
      lastName,
      businessEmail,
      phoneNumber,
      industryId,
      billingFirstName,
      billingLastName,
      billingEmail,
      billingPhone,
      // planId,
      // billingCycle,
      // startDate,
      // endDate,
      // price,
      sameAsPrimary,
      productId,
      // autoRenewal,
      // isTrialPeriod,
      // paymentMethodId
      // make sure your frontend sends this
    } = createOrganizationDto;
    const assignedProductId = productId || 1;

    // Validate required fields
    if (!companyName || !firstName || !lastName || !businessEmail || !phoneNumber || !industryId) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Missing required fields.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid email format.',
      });
    }

    // Normalize Gmail addresses
    const [localPart, domain] = businessEmail.trim().toLowerCase().split('@');
    const normalizedEmail =
      domain === 'gmail.com' || domain === 'googlemail.com'
        ? `${localPart.split('+')[0].replace(/\./g, '')}@${domain}`
        : `${localPart}@${domain}`;

    try {
      // Check if org exists
      const existingOrg = await this.orgRepo.findOne({
        where: { organization_name: companyName },
        relations: ['users'],
      });

      // Check if email exists globally
      const existingUserGlobal = await this.registerUser.findOne({
        where: { business_email: normalizedEmail },
        relations: ['organization'],
      });

      // CASE: Existing org + existing user under same org
      if (existingOrg && existingUserGlobal && existingUserGlobal.organization.organization_name === companyName) {
        if (!existingUserGlobal.verified) {
          const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

          existingUserGlobal.otp = newOtp;
          existingUserGlobal.otp_expiry = otpExpiry;
          await this.registerUser.save(existingUserGlobal);

          // await this.mailService.sendEmail(
          //   normalizedEmail,
          //   'OTP for NORBIK Account Verification',
          //   await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
          //     name: `${firstName} ${lastName}`,
          //     otp: newOtp,
          //     email: normalizedEmail,
          //   }, this.mailConfigService),
          // );

          return {
            statusCode: 200,
            message: 'OTP resent. Please check your email for verification.',
            data: { userId: existingUserGlobal.user_id },
          };
        }

        return {
          statusCode: 200,
          message: 'Email already verified. Please log in.',
          data: { redirectToLogin: true, userId: existingUserGlobal.user_id },
        };
      }

      // CASE: Existing user but new org
      if (!existingOrg && existingUserGlobal) {
        if (existingUserGlobal.verified) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'You already registered with this email. Please log in.',
          });
        }

        // Not verified: update user info and resend OTP
        existingUserGlobal.first_name = firstName;
        existingUserGlobal.last_name = lastName;
        existingUserGlobal.phone_number = phoneNumber;

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        existingUserGlobal.otp = newOtp;
        existingUserGlobal.otp_expiry = otpExpiry;
        await this.registerUser.save(existingUserGlobal);

        // await this.mailService.sendEmail(
        //   normalizedEmail,
        //   'OTP for NORBIK Account Verification',
        //   await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
        //     name: `${firstName} ${lastName}`,
        //     otp: newOtp,
        //     email: normalizedEmail,
        //   }, this.mailConfigService),
        // );

        return {
          statusCode: 200,
          message: 'Email exists but not verified. OTP resent.',
          data: { userId: existingUserGlobal.user_id },
        };
      }

      // CASE: New organization
      const schemaName = companyName.toLowerCase().replace(/\s+/g, '_');
      const organization = this.orgRepo.create({
        organization_name: companyName,
        organization_schema_name: schemaName,
        industry_type_id: industryId,
      });

      const savedOrg = await this.orgRepo.save(organization);

      // Create primary user
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      const user = this.registerUser.create({
        organization: savedOrg,
        first_name: firstName,
        last_name: lastName,
        business_email: normalizedEmail,
        phone_number: phoneNumber,
        otp,
        otp_expiry: otpExpiry,
        is_primary_user: 'Y',
      });

      const savedUser = await this.registerUser.save(user);

      // await this.mailService.sendEmail(
      //   normalizedEmail,
      //   'OTP for NORBIK Account Verification',
      //   await renderEmail(EmailTemplate.LOGIN_VERIFICATION, {
      //     name: `${firstName} ${lastName}`,
      //     otp,
      //     email: normalizedEmail,
      //   }, this.mailConfigService),
      // );

      // Fetch plan details
      // const selectedPlan = await this.planRepository.findOne({
      //   where: { plan_id: planId  },
      // });

      // Handle trial check
      //   const isTrial = selectedPlan?.set_trial === true;
      // Create subscription in pricing schema
      const today = new Date();
      const renewalDate = new Date(today);
      renewalDate.setMonth(today.getMonth() + 1);
      // const start = startDate ? new Date(startDate) : new Date();
      // const renewal = endDate ? new Date(endDate) : new Date(start);
      // if (!endDate) {
      //   // fallback: calculate renewal based on cycle
      //   if (billingCycle === 'monthly') {
      //     renewal.setMonth(renewal.getMonth() + 1);
      //   } else if (billingCycle === 'yearly') {
      //     renewal.setFullYear(renewal.getFullYear() + 1);
      //   }
      // }
      const SubbillingId = await this.generateBillingId();
      const subOrderId = await this.generateOrderId();

      const orgSub = this.subscriptionRepository.create({
        organization_profile_id: savedOrg.organization_id,
        plan_id: 1,
        plan_billing_id: '5',
        subscription_type_id: 1,
        start_date: today,
        renewal_date: renewalDate,
        payment_status: 'pending',
        price: 0,
        discounted_price: 0,
        grand_total: 0,
        is_active: false,
        is_deleted: false,
        created_by: savedUser.user_id,
        purchase_date: today,
        // auto_renewal: false,
        // is_trial_period: isTrial,
        sub_billing_id: SubbillingId,
        sub_order_id: subOrderId,

        productId: assignedProductId,
        // payment_mode: paymentMethodId, 
        // auto_renewal: autoRenewal, 
        // is_trial_period: isTrialPeriod, 
      });

      const savedSub = await this.subscriptionRepository.save(orgSub);
      // Create billing info if none exists
      let billing = await this.billingInfoRepository.findOne({
        where: { org_subscription_id: savedSub.subscription_id },
      });

      if (!billing) {
        billing = this.billingInfoRepository.create({
          org_subscription_id: savedSub.subscription_id,
          first_name: billingFirstName,
          last_name: billingLastName,
          email: billingEmail,
          phone_number: billingPhone,
          same_as_primary_contact: sameAsPrimary,
          methodId: 5, // default payment method ID
          created_at: new Date(),
          updated_at: new Date(),
          productId: assignedProductId,
        });

        billing = await this.billingInfoRepository.save(billing);
      }
      // Fetch plan feature mappings for selected plan
      // const planFeatures = await this.planFeatureMappingRepository.find({
      //   where: { plan_id: planId},
      //   relations: ['feature'],
      // });

      // // Insert into pricing schema limitations
      // const pricingLimitations = planFeatures.map(mapping =>
      //   this.pricingOverrideRepo.create({
      //     org_id: savedOrg.organization_id,
      //     plan_id: planId,
      //     feature_id: mapping.feature_id,
      //     mapping_id: mapping.mapping_id,
      //     override_value: mapping.feature_value ?? '0',
      //     default_value: mapping.feature_value ?? '0',
      //     is_active: true,
      //     is_deleted: false,
      //   }),
      // );
      // await this.pricingOverrideRepo.save(pricingLimitations);

      // // Insert into public schema overrides
      // const publicOverrides = planFeatures.map(mapping =>
      //   this.publicOverrideRepo.create({
      //     org_id: savedOrg.organization_id,
      //     plan_id: planId,
      //     feature_id: mapping.feature_id,
      //     mapping_id: mapping.mapping_id,
      //     override_value: mapping.feature_value ?? '0',
      //     default_value: mapping.feature_value ?? '0',
      //     is_active: true,
      //     is_deleted: false,
      //   }),
      // );
      // await this.publicOverrideRepo.save(publicOverrides);

      // await this.createOrganizationSchemaAndTables(savedUser);
      // if (assignedProductId === 1) {
      //   const schemaManager = new OrganizationSchemaManager(
      //     this.dataSource,
      //     this.mailConfigService,
      //     this.mailService,
      //   );

      //   // Call the method

      //   await schemaManager.createOrganizationSchemaAndTables(user);
      // } else {
      //   // Run HRMS organization schema logic
      //   const hrmsSchemaManager = new HrmsOrganizationSchemaManager(
      //     this.dataSource,
      //     this.mailConfigService,
      //     this.mailService,
      //   );

      //   await hrmsSchemaManager.createOrganizationSchemaAndTables(user);
      // }
      // Create initial payment transaction (pending until actual payment)
      // const paymentTx = this.paymentTransactionRepository.create({
      //   org_subscription_id: savedSub.subscription_id,
      //   amount: Number(price), // from payload
      //   currency: 'INR',
      //   payment_method: paymentMethodId, // or billing method if you have
      //   transaction_status: 'pending', // initial status
      //   transaction_reference: `INIT-${Date.now()}`, // generate unique reference
      //   methodId: 5, // default payment method id if you want
      //   created_at: new Date(),
      //   updated_at: new Date(),
      //   paid_at: new Date(), // or null if not yet paid
      // });

      // await this.paymentTransactionRepository.save(paymentTx);


      return {
        statusCode: 200,
        message: 'Customer created successfully. Password sent via email.',
        data: { schema: schemaName, userId: savedUser.user_id, subscriptionId: savedSub.subscription_id },
      };

    } catch (error) {
      console.error('Error creating organization:', error);

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        { statusCode: 500, message: 'Internal server error.', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update Customer
  async updateCustomer(
    updateDto: any,
  ): Promise<any> {
    const {
      subscriptionId, // required to identify subscription
      companyName,
      firstName,
      lastName,
      businessEmail,
      phoneNumber,
      industryId,
      billingFirstName,
      billingLastName,
      billingEmail,
      billingPhone,
      planId,
      billingCycle,
      startDate,
      endDate,
      price,
      sameAsPrimary,
    } = updateDto;

    if (!subscriptionId || !companyName || !firstName || !lastName || !businessEmail || !phoneNumber || !industryId) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Missing required fields.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid email format.',
      });
    }

    // Normalize Gmail addresses
    const [localPart, domain] = businessEmail.trim().toLowerCase().split('@');
    const normalizedEmail =
      domain === 'gmail.com' || domain === 'googlemail.com'
        ? `${localPart.split('+')[0].replace(/\./g, '')}@${domain}`
        : `${localPart}@${domain}`;

    try {
      // 1. Fetch subscription and related org
      const subscription = await this.subscriptionRepository.findOne({
        where: { subscription_id: subscriptionId },
        relations: ['organization', 'organization.users', 'billingInfo'],
      });

      if (!subscription) {
        throw new NotFoundException({ message: 'Subscription not found.' });
      }

      const organization = subscription.organization;
      const primaryUser = organization.users.find(u => u.is_primary_user === 'Y');

      if (!primaryUser) {
        throw new NotFoundException({ message: 'Primary user not found.' });
      }

      // 2. Update organization
      organization.organization_name = companyName;
      organization.industry_type_id = industryId;
      await this.orgRepo.save(organization);

      // 3. Update primary user
      primaryUser.first_name = firstName;
      primaryUser.last_name = lastName;
      primaryUser.business_email = normalizedEmail;
      primaryUser.phone_number = phoneNumber;
      await this.registerUser.save(primaryUser);

      // 4. Update subscription
      subscription.plan_id = planId || subscription.plan_id;
      subscription.plan_billing_id = billingCycle || subscription.plan_billing_id;

      // Dates
      const start = startDate ? new Date(startDate) : subscription.start_date;
      const renewal = endDate ? new Date(endDate) : subscription.renewal_date;
      subscription.start_date = start;
      subscription.renewal_date = renewal;
      subscription.price = price ? Number(price) : subscription.price;

      await this.subscriptionRepository.save(subscription);

      // 5. Update billing info
      let billing = subscription.billingInfo?.[0];
      if (billing) {
        billing.first_name = billingFirstName;
        billing.last_name = billingLastName;
        billing.email = billingEmail;
        billing.phone_number = billingPhone;
        billing.same_as_primary_contact = sameAsPrimary;
        await this.billingInfoRepository.save(billing);
      } else {
        billing = this.billingInfoRepository.create({
          org_subscription_id: subscription.subscription_id,
          first_name: billingFirstName,
          last_name: billingLastName,
          email: billingEmail,
          phone_number: billingPhone,
          same_as_primary_contact: sameAsPrimary,
          methodId: 5, // default payment method
          created_at: new Date(),
          updated_at: new Date(),
        });
        await this.billingInfoRepository.save(billing);
      }

      // 6. Optionally: update plan feature mappings if plan changed
      if (planId && planId !== subscription.plan_id) {
        const planFeatures = await this.planFeatureMappingRepository.find({
          where: { plan_id: planId },
          relations: ['feature'],
        });

        const pricingLimitations = planFeatures.map(mapping =>
          this.pricingOverrideRepo.create({
            org_id: organization.organization_id,
            plan_id: planId,
            feature_id: mapping.feature_id,
            mapping_id: mapping.mapping_id,
            override_value: mapping.feature_value ?? '0',
            default_value: mapping.feature_value ?? '0',
            is_active: true,
            is_deleted: false,
          }),
        );

        await this.pricingOverrideRepo.save(pricingLimitations);
      }
      let paymentTx = await this.paymentTransactionRepository.findOne({
        where: { org_subscription_id: subscription.subscription_id },
      });

      if (paymentTx) {
        // Update existing transaction
        paymentTx.amount = Number(price) || paymentTx.amount;
        paymentTx.currency = 'INR';
        paymentTx.payment_method = 5; // or billing method
        paymentTx.transaction_status = paymentTx.transaction_status || 'pending';
        paymentTx.updated_at = new Date();
        if (price) {
          paymentTx.paid_at = new Date(); // set if you consider price means paid
        }
        await this.paymentTransactionRepository.save(paymentTx);
      } else {
        // Create initial transaction
        paymentTx = this.paymentTransactionRepository.create({
          org_subscription_id: subscription.subscription_id,
          amount: Number(price) || 0,
          currency: 'INR',
          payment_method: 5, // or billing method if you track it
          transaction_status: 'pending',
          transaction_reference: `INIT-${Date.now()}`,
          methodId: 5, // default payment method
          created_at: new Date(),
          updated_at: new Date(),
          paid_at: null, // keep null until actual payment is captured
        });
        await this.paymentTransactionRepository.save(paymentTx);
      }

      return {
        statusCode: 200,
        message: 'Customer updated successfully.',
        data: {
          subscriptionId: subscription.subscription_id,
          userId: primaryUser.user_id,
          organizationId: organization.organization_id,
        },
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new HttpException(
        { statusCode: 500, message: 'Internal server error.', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async createOrUpdateOrder(orderDto: CreateOrderDto, context: any): Promise<any> {
  //   const {
  //     organizationId,
  //     planId,
  //     billingCycle,
  //     startDate,
  //     endDate,
  //     price,
  //     autoRenewal,
  //     isTrialPeriod,
  //     paymentMethodId,
  //     paymentTerm,
  //     customerPO,
  //     paymentStatus,
  //     orderPlacedBy,
  //     productId
  //   } = orderDto;

  //   if (!organizationId || !planId || !billingCycle || !price) {
  //     throw new BadRequestException({ statusCode: 400, message: "Missing required fields." });
  //   }

  //   try {
  //     const organization = await this.orgRepo.findOne({ where: { organization_id: organizationId } });
  //     if (!organization) throw new BadRequestException({ statusCode: 404, message: "Organization not found." });

  //     const today = new Date();
  //     const renewalDate = endDate ? new Date(endDate) : new Date(today);
  //     if (!endDate) {
  //       if (billingCycle === "monthly") renewalDate.setMonth(renewalDate.getMonth() + 1);
  //       else if (billingCycle === "yearly") renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  //     }

  //     const orgId = Number(orderDto.organizationId);
  //     const planId = Number(orderDto.planId);
  //     console.log("Checking existing subscription for org:", orgId, "plan:", planId);

  //     // Check if subscription already exists for this organization and plan
  //     let subscription = await this.subscriptionRepository.findOne({
  //       where: { organization_profile_id: orgId},
  //     });
  //     console.log("Existing subscription found:", subscription);

  //     if (!subscription) {
  //       // Create new subscription
  //       const subBillingId = await this.generateBillingId();
  //       subscription = this.subscriptionRepository.create({
  //         organization_profile_id: organizationId,
  //         productId: orderDto.productId,
  //         plan_id: planId, 
  //         plan_billing_id: billingCycle,
  //         subscription_type_id: 1,
  //         start_date: new Date(startDate) || today,
  //         renewal_date: renewalDate,
  //         price: Number(price),
  //         auto_renewal: autoRenewal,
  //         is_trial_period: isTrialPeriod,
  //         grand_total: 0,
  //         payment_status: paymentStatus  as 'pending' | 'completed' | 'failed' ,
  //         sub_billing_id: subBillingId,
  //         created_by: context.userId,
  //         purchase_date: today,
  //         payment_mode: String(paymentMethodId),
  //         is_activated: true,
  //       });
  //     } else {
  //       // Update existing subscription
  //       subscription.plan_billing_id = billingCycle;
  //       subscription.plan_id = planId;
  //       subscription.productId = orderDto.productId;
  //       subscription.start_date = new Date(startDate) || subscription.start_date;
  //       subscription.renewal_date = renewalDate;
  //       subscription.price = Number(price);
  //       subscription.auto_renewal = autoRenewal;
  //       subscription.is_trial_period = isTrialPeriod;
  //       subscription.grand_total= 0;
  //       subscription.payment_status = paymentStatus  as 'pending' | 'completed' | 'failed';
  //       subscription.purchase_date = today;
  //       subscription.payment_mode = String(paymentMethodId);
  //       subscription.is_active= true;
  //       subscription.is_activated= true;

  //     }

  //     const savedSub = await this.subscriptionRepository.save(subscription);

  //     // Billing info
  //     let billing = await this.billingInfoRepository.findOne({
  //       where: { org_subscription_id: savedSub.subscription_id },
  //     });

  //     if (!billing) {
  //       billing = this.billingInfoRepository.create({
  //         org_subscription_id: savedSub.subscription_id,
  //         orderplacedby: orderPlacedBy,
  //         paymentterm: paymentTerm,
  //         customerpo: customerPO,
  //         methodId: paymentMethodId || 5,
  //         created_at: new Date(),
  //         updated_at: new Date(),
  //       });
  //     } else {
  //       billing.methodId = paymentMethodId || billing.methodId;
  //       billing.orderplacedby = orderPlacedBy;
  //       billing.paymentterm = paymentTerm;
  //       billing.customerpo = customerPO;
  //       billing.updated_at = new Date();
  //     }

  //     await this.billingInfoRepository.save(billing);

  //     // Pricing overrides
  //     const planFeatures = await this.planFeatureMappingRepository.find({
  //       where: { plan_id: planId },
  //       relations: ["feature"],
  //     });

  //     for (const pf of planFeatures) {
  //       let orgOverride = await this.pricingOverrideRepo.findOne({
  //         where: { org_id: organizationId, plan_id: planId, feature_id: pf.feature_id },
  //       });
  //       if (!orgOverride) {
  //         orgOverride = this.pricingOverrideRepo.create({
  //           org_id: organizationId,
  //           plan_id: planId,
  //           feature_id: pf.feature_id,
  //           mapping_id: pf.mapping_id,
  //           override_value: pf.feature_value ?? "0",
  //           default_value: pf.feature_value ?? "0",
  //           is_active: true,
  //           is_deleted: false,
  //         });
  //       } else {
  //         orgOverride.override_value = pf.feature_value ?? orgOverride.override_value;
  //         orgOverride.default_value = pf.feature_value ?? orgOverride.default_value;
  //       }
  //       await this.pricingOverrideRepo.save(orgOverride);

  //       let publicOverride = await this.publicOverrideRepo.findOne({
  //         where: { org_id: organizationId, plan_id: planId, feature_id: pf.feature_id },
  //       });
  //       if (!publicOverride) {
  //         publicOverride = this.publicOverrideRepo.create({
  //           org_id: organizationId,
  //           plan_id: planId,
  //           feature_id: pf.feature_id,
  //           mapping_id: pf.mapping_id,
  //           override_value: pf.feature_value ?? "0",
  //           default_value: pf.feature_value ?? "0",
  //           is_active: true,
  //           is_deleted: false,
  //         });
  //       } else {
  //         publicOverride.override_value = pf.feature_value ?? publicOverride.override_value;
  //         publicOverride.default_value = pf.feature_value ?? publicOverride.default_value;
  //       }
  //       await this.publicOverrideRepo.save(publicOverride);
  //     }

  //     return { statusCode: 200, message: "Order created/updated successfully", data: savedSub };
  //   } catch (error) {
  //     console.error("Error creating/updating order:", error);
  //     throw new HttpException({ statusCode: 500, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  ///////////
//   async createOrUpdateOrder(orderDto: CreateOrderDto, context: any): Promise<any> {
//     const {
//       organizationId,
//       planId,
//       billingCycle,
//       startDate,
//       endDate,
//       price,
//       autoRenewal,
//       isTrialPeriod,
//       paymentMethodId,
//       paymentTerm,
//       customerPO,
//       paymentStatus,
//       orderPlacedBy,
//       productId
//     } = orderDto;
//   console.log('Incoming Order DTO:', orderDto);
//   console.log('Context:', context);
//     if (!organizationId || !planId || !billingCycle || !price || !productId) {
//       throw new BadRequestException({ statusCode: 400, message: "Missing required fields." });
//     }

//     try {
//       // 1️⃣ Fetch organization and its users
//       const organization = await this.orgRepo.findOne({
//         where: { organization_id: organizationId },
//         relations: ["users"],
//       });
// console.log('Fetched Organization:', organization);
//       if (!organization) throw new BadRequestException({ statusCode: 404, message: "Organization not found." });

//       const primaryUser = organization.users?.[0]; // first user as main contact
//   console.log('Primary User:', primaryUser);
//       // 2️⃣ Create or update subscription for the specific product
//       const today = new Date();
//       const renewalDate = endDate ? new Date(endDate) : new Date(today);
//       if (!endDate) {
//         if (billingCycle === "monthly") renewalDate.setMonth(renewalDate.getMonth() + 1);
//         else if (billingCycle === "yearly") renewalDate.setFullYear(renewalDate.getFullYear() + 1);
//       }
//     console.log(' Calculated Renewal Date:', renewalDate);

//       let subscription = await this.subscriptionRepository.findOne({
//         where: { organization_profile_id: organizationId,productId: productId}, // key change
//       });

//        console.log(' Existing Subscription:', subscription);

//       if (!subscription) {
//          console.log(' Creating new subscription');
//         const subBillingId = await this.generateBillingId();
//         const subOrderId = await this.generateOrderId();

//         subscription = this.subscriptionRepository.create({
//           organization_profile_id: organizationId,
//           productId,
//           plan_id: planId,
//           plan_billing_id: billingCycle,
//           subscription_type_id: 1,
//           start_date: new Date(startDate) || today,
//           renewal_date: renewalDate,
//           price: Number(price),
//           auto_renewal: autoRenewal,
//           is_trial_period: isTrialPeriod,
//           grand_total: 0,
//           payment_status: paymentStatus as 'pending' | 'completed' | 'failed',
//           sub_billing_id: subBillingId,
//           sub_order_id: subOrderId,
//           created_by: context.userId,
//           purchase_date: today,
//           payment_mode: String(paymentMethodId),
//           is_activated: true,
//         });
//       } else {
//         console.log(' Updating existing subscription');
//         // update existing subscription
//         subscription.plan_billing_id = billingCycle;
//         subscription.plan_id = planId;
//         subscription.start_date = new Date(startDate) || subscription.start_date;
//         subscription.renewal_date = renewalDate;
//         subscription.price = Number(price);
//         subscription.auto_renewal = autoRenewal;
//         subscription.is_trial_period = isTrialPeriod;
//         subscription.grand_total = 0;
//         subscription.payment_status = paymentStatus as 'pending' | 'completed' | 'failed';
//         subscription.purchase_date = today;
//         subscription.payment_mode = String(paymentMethodId);
//         subscription.is_active = true;
//         subscription.is_activated = true;
//         subscription.productId = productId;
//       }

//       const savedSub = await this.subscriptionRepository.save(subscription);
//     console.log(' Saved Subscription:', savedSub);

//       // 3️⃣ Save billing info
//       let billing = await this.billingInfoRepository.findOne({ where: { org_subscription_id: savedSub.subscription_id } });
//           console.log(' Existing Billing:', billing);

//       if (!billing) {
//         console.log(' Creating new billing info');
//         billing = this.billingInfoRepository.create({
//           org_subscription_id: savedSub.subscription_id,
//           orderplacedby: orderPlacedBy,
//           paymentterm: paymentTerm,
//           customerpo: customerPO,
//           methodId: paymentMethodId || 5,
//           company_name: organization.organization_name,
//           first_name: primaryUser?.first_name,
//           last_name: primaryUser?.last_name,
//           email: primaryUser?.business_email,
//           phone_number: primaryUser?.phone_number,
//           productId,
//           created_at: new Date(),
//           updated_at: new Date(),
//         });
//       } else {
//          console.log('Updating existing billing info');
//         billing.methodId = paymentMethodId || billing.methodId;
//         billing.orderplacedby = orderPlacedBy;
//         billing.paymentterm = paymentTerm;
//         billing.customerpo = customerPO;
//         billing.methodId = paymentMethodId || billing.methodId;
//         billing.company_name = organization.organization_name;
//         billing.first_name = primaryUser?.first_name;
//         billing.last_name = primaryUser?.last_name;
//         billing.email = primaryUser?.business_email;
//         billing.phone_number = primaryUser?.phone_number;
//         billing.productId = productId;
//         billing.updated_at = new Date();
//       }
//       const savedBilling = await this.billingInfoRepository.save(billing);
//       //
//             if (productId === 1) {
//         const schemaManager = new OrganizationSchemaManager(
//           this.dataSource,
//           this.mailConfigService,
//           this.mailService,
//         );

//         // Call the method

//         await schemaManager.createOrganizationSchemaAndTables(primaryUser);
//       } else {
//         // Run HRMS organization schema logic
//         const hrmsSchemaManager = new HrmsOrganizationSchemaManager(
//           this.dataSource,
//           this.mailConfigService,
//           this.mailService,
//         );

//         await hrmsSchemaManager.createOrganizationSchemaAndTables(primaryUser);
//       }
//       // Mail template
//       // 4️⃣ Send Order Confirmation Email
//         try {
//           const plan = await this.planRepository.findOne({ where: { plan_id: planId } });

//           const fullName =
//             (primaryUser?.first_name && primaryUser?.last_name)
//               ? `${primaryUser.first_name} ${primaryUser.last_name}`
//               : organization.organization_name;

//           console.log("📧 Sending order confirmation email to:", primaryUser?.business_email);

//           await this.mailService.sendEmail(
//             primaryUser?.business_email,
//             'Your Subscription Order Has Been Placed Successfully',
//             await renderEmail(
//               EmailTemplate.ORDER_PLACED,
//               {
//                 name: orderPlacedBy,
//                 email: primaryUser?.business_email,
//                 companyName: organization.organization_name,
//                 planName: plan?.plan_name || "Selected Plan",
//                 billingCycle,
//                 price,
//                 startDate: new Date(startDate).toLocaleDateString(),
//                 endDate: new Date(renewalDate).toLocaleDateString(),
//               },
//               this.mailConfigService, // ✅ use same mail config service
//             ),
//           );

//           console.log("✅ Order confirmation email sent successfully.");
//         } catch (emailError) {
//           console.error("⚠️ Failed to send order confirmation email:", emailError);
//         }

//       console.log('💾 Saved Billing Info:', savedBilling);
//       if (orderDto.featureOverrides && orderDto.featureOverrides.length > 0) {
//         await this.updateOverrides(
//           orderDto.organizationId,        // org_id
//           orderDto.featureOverrides,      // array of overrides
//           context.userId                  // changedBy (optional)
//         );
//       }

//       // Return combined data including user info
//       return {
//         statusCode: 200,
//         message: "Order created/updated successfully",
//         data: {
//           subscription: savedSub,
//           organization: {
//             organizationId: organization.organization_id,
//             companyName: organization.organization_name,
//             organizationSchemaName: organization.organization_schema_name,
//             industryId: organization.industry_type_id,
//             industryName: "", // optional
//             firstName: primaryUser?.first_name,
//             lastName: primaryUser?.last_name,
//             businessEmail: primaryUser?.business_email,
//             phoneNumber: primaryUser?.phone_number,
//           },
//         },
//       };
//     } catch (error) {
//       console.error("Error creating/updating order:", error);
//       throw new HttpException({ statusCode: 500, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
//     }
//   }
async createOrUpdateOrder(orderDto: CreateOrderDto, context: any): Promise<any> {
  const {
    organizationId,
    planId,
    billingCycle,
    startDate,
    endDate,
    price,
    autoRenewal,
    isTrialPeriod,
    paymentMethodId,
    paymentTerm,
    customerPO,
    paymentStatus,
    orderPlacedBy,
    productId,
      trialPeriodUnit,
  trialPeriodCount,
  trialStartDate,
  trialExpiryDate,
  gracePeriod,
  percentage,
  grandTotal,
  } = orderDto;

  if (!organizationId || !planId || !billingCycle || !price || !productId) {
    throw new BadRequestException({ statusCode: 400, message: "Missing required fields." });
  }

  try {
    // 1️⃣ Fetch organization and primary user with organization relation
    const primaryUser = await this.registerUser.findOne({
      where: { organization_id: organizationId, is_primary_user: 'Y' },
      relations: ['organization'],
    });

    if (!primaryUser) throw new BadRequestException({ statusCode: 404, message: "Primary user not found for this organization." });

    const organization = primaryUser.organization;

    // 2️⃣ Create or update subscription
    const today = new Date();
    const renewalDate = endDate ? new Date(endDate) : new Date(today);
    if (!endDate) {
      if (billingCycle === "monthly") renewalDate.setMonth(renewalDate.getMonth() + 1);
      else if (billingCycle === "yearly") renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    let subscription = await this.subscriptionRepository.findOne({
      where: { organization_profile_id: organizationId, productId },
    });
    console.log("subscription subscription:",subscription);
    if (!subscription) {
      const subBillingId = await this.generateBillingId();
      const subOrderId = await this.generateOrderId();

      subscription = this.subscriptionRepository.create({
        organization_profile_id: organizationId,
        productId,
        plan_id: planId,
        plan_billing_id: billingCycle,
        subscription_type_id: 1,
        start_date: new Date(startDate) || today,
        renewal_date: renewalDate,
        price: Number(price),
        auto_renewal: autoRenewal,
        is_trial_period: isTrialPeriod,
        percentage: orderDto.percentage || 0,
        grand_total: Number(grandTotal),
        payment_status: paymentStatus as 'pending' | 'completed' | 'failed',
        sub_billing_id: subBillingId,
        sub_order_id: subOrderId,
        created_by: context.userId,
        purchase_date: today,
        payment_mode: String(paymentMethodId),
        is_activated: true,
          trial_period_unit: trialPeriodUnit || null,
  trial_period_count: trialPeriodCount || null,
  trial_start_date: trialStartDate ? new Date(trialStartDate) : null,
  trial_expiry_date: trialExpiryDate ? new Date(trialExpiryDate) : null,
  grace_period: gracePeriod || 0,
      });
    } else {
      // Update existing subscription
      subscription.plan_billing_id = billingCycle;
      subscription.plan_id = planId;
      subscription.start_date = new Date(startDate) || subscription.start_date;
      subscription.renewal_date = renewalDate;
      subscription.price = Number(price);
      subscription.auto_renewal = autoRenewal;
      subscription.is_trial_period = isTrialPeriod;
      subscription.grand_total = grandTotal;
      subscription.payment_status = paymentStatus as 'pending' | 'completed' | 'failed';
      subscription.purchase_date = today;
      subscription.payment_mode = String(paymentMethodId);
      subscription.is_active = true;
      subscription.is_activated = true;
      subscription.productId = productId;
      subscription.percentage = orderDto.percentage || subscription.percentage || 0; 
      subscription.trial_period_unit = trialPeriodUnit || subscription.trial_period_unit;
subscription.trial_period_count = trialPeriodCount || subscription.trial_period_count;
subscription.trial_start_date = trialStartDate ? new Date(trialStartDate) : subscription.trial_start_date;
subscription.trial_expiry_date = trialExpiryDate ? new Date(trialExpiryDate) : subscription.trial_expiry_date;
subscription.grace_period = gracePeriod ?? subscription.grace_period;

    }

    const savedSub = await this.subscriptionRepository.save(subscription);

    // 3️⃣ Save billing info
    let billing = await this.billingInfoRepository.findOne({ where: { org_subscription_id: savedSub.subscription_id } });

    if (!billing) {
      billing = this.billingInfoRepository.create({
        org_subscription_id: savedSub.subscription_id,
        orderplacedby: orderPlacedBy,
        paymentterm: paymentTerm,
        customerpo: customerPO,
        methodId: paymentMethodId || 5,
        company_name: organization.organization_name,
        first_name: primaryUser.first_name,
        last_name: primaryUser.last_name,
        email: primaryUser.business_email,
        phone_number: primaryUser.phone_number,
        productId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      billing.methodId = paymentMethodId || billing.methodId;
      billing.orderplacedby = orderPlacedBy;
      billing.paymentterm = paymentTerm;
      billing.customerpo = customerPO;
      billing.company_name = organization.organization_name;
      billing.first_name = primaryUser.first_name;
      billing.last_name = primaryUser.last_name;
      billing.email = primaryUser.business_email;
      billing.phone_number = primaryUser.phone_number;
      billing.productId = productId;
      billing.updated_at = new Date();
    }

    const savedBilling = await this.billingInfoRepository.save(billing);

    const productRepo = await this.dataSource.getRepository(Product);
    const product = await productRepo.findOne({ where: { productId } });
    if (!product) throw new BadRequestException({ statusCode: 404, message: "Product not found." });

    const schemaName = `${product.schemaInitial}_org_${organization.organization_schema_name}`;

    // Check if schema already exists
    const schemaExists = await this.dataSource.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    );
    // 4️⃣ Create schema for the product
    if (schemaExists.length === 0) {
    if (productId === 1) {
      const schemaManager = new OrganizationSchemaManager(this.dataSource, this.mailConfigService, this.mailService);
      await schemaManager.createOrganizationSchemaAndTables(primaryUser);
    } else {
      const hrmsSchemaManager = new HrmsOrganizationSchemaManager(this.dataSource, this.mailConfigService, this.mailService);
      await hrmsSchemaManager.createOrganizationSchemaAndTables(primaryUser);
    }
    } else {
    console.log(`Schema "${schemaName}" already exists. Skipping creation.`);
  }

    // 5️⃣ Send order confirmation email
    try {
  const plan = await this.planRepository.findOne({ where: { plan_id: planId } });
  const productName = product?.name || "Selected Product";
  await this.mailService.sendEmail(
    primaryUser.business_email,
    'Your Subscription Order Has Been Placed Successfully',
    await renderEmail(
      EmailTemplate.PO_CONFIRMATION_EMAIL,
      {
        // // 👇 These names and fields stay the same as before
        // customerName: primaryUser.first_name + " " + (primaryUser.last_name || ""),
        // email: primaryUser.business_email,
        // companyName: organization.organization_name, // organization name
        // planName: plan?.plan_name || "Selected Plan",
        // billingCycle,
        // price: `₹${Number(price).toLocaleString('en-IN')}`,
        // paymentStatus: savedSub.payment_status || 'Pending',
        // orderDate: new Date(savedSub.purchase_date).toLocaleDateString('en-IN'),
        // startDate: new Date(savedSub.start_date).toLocaleDateString('en-IN'),
        // renewalDate: new Date(savedSub.renewal_date).toLocaleDateString('en-IN'),

        // // 👇 This doesn’t change your format but adds context safely
        // productName, 
        // orderPlacedBy: orderPlacedBy || primaryUser.first_name,
            name: primaryUser.first_name + " " + (primaryUser.last_name || ""),
            renewalDate: new Date(savedSub.renewal_date).toLocaleDateString('en-IN'),
        softwareName: productName,
        planType: plan?.plan_name || "Selected Plan",
        users: 1 || 1,
        duration: billingCycle === 'monthly' ? '1 Month' : '1 Year',
        amount: `₹${Number(price).toLocaleString('en-IN')}`,
        poNumber: customerPO || 'N/A',
            },
      this.mailConfigService,
    ),
  );
} catch (emailError) {
  console.error("Failed to send order email:", emailError);
}
try {
  const plan = await this.planRepository.findOne({ where: { plan_id: planId } });
  const productName = product?.name || "Selected Product";

  await this.mailService.sendEmail(
    primaryUser.business_email,
    `Offline Payment Instructions – ${productName}`,
    await renderEmail(
      EmailTemplate.OFFLINE_PAYMENT_EMAIL, // ✅ your enum for OfflinePaymentEmail
      {
        name: primaryUser.first_name + " " + (primaryUser.last_name || ""),
        softwareName: productName,
        planType: plan?.plan_name || "Selected Plan",
        users: 1, // or dynamic
        duration: billingCycle === 'monthly' ? '1 Month' : '1 Year',
        amount: `₹${Number(price).toLocaleString('en-IN')}`,
        poNumber: customerPO || 'N/A',
        bankName: "Your Bank Name",
        accountName: "Account Name",
        accountNumber: "XXXXXX1234",
        ifscCode: "IFSC0001",
        // companyName: organization.organization_name,
        // companyLogo: "", // optional
        // mailReply: "support@yourcompany.com",
      },
      this.mailConfigService, // pass your mail config like you do for other emails
    ),
  );

  console.log(`Offline payment email sent to ${primaryUser.business_email}`);
} catch (offlineEmailError) {
  console.error("Failed to send offline payment email:", offlineEmailError);
}

    // 6️⃣ Update feature overrides if any
    if (orderDto.featureOverrides?.length) {
      await this.updateOverrides(orderDto.organizationId, orderDto.featureOverrides, context.userId);
    }

    return {
      statusCode: 200,
      message: "Order created/updated successfully",
      data: {
        subscription: savedSub,
        organization: {
          organizationId: organization.organization_id,
          companyName: organization.organization_name,
          organizationSchemaName: organization.organization_schema_name,
          industryId: organization.industry_type_id,
          firstName: primaryUser.first_name,
          lastName: primaryUser.last_name,
          businessEmail: primaryUser.business_email,
          phoneNumber: primaryUser.phone_number,
        },
      },
    };

  } catch (error) {
    console.error("Error creating/updating order:", error);
    throw new HttpException({ statusCode: 500, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


  private async generateBillingId(): Promise<string> {
    const date = new Date();
    const day = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const lastSub = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.sub_billing_id  LIKE :day', { day: `BILL-${day}-%` })
      .orderBy('sub.sub_billing_id ', 'DESC')
      .getOne();

    let seq = 1;
    if (lastSub) {
      seq = parseInt(String(lastSub.sub_billing_id).split('-')[2]) + 1;
    }

    return `BILL-${day}-${seq.toString().padStart(4, '0')}`;
  }

  private async generateOrderId(): Promise<string> {
    const date = new Date();
    const day = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Fetch the last order for today
    const lastOrder = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.sub_order_id LIKE :day', { day: `ORD-${day}-%` })
      .orderBy('sub.sub_order_id', 'DESC')
      .getOne();

    let seq = 1;
    if (lastOrder) {
      // Extract sequence number from last orderId
      const parts = lastOrder.sub_order_id.split('-'); // ["ORD", "YYYYMMDD", "XXXX"]
      seq = parseInt(parts[2], 10) + 1;
    }

    // Format with leading zeros
    return `ORD-${day}-${seq.toString().padStart(4, '0')}`;
  }

  ////////////////

  private async createOrganizationSchemaAndTables(user: RegisterUserLogin): Promise<void> {
    console.log("user die:", user)
    // Generate a random plain-text password
    const randomPassword = Math.random().toString(36).slice(-8);
    console.log("randomPassword:", randomPassword);
    // Hash the password
    const hashedPassword = await this.hashPassword(randomPassword);

    // Update user entity to mark as verified and update the password
    user.verified = true;
    user.otp = null; // Clear OTP
    user.otp_expiry = null;
    user.password = hashedPassword;

    await this.registerUser.save(user);
    console.log("hashedPassword:", hashedPassword);

    // Create schema for the organization
    const schemaName = `org_${user.organization.organization_schema_name}`;
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    console.log('1');

    // Create tables in the organization profile schema
    const script1 = new OrganizationProfileScript(this.dataSource);
    await script1.createOrganizationProfileTable(schemaName);
    await script1.insertOrganizationProfileTable(schemaName, user);

    // Create table department
    const departmentscript = new DepartmentsScript(this.dataSource);
    await departmentscript.createDepartmentsTable(schemaName);

    // Create table designation
    const designationcript = new DesignationScript(this.dataSource);
    await designationcript.createDesignationTable(schemaName);

    // Create table organization roles tables
    const organizationrolesscript = new OrganizationRolesScript(
      this.dataSource,
    );
    await organizationrolesscript.createOrganizationRolesTable(schemaName);

    // Create tables in the users schema
    const script = new UserScript(this.dataSource);
    await script.createUserTable(schemaName);

    console.log('2');
    // Create table branches
    const branchscript = new BranchesScript(this.dataSource);
    await branchscript.createBranchesTable(schemaName);

   
  console.log('3');

  const departmentData = [
  { department_name: 'Human Resources (HR)' },
  { department_name: 'Finance' },
  { department_name: 'Accounts' },
  { department_name: 'Sales' },
  { department_name: 'Marketing' },
  { department_name: 'Research and Development (R&D)' },
  { department_name: 'Engineering' },
  { department_name: 'Purchase / Procurement' },
  { department_name: 'Operations' },
  { department_name: 'Production' },
  { department_name: 'Quality Control (QC)' },
  { department_name: 'Quality Assurance (QA)' },
  { department_name: 'Packaging and Dispatch' },
  { department_name: 'Store' },
  { department_name: 'Maintenance' },
  { department_name: 'Information Technology (IT)' },
  { department_name: 'Support/ Customer Service' },
  { department_name: 'Administration' }
]


  await departmentscript.insertOrganizationDepartmentTable(
    schemaName,
    departmentData,
  );


  const designations = [
  { parent_department: 'Human Resources (HR)', designation_name: 'Chief HR Officer' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Benefits Coordinator' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Compensation & Benefits Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Diversity & Inclusion Specialist' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Employee Relations Specialist' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Administrator' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Assistant' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Business Partner' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Coordinator' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Director' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Generalist' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Information Systems Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Intern' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'HR Operations Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Payroll Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Payroll Specialist' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Recruiter' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Recruitment Coordinator' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Talent Acquisition Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Training & Development Manager' },
  { parent_department: 'Human Resources (HR)', designation_name: 'Vice President of HR' },

   { parent_department: 'Finance', designation_name: 'Accounting Analyst' },
  { parent_department: 'Finance', designation_name: 'Auditor' },
  { parent_department: 'Finance', designation_name: 'Benefits Manager' },
  { parent_department: 'Finance', designation_name: 'Budget Analyst' },
  { parent_department: 'Finance', designation_name: 'Chief Financial Officer (CFO)' },
  { parent_department: 'Finance', designation_name: 'Commercial Loan Officer' },
  { parent_department: 'Finance', designation_name: 'Controller' },
  { parent_department: 'Finance', designation_name: 'Credit Counselor' },
  { parent_department: 'Finance', designation_name: 'Economist' },
  { parent_department: 'Finance', designation_name: 'Finance Director' },
  { parent_department: 'Finance', designation_name: 'Finance Manager' },
  { parent_department: 'Finance', designation_name: 'Financial Analyst' },
  { parent_department: 'Finance', designation_name: 'Financial Planner' },
  { parent_department: 'Finance', designation_name: 'Financial Services Representative' },

  { parent_department: 'Accounts', designation_name: 'Accountant' },
  { parent_department: 'Accounts', designation_name: 'Accounting Director' },
  { parent_department: 'Accounts', designation_name: 'Accounts Payable/Receivable Clerk' },
  { parent_department: 'Accounts', designation_name: 'Credit Authorizer' },
  { parent_department: 'Accounts', designation_name: 'Payroll Clerk' },

    { parent_department: 'Sales', designation_name: 'Sales Manager' },
  { parent_department: 'Sales', designation_name: 'Regional Sales Director' },
  { parent_department: 'Sales', designation_name: 'Vice President of Sales (VP Sales)' },
  { parent_department: 'Sales', designation_name: 'Chief Sales Officer (CSO)' },
  { parent_department: 'Sales', designation_name: 'Territory Manager' },
  { parent_department: 'Sales', designation_name: 'District Manager' },
  { parent_department: 'Sales', designation_name: 'Inside Sales Representative (ISR)' },
  { parent_department: 'Sales', designation_name: 'Business Development Representative (BDR)' },
  { parent_department: 'Sales', designation_name: 'Account Executive (AE)' },
  { parent_department: 'Sales', designation_name: 'Customer Success Manager (CSM)' },
  { parent_department: 'Sales', designation_name: 'Account Manager (AM)' },
  { parent_department: 'Sales', designation_name: 'Sales Engineer' },
  { parent_department: 'Sales', designation_name: 'Solutions Consultant' },
  { parent_department: 'Sales', designation_name: 'Channel Account Manager (CAM)' },
  { parent_department: 'Sales', designation_name: 'Partnership Manager' },
  { parent_department: 'Sales', designation_name: 'Alliance Manager' },
  { parent_department: 'Sales', designation_name: 'Distributor Account Manager' },
  { parent_department: 'Sales', designation_name: 'Sales Operations Manager' },
  { parent_department: 'Sales', designation_name: 'Customer Support Representative (CSR)' },
  { parent_department: 'Sales', designation_name: 'Sales Analyst' },

  { parent_department: 'Marketing', designation_name: 'Marketing Specialist' },
  { parent_department: 'Marketing', designation_name: 'Marketing Manager' },
  { parent_department: 'Marketing', designation_name: 'Marketing Director' },
  { parent_department: 'Marketing', designation_name: 'Graphic Designer' },
  { parent_department: 'Marketing', designation_name: 'Marketing Research Analyst' },
  { parent_department: 'Marketing', designation_name: 'Marketing Communications Manager' },
  { parent_department: 'Marketing', designation_name: 'Marketing Consultant' },
  { parent_department: 'Marketing', designation_name: 'Product Manager' },
  { parent_department: 'Marketing', designation_name: 'Public Relations' },
  { parent_department: 'Marketing', designation_name: 'Social Media Assistant' },
  { parent_department: 'Marketing', designation_name: 'Brand Manager' },
  { parent_department: 'Marketing', designation_name: 'SEO Manager' },
  { parent_department: 'Marketing', designation_name: 'Content Marketing Manager' },
  { parent_department: 'Marketing', designation_name: 'Copywriter' },
  { parent_department: 'Marketing', designation_name: 'Media Buyer' },
  { parent_department: 'Marketing', designation_name: 'Digital Marketing Manager' },
  { parent_department: 'Marketing', designation_name: 'eCommerce Marketing Specialist' },
  { parent_department: 'Marketing', designation_name: 'Brand Strategist' },
  { parent_department: 'Marketing', designation_name: 'Vice President of Marketing' },

   { parent_department: 'Research and Development (R&D)', designation_name: 'R&D Manager' },
  { parent_department: 'Research and Development (R&D)', designation_name: 'Product Development Scientist' },
  { parent_department: 'Research and Development (R&D)', designation_name: 'Research Analyst' },
  { parent_department: 'Research and Development (R&D)', designation_name: 'Lab Technician' },
  { parent_department: 'Research and Development (R&D)', designation_name: 'Innovation Manager' },

   { parent_department: 'Purchase / Procurement', designation_name: 'Chief Procurement Officer' },
  { parent_department: 'Purchase / Procurement', designation_name: 'Supplier Relationship Manager' },
  { parent_department: 'Purchase / Procurement', designation_name: 'Project Procurement Manager' },
  { parent_department: 'Purchase / Procurement', designation_name: 'Procurement Analyst' },
  { parent_department: 'Purchase / Procurement', designation_name: 'Executive Purchase' },

    { parent_department: 'Operations', designation_name: 'Operations Manager' },
  { parent_department: 'Operations', designation_name: 'Supply Chain Coordinator' },
  { parent_department: 'Operations', designation_name: 'Logistics Manager' },
  { parent_department: 'Operations', designation_name: 'Production Supervisor' },
  { parent_department: 'Operations', designation_name: 'Operations Assistant' },
  { parent_department: 'Operations', designation_name: 'Operations Coordinator' },
  { parent_department: 'Operations', designation_name: 'Operations Analyst' },
  { parent_department: 'Operations', designation_name: 'Operations Director' },
  { parent_department: 'Operations', designation_name: 'Vice President of Operations' },
  { parent_department: 'Operations', designation_name: 'Operations Professional' },
  { parent_department: 'Operations', designation_name: 'Scrum Master' },
  { parent_department: 'Operations', designation_name: 'Continuous Improvement Lead' },
  { parent_department: 'Operations', designation_name: 'Continuous Improvement Consultant' },

    { parent_department: 'Quality Assurance (QA)', designation_name: 'Quality Assurance Manager' },
  { parent_department: 'Quality Assurance (QA)', designation_name: 'Quality Control Inspector' },
  { parent_department: 'Quality Assurance (QA)', designation_name: 'Quality Analyst' },
  { parent_department: 'Quality Assurance (QA)', designation_name: 'Compliance Officer' },
  { parent_department: 'Quality Assurance (QA)', designation_name: 'Quality Assurance Specialist' },

   { parent_department: 'Store', designation_name: 'Store Executive' },
  { parent_department: 'Store', designation_name: 'Store Manager' },
  { parent_department: 'Store', designation_name: 'Inventory Control Specialist' },
  { parent_department: 'Store', designation_name: 'Store Assistant' },
  { parent_department: 'Store', designation_name: 'Warehouse Supervisor' },
  { parent_department: 'Store', designation_name: 'Stock Clerk' },

    { parent_department: 'Maintenance', designation_name: 'Maintenance Technician' },
  { parent_department: 'Maintenance', designation_name: 'Maintenance Engineer' },
  { parent_department: 'Maintenance', designation_name: 'Maintenance Supervisor' },
  { parent_department: 'Maintenance', designation_name: 'Maintenance Manager' },
  { parent_department: 'Maintenance', designation_name: 'Facilities Manager' },
  { parent_department: 'Maintenance', designation_name: 'Electrical Maintenance Engineer' },
  { parent_department: 'Maintenance', designation_name: 'Mechanical Maintenance Engineer' },
  { parent_department: 'Maintenance', designation_name: 'HVAC Technician' },
  { parent_department: 'Maintenance', designation_name: 'Plumbing Technician' },
  { parent_department: 'Maintenance', designation_name: 'Building Maintenance Worker' },

   { parent_department: 'Information Technology (IT)', designation_name: 'IT Manager' },
  { parent_department: 'Information Technology (IT)', designation_name: 'Software Developer' },
  { parent_department: 'Information Technology (IT)', designation_name: 'Network Administrator' },
  { parent_department: 'Information Technology (IT)', designation_name: 'Systems Analyst' },
  { parent_department: 'Information Technology (IT)', designation_name: 'IT Support Specialist' },

    { parent_department: 'Support/ Customer Service', designation_name: 'Customer Service Manager' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Call Center Representative' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Technical Support Specialist' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Customer Success Manager' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Help Desk Technician' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Virtual Assistant' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Customer Service' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Customer Support' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Concierge' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Help Desk' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Account Representative' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Client Service Specialist' },
  { parent_department: 'Support/ Customer Service', designation_name: 'Customer Care Associate' },

   { parent_department: 'Administration', designation_name: 'Administrative Assistant' },
  { parent_department: 'Administration', designation_name: 'Receptionist' },
  { parent_department: 'Administration', designation_name: 'Office Manager' },
  { parent_department: 'Administration', designation_name: 'Auditing Clerk' },
  { parent_department: 'Administration', designation_name: 'Bookkeeper' },
  { parent_department: 'Administration', designation_name: 'Account Executive' },
  { parent_department: 'Administration', designation_name: 'Branch Manager' },
  { parent_department: 'Administration', designation_name: 'Business Manager' },
  { parent_department: 'Administration', designation_name: 'Quality Control Coordinator' },
  { parent_department: 'Administration', designation_name: 'Administrative Manager' },
  { parent_department: 'Administration', designation_name: 'Chief Executive Officer' },
  { parent_department: 'Administration', designation_name: 'Business Analyst' },
  { parent_department: 'Administration', designation_name: 'Risk Manager' },
  { parent_department: 'Administration', designation_name: 'Human Resources' },
  { parent_department: 'Administration', designation_name: 'Office Assistant' },
  { parent_department: 'Administration', designation_name: 'Secretary' },
  { parent_department: 'Administration', designation_name: 'Office Clerk' },
  { parent_department: 'Administration', designation_name: 'File Clerk' },
  { parent_department: 'Administration', designation_name: 'Account Collector' },
  { parent_department: 'Administration', designation_name: 'Administrative Specialist' },
  { parent_department: 'Administration', designation_name: 'Executive Assistant' }
  ];

await designationcript.insertDesignationTable(schemaName, designations);


  console.log('4');

  const rolesData = [
    { role_id: 1, role_name: 'Super Admin' },
    { role_id: 2, role_name: 'Admin' },
    { role_id: 3, role_name: 'Technician' },
    { role_id: 4, role_name: 'User' },
  ];



  await organizationrolesscript.insertOrganizationRolesTable(
    schemaName,
    rolesData,
  );

  console.log('5');
  // Create table organization permission tables
  const organizationpermissionsscript = new OrganizationPermissionScript(
    this.dataSource,
  );
  await organizationpermissionsscript.createOrganizationPermissionTable(
    schemaName,
  );

  const rolesPermissionData = [
    { role_id: 1, permission: SuperAdminDefaultPermission },
    { role_id: 2, permission: adminDefaultPermission },
    { role_id: 3, permission: TechnicianDefaultPermission },
    { role_id: 4, permission: userDefaultPermission },
  ];

  await organizationpermissionsscript.insertOrganizationRolesPermissionTable(
    schemaName,
    rolesPermissionData,
  );

  console.log('6');

  if (user) {
    // Dynamically add the property
    (user as any).role_id = 1;
    (user as any).department_id = 1;
  }

  const inserted = await script.insertUserTable(schemaName, user);

  console.log('8');

  // Create table designation
  const fieldCategoryScript = new assetFieldCategoryScript(this.dataSource);
  await fieldCategoryScript.createAssetFieldCategoryScriptTable(schemaName);

  const fieldCategoryData = [
    { asset_field_category_name: 'General Information' },
    { asset_field_category_name: 'Network & Domain Information' },
    { asset_field_category_name: 'System Specification' },
    { asset_field_category_name: 'Hardware Details' },
    { asset_field_category_name: 'Warranty Details' },
     { asset_field_category_name: 'Maintenance/ AMC Contract' },

  ];

  await fieldCategoryScript.insertFieldCategoryTable(
    schemaName,
    fieldCategoryData,
  );

  const insertedFieldCategories = await this.dataSource.query(
    `SELECT asset_field_category_id, asset_field_category_name 
 FROM ${schemaName}.asset_field_category 
 WHERE asset_field_category_name IN ('General Information',
  'Network & Domain Information',
  'Warranty Details',
   'Hardware Details',
    'System Specification',
    'Maintenance/ AMC Contract')`,
  );

  const categoryMap: Record<string, number> = {};
  insertedFieldCategories.forEach((cat) => {
    categoryMap[cat.asset_field_category_name] = cat.asset_field_category_id;
  });

  console.log('9');

  // Create table Fields
  const fieldScript = new ItemFieldsScript(this.dataSource);
  await fieldScript.createItemFieldsTable(schemaName);

  const fieldData = [
   {
    asset_field_name: 'Form Factor',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Form Factor',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['Tower', '1 U Rack', '2 U Rack','Square' , 'Wide', 'Curve'],

  },
  {
    asset_field_name: 'Processor',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Processor',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'RAM',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'RAM',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'HDD',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'HDD',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['SATA', 'SAS', 'SSD'],
  },
  {
    asset_field_name: 'Graphics',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Graphics',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Operating System',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Operating System',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['Android', 'Tizen', 'WebOS', 'Proprietary']

  },
  {
    asset_field_name: 'Serial No.',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Serial No.',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Monitor',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Monitor',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Manufacture',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Manufacture',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Model Name',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Model Name',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Display Name',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Display Name',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['HD', 'Full HD', 'Touch']

  },
  {
    asset_field_name: 'Screen Size',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Screen Size',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Connetivity Type',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Connetivity Type',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['VGA', 'DVI', 'HDMI', 'DP', 'Thunderbolt', 'USB C']

  },
  {
    asset_field_name: 'Serial No.',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Serial No.',
    asset_field_type: 'text',
  },
 {
    asset_field_name: 'Switch Type',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Serial No.',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['Unmanage', 'Smart Manage', 'Managed', 'L1', 'L2', 'L3', 'SAN']

  },

  { asset_field_name: 'Storage Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Storage Type', asset_field_type: 'text' },
  { asset_field_name: 'Container Type', asset_field_category_id: categoryMap['Hardware Details'], 
    asset_field_label_name: 'Container Type', asset_field_type: 'dropdown' ,asset_field_type_details: ['Single', 'Dual']
},
  { asset_field_name: 'Raid Card', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Raid Card', asset_field_type: 'text' },
  { asset_field_name: 'Power Supply', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Power Supply', asset_field_type: 'text' },
  { asset_field_name: 'SAS / HBA Card', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'SAS / HBA Card', asset_field_type: 'text' },
  { asset_field_name: 'Printer Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Printer Type', asset_field_type: 'dropdown' ,
    asset_field_type_details: [
  'Deskjet', 
  'Ink Tank', 
  'Laser', 
  'Plotter', 
  'Mono', 
  'MFP', 
  'Black & White', 
  'Color'
]
},
  { asset_field_name: 'Scanner Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Scanner Type', asset_field_type: 'dropdown',
    asset_field_type_details: ['Flat Bed', 'Feeder', 'Handheld']
 },
  { asset_field_name: 'Print Mode', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Print Mode', asset_field_type: 'dropdown',
    asset_field_type_details: ['One Side Print' , 'Duplex Print']
 },
  { asset_field_name: 'Scan Mode', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Scan Mode', asset_field_type: 'dropdown' },
  { asset_field_name: 'Paper Size Support', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Paper Size Support', asset_field_type: 'dropdown' ,
    asset_field_type_details: ['A4', 'Legal', 'A3', 'A1']
},
  { asset_field_name: 'Display OutPut', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Display OutPut', asset_field_type: 'dropdown',
    asset_field_type_details: ['VGA', 'DVI', 'HDMI', 'DP']

   },
  { asset_field_name: 'Interface Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Interface Type', asset_field_type: 'text' },
  { asset_field_name: 'Interface Support', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Interface Support', asset_field_type: 'text' },
  { asset_field_name: 'Port Type & Speed', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Port Type & Speed', asset_field_type: 'text' },
  { asset_field_name: 'No. of Ports', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'No. of Ports', asset_field_type: 'text' },
  { asset_field_name: 'No. Of Ports', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'No. Of Ports', asset_field_type: 'text' },
  { asset_field_name: 'No. Port', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'No. Port', asset_field_type: 'text' },
  { asset_field_name: 'No. of Plug outlet', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'No. of Plug outlet', asset_field_type: 'text' },
  { asset_field_name: 'No. of Video Input Ports', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'No. of Video Input Ports', asset_field_type: 'text' },
  { asset_field_name: 'Rack orientation', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Rack orientation',
     asset_field_type: 'dropdown',
asset_field_type_details: ['Verticle', 'Horizontal']

   },
  { asset_field_name: 'Rack Name / No.', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Rack Name / No.', asset_field_type: 'text' },
  { asset_field_name: 'Size Of Rack', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Size Of Rack', asset_field_type: 'text' },
  { asset_field_name: 'Inpute Plug type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Inpute Plug type', asset_field_type: 'text' },
  { asset_field_name: 'Serge Protction', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Serge Protction', asset_field_type: 'dropdown',
    asset_field_type_details: ['Yes', 'No']
 },
  { asset_field_name: 'POE Support', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'POE Support', asset_field_type: 'text' },
  { asset_field_name: 'Uplink Support', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Uplink Support', asset_field_type: 'dropdown',
    asset_field_type_details: ['RJ 45', 'FC', 'Hybrid']
 },
  { asset_field_name: 'Deplyoment Roll', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Deplyoment Roll', asset_field_type: 'text' },
  { asset_field_name: 'Deployement Mode', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Deployement Mode', asset_field_type: 'text' },
  { asset_field_name: 'Antena', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Antena', asset_field_type: 'text' },
  { asset_field_name: 'Wireless Band', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Wireless Band', asset_field_type: 'text' },
  { asset_field_name: 'Troughput', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Troughput', asset_field_type: 'text' },
  { asset_field_name: 'Orientation Support', asset_field_category_id: categoryMap['Hardware Details'], 
    asset_field_label_name: 'Orientation Support', asset_field_type: 'dropdown',
  asset_field_type_details: ['Landscape', 'Portrait', 'Auto-rotate']
 },
  { asset_field_name: 'Zoom type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Zoom type', asset_field_type: 'text' },
  { asset_field_name: 'Brightness', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Brightness', asset_field_type: 'text' },
  { asset_field_name: 'Resolution', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Resolution', asset_field_type: 'dropdown',
    asset_field_type_details: ['HD', 'Full HD', '4K UHD', '8K UHD']
 },
  { asset_field_name: 'Lens Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Lens Type', asset_field_type: 'dropdown' ,
    asset_field_type_details: ['Fixed', 'Varifocal', 'Motorized Zoom']
},
  { asset_field_name: 'Camera Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Camera Type', asset_field_type: 'text' },
  { asset_field_name: 'Device Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Device Type', asset_field_type: 'dropdown',
    asset_field_type_details: ['DVR', 'NVR', 'Hybrid NVR']
 },
  { asset_field_name: 'Speaker Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Speaker Type',
     asset_field_type: 'dropdown', asset_field_type_details: ['Mono', 'Stereo', '2.1', '5.1', 'Soundbar', 'Smart Speaker']
 },
  { asset_field_name: 'Output RMS', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Output RMS', asset_field_type: 'text' },
  { asset_field_name: 'Mount Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Mount Type', asset_field_type: 'dropdown' ,
    asset_field_type_details: ['Desktop', 'Wall-mounted', 'Ceiling', 'Portable']
},
  { asset_field_name: 'Integration Platform Support', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Integration Platform Support', asset_field_type: 'dropdown' ,
    asset_field_type_details: ['Zoom Rooms', 'Microsoft Teams', 'Google Meet']
},
  { asset_field_name: 'Media Player', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Media Player', asset_field_type: 'text' },
  { asset_field_name: 'Storage Capacity', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Storage Capacity', asset_field_type: 'text' },
  { asset_field_name: 'Charging Method', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Charging Method', asset_field_type: 'dropdown' ,
    asset_field_type_details: ['Cable', 'Dock', 'Wireless']
},
  { asset_field_name: 'Keypad Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'Keypad Type', asset_field_type: 'dropdown',
    asset_field_type_details: ['Physical', 'Touchscreen', 'Hybrid']
 },
  { asset_field_name: 'SIM Type', asset_field_category_id: categoryMap['Hardware Details'],
     asset_field_label_name: 'SIM Type', asset_field_type: 'dropdown',
    asset_field_type_details: ['Physical SIM', 'eSIM', 'Dual SIM']
 },
 {
    asset_field_name: 'Projector Type',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Projector Type',
    asset_field_type: 'dropdown',
    asset_field_type_details: ['DLP', 'LCD', 'LED', '3D']

  },

  { asset_field_name: 'IMEI No', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'IMEI No', asset_field_type: 'text' },
  { asset_field_name: 'Carrier Name', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Carrier Name', asset_field_type: 'text' },
  { asset_field_name: 'Mobile No.', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Mobile No.', asset_field_type: 'text' },
  { asset_field_name: 'Plan Details', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Plan Details', asset_field_type: 'text' },
  { asset_field_name: 'Region / Zone', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Region / Zone', asset_field_type: 'text' },
  { asset_field_name: 'Environment', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Environment', asset_field_type: 'text' },
  { asset_field_name: 'Owner / Team', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Owner / Team', asset_field_type: 'text' },
  { asset_field_name: 'Status', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Status', asset_field_type: 'text' },
  { asset_field_name: 'Application Linkage', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Application Linkage', asset_field_type: 'text' },
  { asset_field_name: 'Resource Owner', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Resource Owner', asset_field_type: 'text' },
  { asset_field_name: 'Public IP', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Public IP', asset_field_type: 'text' },
  { asset_field_name: 'ROM', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'ROM', asset_field_type: 'text' },
  { asset_field_name: 'Digital Pen', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Digital Pen', asset_field_type: 'text' },
  { asset_field_name: 'Display Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Display Type', asset_field_type: 'text' },
  { asset_field_name: 'Connetivity', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Connetivity', asset_field_type: 'text' },
  { asset_field_name: 'Connetivity Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Connetivity Type', asset_field_type: 'text' },
  { asset_field_name: 'Domain Name', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Domain Name', asset_field_type: 'text' },
  { asset_field_name: 'IP Details', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'IP Details', asset_field_type: 'text' },
  { asset_field_name: 'Warrany Date', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Warrany Date', asset_field_type: 'date' },
  { asset_field_name: 'Warrany Year', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Warrany Year', asset_field_type: 'number' },
  { asset_field_name: 'Support Type', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Support Type', asset_field_type: 'text' },
  { asset_field_name: 'Mac Address', asset_field_category_id: categoryMap['Hardware Details'], asset_field_label_name: 'Mac Address', asset_field_type: 'text' },
 {
    asset_field_name: 'Host Name',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Host Name',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Domain Name',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Domain Name',
    asset_field_type: 'text',
  },
   {
    asset_field_name: 'Threat Protection Module',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Threat Protection Module',
    asset_field_type: 'text',
  },
{
    asset_field_name: 'Port Type',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Port Type',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Speed',
    asset_field_category_id: categoryMap['Hardware Details'],
    asset_field_label_name: 'Speed',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'IP Details',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'IP Details',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Public IP',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Public IP',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Plan Details',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Plan Details',
    asset_field_type: 'text',
  },
  {
    asset_field_name: 'Warrany Date',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Warrany Date',
    asset_field_type: 'date',
  },
  {
    asset_field_name: 'Warrany Year',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Warrany Year',
    asset_field_type: 'number',
  },
  {
    asset_field_name: 'Support Type',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'Support Type',
    asset_field_type: 'text',
  },
{
    asset_field_name: 'LFD Type',
    asset_field_category_id: categoryMap['Network & Domain Information'],
    asset_field_label_name: 'LFD Type',
    asset_field_type: 'dropdown',
      asset_field_type_details: ['IPS', 'VA', 'OLED', 'QLED']

  },



    { asset_field_name: 'Maintenance frequency', asset_field_category_id: categoryMap['Maintenance/ AMC Contract'], asset_field_label_name: 'Maintenance frequency', asset_field_type: 'text' },
  { asset_field_name: 'Maintenance Vendor', asset_field_category_id: categoryMap['Maintenance/ AMC Contract'], asset_field_label_name: 'Maintenance Vendor', asset_field_type: 'text' },

    { asset_field_name: "IP Address", asset_field_category_id: categoryMap["Network & Domain Information"], asset_field_label_name: "IP Address", asset_field_type: "text" },
  { asset_field_name: "Connectivity Type", asset_field_category_id: categoryMap["Network & Domain Information"], asset_field_label_name: "Connectivity Type", asset_field_type: "text",
    asset_field_type_details: ['Bluetooth', 'Wi-Fi', 'RS-232', 'telephone line', 'LAN', 'Wi-Fi'

]

   },
  { asset_field_name: "Communication Protocol", asset_field_category_id: categoryMap["Network & Domain Information"], 
    asset_field_label_name: "Communication Protocol", asset_field_type: "dropdown",
  asset_field_type_details: ['SIP', 'VoIP', 'PRI']
 },
  { asset_field_name: "Fax Protocol", asset_field_category_id: categoryMap["Network & Domain Information"], asset_field_label_name: "Fax Protocol", asset_field_type: "text" }

  ];

  await fieldScript.insertAssetFieldsTable(schemaName, fieldData);

  console.log('10');

  // Create table designation
  const itemfieldMappingScript = new ItemFieldsMappingScript(this.dataSource);
  await itemfieldMappingScript.createItemFieldsMappingTable(schemaName);

  console.log('11');

  // Create table designation

  /// STEP 1: Create Main Category Table
  const assetCategoryScript = new CategoryScript(this.dataSource);
  await assetCategoryScript.createCategoryTable(schemaName);

  // STEP 1.1: Insert Main Categories (only name, using helper method)
  const assetMainCategoryData = [
    { main_category_name: 'IT' },
    { main_category_name: 'Non IT' },
  ];
  await assetCategoryScript.insertAssetMainCategoryTable(
    schemaName,
    assetMainCategoryData,
  );
  
  

  // Fetch inserted categories to get their generated IDs
  const insertedMainCategories = await this.dataSource.query(
    `SELECT main_category_id, main_category_name FROM ${schemaName}.asset_main_category WHERE main_category_name IN ('IT', 'Non IT')`,
  );

  const mainCatMap: Record<string, number> = {};
  insertedMainCategories.forEach((cat) => {
    mainCatMap[cat.main_category_name] = cat.main_category_id;
  });

  if (!mainCatMap['IT'] || !mainCatMap['Non IT']) {
    throw new Error('Main category IDs not found.');
  }

  console.log('12');

  // STEP 2: Create and Insert Subcategories
  const assetSubCategoryScript = new SubCategoryScript(this.dataSource);
  await assetSubCategoryScript.createSubCategoryTable(schemaName);

  const assetSubCategoryData = [
    { main_category_id: mainCatMap['IT'], sub_category_name: 'Hardware' },
    { main_category_id: mainCatMap['IT'], sub_category_name: 'Software' },
    { main_category_id: mainCatMap['IT'], sub_category_name: 'Data' },
  { main_category_id: mainCatMap['IT'], sub_category_name: 'Network Field' },
  { main_category_id: mainCatMap['IT'], sub_category_name: 'Mobile Devices' },
  { main_category_id: mainCatMap['IT'], sub_category_name: 'Audio & Video' },
  { main_category_id: mainCatMap['IT'], sub_category_name: 'CCTV & Biometrics' },
  { main_category_id: mainCatMap['IT'], sub_category_name: 'Cloud Asset' },
    {
      main_category_id: mainCatMap['IT'],
      sub_category_name: 'Consumable Inventory',
    },
    {
      main_category_id: mainCatMap['Non IT'],
      sub_category_name: 'Electrical Equipments',
    },
    {
      main_category_id: mainCatMap['Non IT'],
      sub_category_name: 'Scientific Equipments',
    },
    {
      main_category_id: mainCatMap['Non IT'],
      sub_category_name: 'Office Equipmemts',
    },
    {
      main_category_id: mainCatMap['Non IT'],
      sub_category_name: 'Furniture',
    },
  ];


  await assetSubCategoryScript.insertAssetSubCategoryTable(
    schemaName,
    assetSubCategoryData,
  );

  console.log('13');

    // Fetch inserted subcategories to build mapping
   const insertedSubCategories = await this.dataSource.query(
    `SELECT sub_category_id, sub_category_name, main_category_id FROM ${schemaName}.asset_sub_category`,
  );

  const subCatMap: Record<string, Record<string, number>> = {};
  insertedSubCategories.forEach((sub) => {
    const mainName = Object.keys(mainCatMap).find(
      (key) => mainCatMap[key] === sub.main_category_id,
    );
    if (mainName) {
      if (!subCatMap[mainName]) subCatMap[mainName] = {};
      subCatMap[mainName][sub.sub_category_name] = sub.sub_category_id;
    }
  });

  // STEP 3: Create and Insert Items
  const assetItemScript = new ItemsScript(this.dataSource);
  await assetItemScript.createItemsTable(schemaName);

  const assetItemRawData = [
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Desktop',
      is_licensable: true,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Fixed Workstation',
      is_licensable: true,
      item_type: 'Physical',
    },
     {
      main: 'IT',
      sub: 'Hardware',
      name: 'All in One Desktop',
      is_licensable: true,
      item_type: 'Physical',
    },
     {
      main: 'IT',
      sub: 'Hardware',
      name: 'Laptop',
      is_licensable: false,
      item_type: 'Physical',
    },
     {
      main: 'IT',
      sub: 'Hardware',
      name: 'Mobile Workstation',
      is_licensable: false,
      item_type: 'Physical',
    },
     {
      main: 'IT',
      sub: 'Hardware',
      name: 'Server',
      is_licensable: false,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Storage',
      is_licensable: false,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Monitor',
      is_licensable: false,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Printer',
      is_licensable: false,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Scanners',
      is_licensable: false,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'Docking Station',
      is_licensable: false,
      item_type: 'Physical',
    },
    {
      main: 'IT',
      sub: 'Hardware',
      name: 'External Hard Drive',
      is_licensable: false,
      item_type: 'Physical',
    },
  { main: 'IT', sub: 'Network Field', name: 'Switch', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Network Field', name: 'KVM Switch', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Network Field', name: 'Router', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Network Field', name: 'Firewall', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Network Field', name: 'Wireless AP', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Network Field', name: 'Network Rack', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Network Field', name: 'Power Distribution Unit', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Mobile Devices', name: 'Smart Phone', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Mobile Devices', name: 'Tablet', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Mobile Devices', name: 'Hand held Scanner', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Audio & Video', name: 'LFD /TV', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Audio & Video', name: 'Projector', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Audio & Video', name: 'Video Conference Camera', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Audio & Video', name: 'Speaker', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'CCTV & Biometrics', name: 'CCTV Camera', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'CCTV & Biometrics', name: 'Video Recorder', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'CCTV & Biometrics', name: 'Time and Attendence', is_licensable: false, item_type: 'Physical' },
  { main: 'IT', sub: 'Cloud Asset', name: 'Cloud Instance', is_licensable: false, item_type: 'Physical' },

// nOn IT
   { main: "Non IT", sub: "Office Equipmemts", name: "Fire Alarm Systems", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Foot Sprayer", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Weighting Machine", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Access Control Systems", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Desktop Calculator", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "EPABX", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Fax machine", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Fire Extinguisher", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Photo Copiers", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Office Equipmemts", name: "Telephone Systems", is_licensable: false, item_type: "Physical" },

  
   { main: "Non IT", sub: "Electrical Equipments", name: "Air Conditioner", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Celling Fan", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Pedestal Fan", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Desert Coolers", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Refrigerators", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Microwaves", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Electric Motors", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Generators", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Invertors", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "UPS", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Shredding machine", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Electrical Equipments", name: "Voltage Stabilizer", is_licensable: false, item_type: "Physical" },

   { main: "Non IT", sub: "Furniture", name: "Book Cases", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Computer Desk", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Chairs", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Table", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "White Board", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Cupboards", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Lockers", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Letter Box", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "News Paper Stand", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Side Racks", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Sofas", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Stools", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Furniture", name: "Storages Box", is_licensable: false, item_type: "Physical" },


   { main: "Non IT", sub: "Scientific Equipments", name: "Microscope", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Scientific Equipments", name: "Gauges", is_licensable: false, item_type: "Physical" },
  { main: "Non IT", sub: "Scientific Equipments", name: "Magnetic Shimer", is_licensable: false, item_type: "Physical" }


  ];

  const assetItemData = assetItemRawData.map((item) => {
    const mainId = mainCatMap[item.main];
    const subId = subCatMap[item.main]?.[item.sub];
    if (!mainId || !subId) {
      throw new Error(`Missing ID mapping for item: ${item.name}`);
    }
    return {
      main_category_id: mainId,
      sub_category_id: subId,
      asset_item_name: item.name,
      is_licensable: item.is_licensable,
      item_type: item.item_type,
    };
  });

  await assetItemScript.insertAssetItemTable(schemaName, assetItemData);

  console.log('14');

  //// VK inserting item - field relations

  const mappings = [
      { itemName: 'Desktop', fieldName: 'Form Factor' },
  { itemName: 'Desktop', fieldName: 'Processor' },
  { itemName: 'Desktop', fieldName: 'RAM' },
  { itemName: 'Desktop', fieldName: 'HDD' },
  { itemName: 'Desktop', fieldName: 'Graphics' },
  { itemName: 'Desktop', fieldName: 'Operating System' },
  { itemName: 'Desktop', fieldName: 'Serial No.' },
  { itemName: 'Desktop', fieldName: 'Monitor' },
  { itemName: 'Desktop', fieldName: 'Manufacture' },
  { itemName: 'Desktop', fieldName: 'Model Name' },
  { itemName: 'Desktop', fieldName: 'Display Name' },
  { itemName: 'Desktop', fieldName: 'Screen Size' },
  { itemName: 'Desktop', fieldName: 'Connectivity Type' },
  { itemName: 'Desktop', fieldName: 'Serial No.' },
  { itemName: 'Desktop', fieldName: 'Host Name' },
  { itemName: 'Desktop', fieldName: 'Domain Name' },
  { itemName: 'Desktop', fieldName: 'IP Details' },
    
    { itemName: 'Fixed Workstation', fieldName: 'Form Factor' },
  { itemName: 'Fixed Workstation', fieldName: 'Processor' },
  { itemName: 'Fixed Workstation', fieldName: 'RAM' },
  { itemName: 'Fixed Workstation', fieldName: 'HDD' },
  { itemName: 'Fixed Workstation', fieldName: 'Graphics' },
  { itemName: 'Fixed Workstation', fieldName: 'Operating System' },
  { itemName: 'Fixed Workstation', fieldName: 'Serial No.' },
  { itemName: 'Fixed Workstation', fieldName: 'Monitor' },
  { itemName: 'Fixed Workstation', fieldName: 'Manufacture' },
  { itemName: 'Fixed Workstation', fieldName: 'Model Name' },
  { itemName: 'Fixed Workstation', fieldName: 'Display Name' },
  { itemName: 'Fixed Workstation', fieldName: 'Screen Size' },
  { itemName: 'Fixed Workstation', fieldName: 'Connectivity Type' },
  { itemName: 'Fixed Workstation', fieldName: 'Serial No.' },
  { itemName: 'Fixed Workstation', fieldName: 'Host Name' },
  { itemName: 'Fixed Workstation', fieldName: 'Domain Name' },
  { itemName: 'Fixed Workstation', fieldName: 'IP Details' },

   { itemName: 'All in One Desktop', fieldName: 'Processor' },
  { itemName: 'All in One Desktop', fieldName: 'RAM' },
  { itemName: 'All in One Desktop', fieldName: 'HDD' },
  { itemName: 'All in One Desktop', fieldName: 'Graphics' },
  { itemName: 'All in One Desktop', fieldName: 'Display Type' },
  { itemName: 'All in One Desktop', fieldName: 'Screen Size' },
  { itemName: 'All in One Desktop', fieldName: 'Operating System' },
  { itemName: 'All in One Desktop', fieldName: 'Serial No.' },
  { itemName: 'All in One Desktop', fieldName: 'Host Name' },
  { itemName: 'All in One Desktop', fieldName: 'Domain Name' },
  { itemName: 'All in One Desktop', fieldName: 'IP Details' },

  { itemName: 'Laptop', fieldName: 'Screen Size' },
  { itemName: 'Laptop', fieldName: 'Processor' },
  { itemName: 'Laptop', fieldName: 'RAM' },
  { itemName: 'Laptop', fieldName: 'HDD' },
  { itemName: 'Laptop', fieldName: 'Graphics' },
  { itemName: 'Laptop', fieldName: 'Display Type' },
  { itemName: 'Laptop', fieldName: 'Operating System' },
  { itemName: 'Laptop', fieldName: 'Serial No.' },
  { itemName: 'Laptop', fieldName: 'Digital Pen' },
  { itemName: 'Laptop', fieldName: 'Manufacture' },
  { itemName: 'Laptop', fieldName: 'Model Name' },
  { itemName: 'Laptop', fieldName: 'Display Name' },
  { itemName: 'Laptop', fieldName: 'Serial No.' },
  { itemName: 'Laptop', fieldName: 'Host Name' },
  { itemName: 'Laptop', fieldName: 'Domain Name' },
  { itemName: 'Laptop', fieldName: 'IP Details' },

   { itemName: 'Mobile Workstation', fieldName: 'Screen Size' },
  { itemName: 'Mobile Workstation', fieldName: 'Processor' },
  { itemName: 'Mobile Workstation', fieldName: 'RAM' },
  { itemName: 'Mobile Workstation', fieldName: 'HDD' },
  { itemName: 'Mobile Workstation', fieldName: 'Graphics' },
  { itemName: 'Mobile Workstation', fieldName: 'Display Type' },
  { itemName: 'Mobile Workstation', fieldName: 'Operating System' },
  { itemName: 'Mobile Workstation', fieldName: 'Serial No.' },
  { itemName: 'Mobile Workstation', fieldName: 'Digital Pen' },
  { itemName: 'Mobile Workstation', fieldName: 'Manufacture' },
  { itemName: 'Mobile Workstation', fieldName: 'Model Name' },
  { itemName: 'Mobile Workstation', fieldName: 'Display Name' },
  { itemName: 'Mobile Workstation', fieldName: 'Serial No.' },
  { itemName: 'Mobile Workstation', fieldName: 'Host Name' },
  { itemName: 'Mobile Workstation', fieldName: 'Domain Name' },
  { itemName: 'Mobile Workstation', fieldName: 'IP Details' },


  { itemName: 'Server', fieldName: 'Form Factor' },
  { itemName: 'Server', fieldName: 'Processor' },
  { itemName: 'Server', fieldName: 'RAM' },
  { itemName: 'Server', fieldName: 'HDD' },
  { itemName: 'Server', fieldName: 'Graphics' },
  { itemName: 'Server', fieldName: 'Raid Card' },
  { itemName: 'Server', fieldName: 'Power Supply' },
  { itemName: 'Server', fieldName: 'Operating System' },
  { itemName: 'Server', fieldName: 'Serial No.' },
  { itemName: 'Server', fieldName: 'Host Name' },
  { itemName: 'Server', fieldName: 'Domain Name' },
  { itemName: 'Server', fieldName: 'IP Details' },

   { itemName: 'Storage', fieldName: 'Form Factor' },
  { itemName: 'Storage', fieldName: 'Processor' },
  { itemName: 'Storage', fieldName: 'RAM' },
  { itemName: 'Storage', fieldName: 'HDD' },
  { itemName: 'Storage', fieldName: 'Graphics' },
  { itemName: 'Storage', fieldName: 'Raid Card' },
  { itemName: 'Storage', fieldName: 'Power Supply' },
  { itemName: 'Storage', fieldName: 'Operating System' },
  { itemName: 'Storage', fieldName: 'Serial No.' },
  { itemName: 'Storage', fieldName: 'Host Name' },
  { itemName: 'Storage', fieldName: 'Domain Name' },
  { itemName: 'Storage', fieldName: 'IP Details' },

   { itemName: 'Monitor', fieldName: 'Form Factor' },
  { itemName: 'Monitor', fieldName: 'Screen Size' },
  { itemName: 'Monitor', fieldName: 'Display Type' },
  { itemName: 'Monitor', fieldName: 'Connetivity Type' },
  { itemName: 'Monitor', fieldName: 'Serial No.' },

   { itemName: 'Printer', fieldName: 'Support Type' },
  { itemName: 'Printer', fieldName: 'Printer Type' },
  { itemName: 'Printer', fieldName: 'RAM' },
  { itemName: 'Printer', fieldName: 'Connetivity' },
  { itemName: 'Printer', fieldName: 'Print Mode' },
  { itemName: 'Printer', fieldName: 'Paper Size Support' },
  { itemName: 'Printer', fieldName: 'Serial No.' },
  { itemName: 'Printer', fieldName: 'Host Name' },
  { itemName: 'Printer', fieldName: 'Domain Name' },
  { itemName: 'Printer', fieldName: 'IP Details' },

   { itemName: 'Scanner', fieldName: 'Support Type' },
  { itemName: 'Scanner', fieldName: 'Printer Type' },
  { itemName: 'Scanner', fieldName: 'RAM' },
  { itemName: 'Scanner', fieldName: 'Connetivity' },
  { itemName: 'Scanner', fieldName: 'Print Mode' },
  { itemName: 'Scanner', fieldName: 'Paper Size Support' },
  { itemName: 'Scanner', fieldName: 'Serial No.' },
  { itemName: 'Scanner', fieldName: 'Host Name' },
  { itemName: 'Scanner', fieldName: 'Domain Name' },
  { itemName: 'Scanner', fieldName: 'IP Details' },

   { itemName: 'Docking Station', fieldName: 'Support Type' },
  { itemName: 'Docking Station', fieldName: 'Connetivity Type' },
  { itemName: 'Docking Station', fieldName: 'Display OutPut' },
  { itemName: 'Docking Station', fieldName: 'Serial No.' },

   { itemName: 'External Hard Drive', fieldName: 'Support Type' },
  { itemName: 'External Hard Drive', fieldName: 'Connetivity Type' },
  { itemName: 'External Hard Drive', fieldName: 'Display OutPut' },
  { itemName: 'External Hard Drive', fieldName: 'Serial No.' },

   { itemName: 'Switch', fieldName: 'Switch Type' },
  { itemName: 'Switch', fieldName: 'Form Factor' },
  { itemName: 'Switch', fieldName: 'No. of Ports' },
  { itemName: 'Switch', fieldName: 'Port Type & Speed' },
  { itemName: 'Switch', fieldName: 'POE Support' },
  { itemName: 'Switch', fieldName: 'Uplink Support' },
  { itemName: 'Switch', fieldName: 'Operating System' },
  { itemName: 'Switch', fieldName: 'Serial No.' },
  { itemName: 'Switch', fieldName: 'Host Name' },
  { itemName: 'Switch', fieldName: 'Domain Name' },
  { itemName: 'Switch', fieldName: 'IP Details' },
  { itemName: 'Switch', fieldName: 'Warrany Date' },
  { itemName: 'Switch', fieldName: 'Warrany Year' },
  { itemName: 'Switch', fieldName: 'Support Type' },

    { itemName: 'KVM Switch', fieldName: 'Switch Type' },
  { itemName: 'KVM Switch', fieldName: 'Form Factor' },
  { itemName: 'KVM Switch', fieldName: 'No. of Ports' },
  { itemName: 'KVM Switch', fieldName: 'Interface Support' },
  { itemName: 'KVM Switch', fieldName: 'Serial No.' },
  { itemName: 'KVM Switch', fieldName: 'Host Name' },
  { itemName: 'KVM Switch', fieldName: 'Domain Name' },
  { itemName: 'KVM Switch', fieldName: 'IP Details' },
  { itemName: 'KVM Switch', fieldName: 'Warrany Date' },
  { itemName: 'KVM Switch', fieldName: 'Warrany ( In Year)' },
  { itemName: 'KVM Switch', fieldName: 'Support Type' },


   { itemName: 'Router', fieldName: 'Router Type' },
  { itemName: 'Router', fieldName: 'Form Factor' },
  { itemName: 'Router', fieldName: 'RAM' },
  { itemName: 'Router', fieldName: 'ROM' },
  { itemName: 'Router', fieldName: 'Interface Type' },
  { itemName: 'Router', fieldName: 'No. Of Ports' },
  { itemName: 'Router', fieldName: 'Operating System' },
  { itemName: 'Router', fieldName: 'Serial No.' },
  { itemName: 'Router', fieldName: 'Host Name' },
  { itemName: 'Router', fieldName: 'Domain Name' },
  { itemName: 'Router', fieldName: 'IP Details' },
  { itemName: 'Router', fieldName: 'Warrany Date' },
  { itemName: 'Router', fieldName: 'Warrany ( In Year)' },
  { itemName: 'Router', fieldName: 'Support Type' },

  { itemName: 'Firewall', fieldName: 'Firewall Type' },
  { itemName: 'Firewall', fieldName: 'Form Factor' },
  { itemName: 'Firewall', fieldName: 'RAM' },
  { itemName: 'Firewall', fieldName: 'HDD' },
  { itemName: 'Firewall', fieldName: 'No. of Port' },
  { itemName: 'Firewall', fieldName: 'Deployment Roll' },
  { itemName: 'Firewall', fieldName: 'Threat Protection Module' },
  { itemName: 'Firewall', fieldName: 'Operating System' },
  { itemName: 'Firewall', fieldName: 'Serial No.' },
  { itemName: 'Firewall', fieldName: 'Host Name' },
  { itemName: 'Firewall', fieldName: 'Domain Name' },
  { itemName: 'Firewall', fieldName: 'IP Details' },
  { itemName: 'Firewall', fieldName: 'Warrany Date' },
  { itemName: 'Firewall', fieldName: 'Warrany ( In Year)' },
  { itemName: 'Firewall', fieldName: 'Support Type' },



  { itemName: 'Wireless AP', fieldName: 'Access Point Type' },
  { itemName: 'Wireless AP', fieldName: 'Throughput' },
  { itemName: 'Wireless AP', fieldName: 'Wireless Band' },
  { itemName: 'Wireless AP', fieldName: 'Antenna' },
  { itemName: 'Wireless AP', fieldName: 'No. Port' },
  { itemName: 'Wireless AP', fieldName: 'Deployment Mode' },
  { itemName: 'Wireless AP', fieldName: 'Host Name' },
  { itemName: 'Wireless AP', fieldName: 'Domain Name' },
  { itemName: 'Wireless AP', fieldName: 'IP Details' },
  { itemName: 'Wireless AP', fieldName: 'Warrany Date' },
  { itemName: 'Wireless AP', fieldName: 'Warrany ( In Year)' },

  { itemName: 'Network Rack', fieldName: 'Form Factor' },
  { itemName: 'Network Rack', fieldName: 'Size Of Rack' },
  { itemName: 'Network Rack', fieldName: 'Rack Name / No.' },

  { itemName: 'Power Distribution Unit', fieldName: 'Form Factor' },
  { itemName: 'Power Distribution Unit', fieldName: 'Rack orientation' },
  { itemName: 'Power Distribution Unit', fieldName: 'Input Plug type' },
  { itemName: 'Power Distribution Unit', fieldName: 'No. of Plug outlet' },
  { itemName: 'Power Distribution Unit', fieldName: 'Surge Protection' },
  { itemName: 'Power Distribution Unit', fieldName: 'Serial No.' },
  { itemName: 'Power Distribution Unit', fieldName: 'Host Name' },
  { itemName: 'Power Distribution Unit', fieldName: 'Mac Address' },
  { itemName: 'Power Distribution Unit', fieldName: 'IP Details' },
  { itemName: 'Power Distribution Unit', fieldName: 'Warranty Date' },
  { itemName: 'Power Distribution Unit', fieldName: 'Warranty (In Year)' },

  { itemName: 'Smart Phone', fieldName: 'Processor' },
  { itemName: 'Smart Phone', fieldName: 'RAM' },
  { itemName: 'Smart Phone', fieldName: 'Storage Capacity' },
  { itemName: 'Smart Phone', fieldName: 'SIM Type' },
  { itemName: 'Smart Phone', fieldName: 'IMEI No' },
  { itemName: 'Smart Phone', fieldName: 'Display Size' },
  { itemName: 'Smart Phone', fieldName: 'Operating System' },
  { itemName: 'Smart Phone', fieldName: 'Serial No.' },
  { itemName: 'Smart Phone', fieldName: 'Carrier Name' },
  { itemName: 'Smart Phone', fieldName: 'Mobile No.' },
  { itemName: 'Smart Phone', fieldName: 'Plan Details' },

  // Tablet
  { itemName: 'Tablet', fieldName: 'Processor' },
  { itemName: 'Tablet', fieldName: 'RAM' },
  { itemName: 'Tablet', fieldName: 'Storage Capacity' },
  { itemName: 'Tablet', fieldName: 'SIM Type' },
  { itemName: 'Tablet', fieldName: 'IMEI No' },
  { itemName: 'Tablet', fieldName: 'Display Size' },
  { itemName: 'Tablet', fieldName: 'Operating System' },
  { itemName: 'Tablet', fieldName: 'Serial No.' },
  { itemName: 'Tablet', fieldName: 'Carrier Name' },
  { itemName: 'Tablet', fieldName: 'Mobile No.' },
  { itemName: 'Tablet', fieldName: 'Plan Details' },



   { itemName: 'Hand held Scanner', fieldName: 'Scanner Type' },
  { itemName: 'Hand held Scanner', fieldName: 'Connetivity' },
  { itemName: 'Hand held Scanner', fieldName: 'Charging Method' },
  { itemName: 'Hand held Scanner', fieldName: 'Keypad Type' },
  { itemName: 'Hand held Scanner', fieldName: 'Operating System' },
  { itemName: 'Hand held Scanner', fieldName: 'Serial No.' },
  { itemName: 'Hand held Scanner', fieldName: 'Host Name' },
  { itemName: 'Hand held Scanner', fieldName: 'Domain Name' },
  { itemName: 'Hand held Scanner', fieldName: 'IP Details' },

  { itemName: 'LFD / TV', fieldName: 'LFD Type' },
  { itemName: 'LFD / TV', fieldName: 'Display Size' },
  { itemName: 'LFD / TV', fieldName: 'Resolution' },
  { itemName: 'LFD / TV', fieldName: 'Storage Capacity' },
  { itemName: 'LFD / TV', fieldName: 'Orientation Support' },
  { itemName: 'LFD / TV', fieldName: 'Connetivity Type' },
  { itemName: 'LFD / TV', fieldName: 'Operating System' },
  { itemName: 'LFD / TV', fieldName: 'Media Player' },
  { itemName: 'LFD / TV', fieldName: 'Serial No.' },
  { itemName: 'LFD / TV', fieldName: 'Host Name' },
  { itemName: 'LFD / TV', fieldName: 'Domain Name' },
  { itemName: 'LFD / TV', fieldName: 'IP Details' },

   { itemName: 'Projector', fieldName: 'Projector Type' },
  { itemName: 'Projector', fieldName: 'Brightness' },
  { itemName: 'Projector', fieldName: 'Resolution' },
  { itemName: 'Projector', fieldName: 'Connetivity Type' },
  { itemName: 'Projector', fieldName: 'Operating System' },
  { itemName: 'Projector', fieldName: 'Serial No.' },
  { itemName: 'Projector', fieldName: 'Host Name' },
  { itemName: 'Projector', fieldName: 'Domain Name' },
  { itemName: 'Projector', fieldName: 'IP Details' },


   { itemName: 'Video Conference Camera', fieldName: 'Camera Type' },
  { itemName: 'Video Conference Camera', fieldName: 'Resolution' },
  { itemName: 'Video Conference Camera', fieldName: 'Zoom type' },
  { itemName: 'Video Conference Camera', fieldName: 'Connetivity Type' },
  { itemName: 'Video Conference Camera', fieldName: 'Mount Type' },
  { itemName: 'Video Conference Camera', fieldName: 'Integration Platform Support' },
  { itemName: 'Video Conference Camera', fieldName: 'Operating System' },
  { itemName: 'Video Conference Camera', fieldName: 'Serial No.' },
  { itemName: 'Video Conference Camera', fieldName: 'Host Name' },
  { itemName: 'Video Conference Camera', fieldName: 'Domain Name' },
  { itemName: 'Video Conference Camera', fieldName: 'IP Details' },

    { itemName: 'Speaker', fieldName: 'Speaker Type' },
  { itemName: 'Speaker', fieldName: 'Connetivity Type' },
  { itemName: 'Speaker', fieldName: 'Output RMS' },
  { itemName: 'Speaker', fieldName: 'Mount Type' },
  { itemName: 'Speaker', fieldName: 'Serial No.' },
  { itemName: 'Speaker', fieldName: 'Integration Platform Support' },

   { itemName: 'CCTV Camera', fieldName: 'Camera Type' },
  { itemName: 'CCTV Camera', fieldName: 'Form Factor' },
  { itemName: 'CCTV Camera', fieldName: 'Mega Pixel' },
  { itemName: 'CCTV Camera', fieldName: 'Lens Type' },
  { itemName: 'CCTV Camera', fieldName: 'POE Support' },
  { itemName: 'CCTV Camera', fieldName: 'Serial No.' },
  { itemName: 'CCTV Camera', fieldName: 'Host Name' },
  { itemName: 'CCTV Camera', fieldName: 'Domain Name' },
  { itemName: 'CCTV Camera', fieldName: 'IP Details' },

   { itemName: 'Video Recorder', fieldName: 'Device Type' },
  { itemName: 'Video Recorder', fieldName: 'Form Factor' },
  { itemName: 'Video Recorder', fieldName: 'No. of Video Input Ports' },
  { itemName: 'Video Recorder', fieldName: 'Storage Capacity' },
  { itemName: 'Video Recorder', fieldName: 'Serial No.' },
  { itemName: 'Video Recorder', fieldName: 'Host Name' },
  { itemName: 'Video Recorder', fieldName: 'Domain Name' },
  { itemName: 'Video Recorder', fieldName: 'IP Details' },

  { itemName: 'Time and Attendance', fieldName: 'Router Type' },
  { itemName: 'Time and Attendance', fieldName: 'Form Factor' },
  { itemName: 'Time and Attendance', fieldName: 'RAM' },
  { itemName: 'Time and Attendance', fieldName: 'ROM' },
  { itemName: 'Time and Attendance', fieldName: 'Interface Type' },
  { itemName: 'Time and Attendance', fieldName: 'No. Of Ports' },
  { itemName: 'Time and Attendance', fieldName: 'Operating System' },
  { itemName: 'Time and Attendance', fieldName: 'Serial No.' },
  { itemName: 'Time and Attendance', fieldName: 'Host Name' },
  { itemName: 'Time and Attendance', fieldName: 'Domain Name' },
  { itemName: 'Time and Attendance', fieldName: 'IP Details' },

   { itemName: 'Cloud Instance', fieldName: 'Resource Owner' },
  { itemName: 'Cloud Instance', fieldName: 'Region / Zone' },
  { itemName: 'Cloud Instance', fieldName: 'Environment' },
  { itemName: 'Cloud Instance', fieldName: 'Owner / Team' },
  { itemName: 'Cloud Instance', fieldName: 'Status' },
  { itemName: 'Cloud Instance', fieldName: 'Application Linkage' },
  { itemName: 'Cloud Instance', fieldName: 'Public IP' },

    { itemName: "Fire Alarm Systems", fieldName: "Maintenance frequency" },
  { itemName: "Fire Alarm Systems", fieldName: "Maintenance Vendor" },
  { itemName: "Fire Alarm Systems", fieldName: "IP Address" },

    { itemName: "Fire Alarm", fieldName: "Maintenance frequency" },
  { itemName: "Fire Alarm", fieldName: "Maintenance Vendor" },

   { itemName: "Weighting Machine", fieldName: "Maintenance frequency" },
  { itemName: "Weighting Machine", fieldName: "Maintenance Vendor" },
  { itemName: "Weighting Machine", fieldName: "IP Address" },
  { itemName: "Weighting Machine", fieldName: "Connectivity Type" },

    { itemName: "Access Control Systems", fieldName: "Maintenance frequency" },
  { itemName: "Access Control Systems", fieldName: "Maintenance Vendor" },
  { itemName: "Access Control Systems", fieldName: "IP Address" },
  { itemName: "Access Control Systems", fieldName: "Communication Protocol" },

  { itemName: "EPABX", fieldName: "Maintenance frequency" },
  { itemName: "EPABX", fieldName: "Maintenance Vendor" },
  { itemName: "EPABX", fieldName: "IP Address" },
  { itemName: "EPABX", fieldName: "Communication Protocol" },

  { itemName: "Fire Extinguisher", fieldName: "Maintenance frequency" },
  { itemName: "Fire Extinguisher", fieldName: "Maintenance Vendor" },
  { itemName: "Fire Extinguisher", fieldName: "IP Address" },
  { itemName: "Fire Extinguisher", fieldName: "Connectivity Type" },

    { itemName: "Photo Copiers", fieldName: "Maintenance frequency" },
  { itemName: "Photo Copiers", fieldName: "Maintenance Vendor" },
  { itemName: "Photo Copiers", fieldName: "IP Address" },
  { itemName: "Photo Copiers", fieldName: "Connectivity Type" },

   { itemName: "Telephone Systems", fieldName: "Maintenance frequency" },
  { itemName: "Telephone Systems", fieldName: "Maintenance Vendor" },
  { itemName: "Telephone Systems", fieldName: "IP Address" },
  { itemName: "Telephone Systems", fieldName: "Connectivity Type" },
  { itemName: "Telephone Systems", fieldName: "Communication Protocol" },

   { itemName: "Air Conditioner", fieldName: "Maintenance frequency" },
  { itemName: "Air Conditioner", fieldName: "Maintenance Vendor" },
  { itemName: "Air Conditioner", fieldName: "IP Address" },
  { itemName: "Air Conditioner", fieldName: "Connectivity Type" },

  { itemName: "Vending Machine", fieldName: "Maintenance frequency" },
  { itemName: "Vending Machine", fieldName: "Maintenance Vendor" },
  { itemName: "Vending Machine", fieldName: "IP Address" },
  { itemName: "Vending Machine", fieldName: "Connectivity Type" },

  { itemName: "Desert Coolers", fieldName: "Maintenance frequency" },
  { itemName: "Desert Coolers", fieldName: "Maintenance Vendor" },

  { itemName: "Refrigerators", fieldName: "Maintenance frequency" },
  { itemName: "Refrigerators", fieldName: "Maintenance Vendor" },

  { itemName: "Microwaves", fieldName: "Maintenance frequency" },
  { itemName: "Microwaves", fieldName: "Maintenance Vendor" },

  { itemName: "Electric Motors", fieldName: "Maintenance frequency" },
  { itemName: "Electric Motors", fieldName: "Maintenance Vendor" },

  // Generators
  { itemName: "Generators", fieldName: "Maintenance frequency" },
  { itemName: "Generators", fieldName: "Maintenance Vendor" },

  { itemName: "Voltage Stabilizer", fieldName: "Maintenance frequency" },
  { itemName: "Voltage Stabilizer", fieldName: "Maintenance Vendor" },

  { itemName: "Shredding machine", fieldName: "Maintenance frequency" },
  { itemName: "Shredding machine", fieldName: "Maintenance Vendor" },

    { itemName: "Invertors", fieldName: "Maintenance frequency" },
  { itemName: "Invertors", fieldName: "Maintenance Vendor" },
  { itemName: "Invertors", fieldName: "IP Address" },
  { itemName: "Invertors", fieldName: "Connectivity Type" },

    { itemName: "Invertors", fieldName: "Maintenance frequency" },
  { itemName: "Invertors", fieldName: "Maintenance Vendor" },
  { itemName: "Invertors", fieldName: "IP Address" },
  { itemName: "Invertors", fieldName: "Communication Protocol" },

 { itemName: "Microscope", fieldName: "Maintenance frequency" },
  { itemName: "Microscope", fieldName: "Maintenance Vendor" },

  { itemName: "Gauges", fieldName: "Maintenance frequency" },
  { itemName: "Gauges", fieldName: "Maintenance Vendor" },

  { itemName: "Magnetic Shimer", fieldName: "Maintenance frequency" },
  { itemName: "Magnetic Shimer", fieldName: "Maintenance Vendor" }


  ];

  await itemfieldMappingScript.insertItemFieldMappings(schemaName, mappings);





  // Create table designation
  const statusScript = new AssetStatusTypesScript(this.dataSource);
  await statusScript.createAssetStatusTable(schemaName);

 
const statusData = [
  {
    status_type_name: 'In Use',
    asset_status_description: 'Asset is currently being used by an employee',
    status_color_code: '#0068FF',
  },
  {
    status_type_name: 'Available',
    asset_status_description: 'Asset is available for assignment',
    status_color_code: '#00C18E',
  },
  {
    status_type_name: 'Damaged',
    asset_status_description: 'Asset is physically damaged and needs repair',
    status_color_code: '#FF4D4F',
  },
  {
    status_type_name: 'Decommissioned',
    asset_status_description: 'Asset is retired and no longer in service',
    status_color_code: '#8E44AD',
  },
];


  await statusScript.insertAssetStatusTable(schemaName, statusData);

  console.log('15');

  // Create table designation
  const ownershipstatusScript = new AssetOwnershipStatusTypesScript(
    this.dataSource,
  );
  await ownershipstatusScript.createAssetOwnershipStatusTypesTable(
    schemaName,
  );

  const ownershipstatusData = [
  {
    ownership_status_type_name: 'Donated Asset',
    ownership_status_description: 'Asset received through donation',
    ownership_status_type: 'NA',
    asset_ownership_status_color: '#A29BFE',
  },
  {
    ownership_status_type_name: 'Finance Lease',
    ownership_status_description: 'Asset acquired through finance lease agreement',
    ownership_status_type: 'capex',
    asset_ownership_status_color: '#6AB04C',
  },
  {
    ownership_status_type_name: 'Gifted Asset',
    ownership_status_description: 'Asset received as a gift from external parties',
    ownership_status_type: 'NA',
    asset_ownership_status_color: '#E84393',
  },
  {
    ownership_status_type_name: 'Internally Developed Asset',
    ownership_status_description: 'Asset developed internally by the company',
    ownership_status_type: 'capex',
    asset_ownership_status_color: '#0984E3',
  },
  {
    ownership_status_type_name: 'Owned Asset',
    ownership_status_description: 'Asset is fully owned by the company',
    ownership_status_type: 'capex',
    asset_ownership_status_color: '#2ECC71',
  },
  {
    ownership_status_type_name: 'Perpetual License',
    ownership_status_description: 'Software purchased outright with indefinite usage rights',
    ownership_status_type: 'capex',
    asset_ownership_status_color: '#1ABC9C',
  },
  {
    ownership_status_type_name: 'Under Construction',
    ownership_status_description: 'Asset currently under construction or development',
    ownership_status_type: 'capex',
    asset_ownership_status_color: '#F9CA24',
  },
  {
    ownership_status_type_name: 'Rented Asset',
    ownership_status_description: 'Asset rented on short-term or long-term basis',
    ownership_status_type: 'opex',
    asset_ownership_status_color: '#D980FA',
  },
  {
    ownership_status_type_name: 'Subscription-Based Asset',
    ownership_status_description: 'Asset accessed through subscription model',
    ownership_status_type: 'opex',
    asset_ownership_status_color: '#E67E22',
  },
  {
    ownership_status_type_name: 'Support & Maintenance',
    ownership_status_description: 'Annual maintenance or support agreements',
    ownership_status_type: 'opex',
    asset_ownership_status_color: '#8395A7',
  },
  {
    ownership_status_type_name: 'Usage-Based Licensing',
    ownership_status_description: 'Pay-as-you-go or metered software services',
    ownership_status_type: 'opex',
    asset_ownership_status_color: '#BDC581',
  },
];


  await ownershipstatusScript.insertAssetOwnershipStatusTable(
    schemaName,
    ownershipstatusData,
  );

  console.log('16');

  // Create table designation
  const workingstatusScript = new AssetWorkingStatusScript(this.dataSource);
  await workingstatusScript.createAssetWorkingStatusTable(schemaName);

  const workingstatusData = [
    { working_status_type_name: 'OPERATIONAL' },
    { working_status_type_name: 'UNDER MAINTAINANCE' },
    { working_status_type_name: 'FAULTY' },
    { working_status_type_name: 'DAMAGED' },
    { working_status_type_name: 'RETIRED' },
  ];

  await workingstatusScript.insertAssetWorkingStatusTable(
    schemaName,
    workingstatusData,
  );

  console.log('17');

  // Create table designation
  const itemRelationScript = new AssetItemRelationScript(this.dataSource);
  await itemRelationScript.createAssetItemRelationTable(schemaName);



enum RelationType {
   Other  = "Other",
   Accessory  = "Accessory",
   Contract  = "Contract",
   Application  = "Application",   
  
}


  const relations: {
  parentItemName: string;
  childItemName: string;
  relationType: RelationType;
}[] = [
 { parentItemName: "Computer", childItemName: "Keyboard", relationType: RelationType.Accessory },
  { parentItemName: "Computer", childItemName: "Monitors", relationType: RelationType.Accessory },
   { parentItemName: "Computer", childItemName: "Mouse", relationType: RelationType.Accessory }, 
   { parentItemName: "Computer", childItemName: "Contract", relationType: RelationType.Contract },
   { parentItemName: "Computer", childItemName: "Application Software", relationType: RelationType.Application },
  { parentItemName: "Computer", childItemName: "Operating System", relationType: RelationType.Application },


];

await itemRelationScript.insertItemRelations(schemaName, relations);


  console.log('18');

  // Create table designation
  const assetScript = new AssetsScript(this.dataSource);
  await assetScript.createAssetsTable(schemaName);

  console.log('19');

  // Create table designation
  const licencetypesScript = new LicenceTypesScript(this.dataSource);
  await licencetypesScript.createLicenceTypesTable(schemaName);

  const licencetypesDataflags = [
    {
      licence_type: 'FPP',
      licence_key_type: true,
      needs_license_key: true,
      bulk_license: false,
      have_plan_type: false,
      is_active: 1,
      is_delete: 0,
    },
    {
      licence_type: 'Volume',
      licence_key_type: false,
      needs_license_key: true,
      bulk_license: false,
      have_plan_type: false,
      is_active: 1,
      is_delete: 0,
    },
    {
      licence_type: 'Preloaded',
      licence_key_type: true,
      needs_license_key: false,
      bulk_license: false,
      have_plan_type: false,
      is_active: 1,
      is_delete: 0,
    },
    {
      licence_type: 'Subscription',
      licence_key_type: true,
      needs_license_key: true,
      bulk_license: false,
      have_plan_type: true,
      is_active: 1,
      is_delete: 0,
    },
    {
      licence_type: 'Perpetual',
      licence_key_type: true,
      needs_license_key: true,
      bulk_license: false,
      have_plan_type: false,
      is_active: 1,
      is_delete: 0,
    },
    {
      licence_type: 'OEM',
      licence_key_type: true,
      needs_license_key: true,
      bulk_license: false,
      have_plan_type: false,
      is_active: 1,
      is_delete: 0,
    },
  ];
  
  

  await licencetypesScript.insertLicenceTypeTable(
    schemaName,
    licencetypesDataflags,
  );

  console.log('20');

  // Create table designation
  const vendorScript = new VendersScript(this.dataSource);
  await vendorScript.createVendersTable(schemaName);

  console.log('21');

  // Create table designation
  const stockScript = new StocksScript(this.dataSource);
  await stockScript.createStocksTable(schemaName);

  console.log('22');

  // Create table designation
  const assetMappingScript = new AssetMappingRelations(this.dataSource);
  await assetMappingScript.createAssetMappingRelationsTable(schemaName);

  console.log('23');

  // Create table designation
  const transferScript = new AssetTransferHistoryScript(this.dataSource);
  await transferScript.createAssetTransferHistoryTable(schemaName);

  console.log('24');

  // Create table designation
  const stockSerialScript = new AssetStockSerialsScript(this.dataSource);
  await stockSerialScript.createAssetStockSerialsTable(schemaName);

  console.log('25');
  
  
  // Create table OrgStats
  const OrgStats = new orgStatsScriptScript(this.dataSource)
  await OrgStats.createOrgStatsScriptTable(schemaName)

  console.log('26');

  // Create Table AssetProject
  const assetProject = new assetProjectScript(this.dataSource)
  await assetProject.createAssetProjectTable(schemaName)

  console.log('27');

  // Create Table CostCenterTable
  const costCenterTable = new assetCostCenterScript(this.dataSource)
  await costCenterTable.createAssetCostCenterScriptTable(schemaName)

  console.log('28');


  // Create Table Location Table
  const locationTable = new assetLocationScript(this.dataSource)
  await locationTable.createAssetLocationScriptTable(schemaName)

  console.log('29');

  // Create Table Depriciataion Table
  const depriciataionTable = new assetDepreciationMethodsScript(this.dataSource)
  await depriciataionTable.createassetDepreciationMethodsScriptTable(schemaName)

  console.log('30');
  
  // assetid setting table 
  const assetIdSettingsTable = new assetIdSettingsScript(this.dataSource)
  await assetIdSettingsTable.createAssetIdSettingsV2Table(schemaName)
  
  console.log('31');
  // qr Code Settings setting table
  const qrCodeSettingsTable = new qrCodeSettingsScript(this.dataSource)
  await qrCodeSettingsTable.createQrCodeSettingsTable(schemaName)
  
  console.log('32');
  // other Settings OrgTable table
  const otherSettingsOrgTable = new otherSettingsOrgScript(this.dataSource)
  await otherSettingsOrgTable.createOtherSettingsOrgTable(schemaName)
  
  console.log("33")
  
  const assetListView = new AssetListViewScript(this.dataSource)
  await assetListView.createAssetStockSerialsView(schemaName)

    // Send onboarding email with plain-text password
    // await this.sendOnboardingEmail(user.users_business_email, randomPassword);
    const fullname = 'Norbik Asset';
    console.log("Generated plain password (to be sent via email):", randomPassword);

    await this.mailService.sendEmail(
      user.business_email,
      'Welcome Aboard! Everything You Need to Get Started',
      await renderEmail(
        EmailTemplate.ONBOARDING_CONFIRMATION,
        {
          name: fullname,
          companyName: user.organization.organization_name,
          trialUrl: `${process.env.CLIENT_ORIGIN_URL}/sign-in`,
          username: user.business_email,
          password: randomPassword,
        },
        this.mailConfigService, // Ensure database connection is passed
      ),
    );

  }

  /**
   * Hashes a password using bcrypt
   * @param password Plain password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**/

  async fetchSingleUsersProfile(userId: number): Promise<{ status: number; success: boolean; data?: any; message?: string }> {
    try {
      if (!userId) {
        return { status: 400, success: false, message: 'userId is required' };
      }
      
      // Fetch user from the database
      const user = await this.registerUser.findOne({
        where: { user_id: userId },
        relations: ['organization'], // include relations if needed
      });

      if (!user) {
        return { status: 404, success: false, message: 'User not found' };
      }

      // Prepare and return response
      return {
        status: 200,
        success: true,
        data: {
          id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.business_email,
          organization: user.organization,
          // add any other fields you want to expose
        },
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { status: 500, success: false, message: 'Internal server error' };
    }
  }

  async getOrganizationsForSelect(): Promise<{ id: number; name: string }[]> {
    const orgs = await this.orgRepo.find({
      select: ['organization_id', 'organization_name'],
    });

    // Map to a clean format for frontend
    return orgs.map((org) => ({
      id: org.organization_id,
      name: org.organization_name,
    }));
  }

  //Get all product
  async getAllProducts(): Promise<Product[]> {
    try {
      return await this.productRepository.find({
        where: { isDeleted: false, isActive: true }, // optional filter
        order: { productId: 'ASC' },
      });
    } catch (error) {
      throw new Error('Error fetching products: ' + error.message);
    }
  }

  async getActivePlansByProduct(productId: number): Promise<{ id: number; name: string }[]> {
    try {
      const plans = await this.planRepository.find({
        select: ['plan_id', 'plan_name', 'set_trial'],
        where: { is_active: true, product: { productId: productId } },
        order: { plan_name: 'ASC' },
        relations: ['product'],
      });

      return plans.map((p) => ({ id: p.plan_id, name: p.plan_name, set_trial: p.set_trial, }));
    } catch (error) {
      throw new Error('Error fetching active plans: ' + error.message);
    }
  }


  async getActiveFeaturesByProduct(productId: number): Promise<{ id: number; name: string }[]> {
    try {
      const features = await this.featureRepository.find({
        select: ['feature_id', 'feature_name','set_limit'],
        where: { is_active: true, product: { productId: productId } },
        relations: ['product'],
        order: { feature_name: 'ASC' },
      });

      return features.map((f) => ({
        id: f.feature_id,
        name: f.feature_name,
        limit: f.set_limit, 
      }));
    } catch (error) {
      throw new Error('Error fetching active features: ' + error.message);
    }
  }

  async listProducts({
    page = 1,
    limit = 10,
    search = '',
    status,
  }: {
    page: number;
    limit: number;
    search?: string;
    status?: 'active' | 'inactive';
  }) {
    try {
      const qb = this.productRepository
        .createQueryBuilder('product')
        .where('product.isDeleted = false');

      // 🔍 Search filter
      if (search) {
        qb.andWhere(
          '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
          { search: `%${search}%` },
        );
      }

      // 🟢 Status filter
      if (status) {
        qb.andWhere('product.isActive = :isActive', { isActive: status === 'active' });
      }

      // 📦 Pagination
      qb.orderBy('product.productId', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await qb.getManyAndCount();

      return {
        data,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error('Error listing products: ' + error.message);
    }
  }

  // ✅ Add Product
  async addProduct(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    return await this.productRepository.save(product);
  }

  // ✅ Get Single Product
  async getProductById(productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId, isDeleted: false },
    });
    if (!product) throw new Error('Product not found');
    return product;
  }

  // ✅ Update Product
  async updateProduct(productId: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getProductById(productId);
    Object.assign(product, dto);
    return await this.productRepository.save(product);
  }

  // ✅ Soft Delete
  async softDeleteProduct(productId: number): Promise<void> {
    const product = await this.getProductById(productId);
    product.isDeleted = true;
    product.isActive = false;
    await this.productRepository.save(product);
  }

    async getAllStatus(): Promise<RenewalStatus[]> {
    try {
      return await this.renewalStatusRepository.find({
        where: { is_deleted: false }, // fetch only non-deleted statuses
        order: { status_id: 'ASC' },
      });
    } catch (error) {
      throw new Error('Error fetching renewal statuses: ' + error.message);
    }
  }

  async getDashboardCounts(): Promise<any> {
  try {
    // Total Organizations
    const orgCount = await this.orgRepo.count();

    // Total Products
    const productCount = await this.productRepository.count({
      where: { isActive: true },
    });

    // Total Users
    const userCount = await this.registerUser.count();

    // Total Active Subscriptions
    const subscriptionCount = await this.subscriptionRepository.count({
      where: { is_active: true, is_activated: true },
    });

    // Renewals (subscriptions whose renewal_date is within next 30 days)
    const renewalCount = await this.subscriptionRepository
      .createQueryBuilder("sub")
      .where("sub.is_active = :active", { active: true })
      .andWhere("sub.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'")
      .getCount();

    // Trial Subscriptions
    const trialSubscriptionCount = await this.subscriptionRepository.count({
      where: { is_trial_period: true },
    });

    // Product-wise Subscription Count
    const productWiseSubscriptions = await this.subscriptionRepository
      .createQueryBuilder("sub")
      .select("p.name", "productName")
      .addSelect("COUNT(sub.subscription_id)", "count")
      .leftJoin("sub.product", "p")
      .where("sub.is_active = true")
       .andWhere("sub.product_id IS NOT NULL") 
      .groupBy("p.name")
      .getRawMany();

    return {
      orgCount,
      productCount,
      userCount,
      subscriptionCount,
      renewalCount,
      trialSubscriptionCount,
      productWiseSubscriptions,
    };
  } catch (error) {
    throw new Error("Error fetching dashboard counts: " + error.message);
  }
}

async toggleLoginRestriction(id: number) {
  try {
    const subscription = await this.subscriptionRepository.findOne({
      where: { subscription_id: id },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Toggle restrict_login value
    subscription.restrict_login = !subscription.restrict_login;

    const updated = await this.subscriptionRepository.save(subscription);

    return updated;
  } catch (error) {
    console.error('Error toggling login restriction:', error);
    throw new Error('Failed to toggle login restriction');
  }
}


}