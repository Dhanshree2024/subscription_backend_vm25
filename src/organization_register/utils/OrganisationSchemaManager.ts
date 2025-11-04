import { DataSource } from 'typeorm';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
//
import { MailService } from 'src/common/mail/mail.service';
import { renderEmail, EmailTemplate } from 'src/common/mail/render-email';
import { MailConfigService } from 'src/common/mail/mail-config.service';
//
import { userDefaultPermission } from 'src/organization_register/default_permissions/UserDefaultPermission';
import { adminDefaultPermission } from 'src/organization_register/default_permissions/AdminDefaultPermission';
import * as bcrypt from 'bcrypt';

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
import { orgStatsScriptScript } from '../onboarding_sql_scripts/assetsorgstats';
import { assetProjectScript } from '../onboarding_sql_scripts/assetproject';
import { assetCostCenterScript } from '../onboarding_sql_scripts/assetcostcenter';
import { assetLocationScript } from '../onboarding_sql_scripts/assetlocation';
import { assetDepreciationMethodsScript } from '../onboarding_sql_scripts/assetdepreciationmethods';
import { TechnicianDefaultPermission } from '../default_permissions/TechnicianDefaultPermissions';
import { SuperAdminDefaultPermission } from '../default_permissions/SuperAdminDefaultPermissions';
import { otherSettingsOrgScript } from '../onboarding_sql_scripts/othersetting';
import { AssetListViewScript } from '../onboarding_sql_scripts/assetlistview';
import { qrCodeSettingsScript } from '../onboarding_sql_scripts/assetqrsetting';
import { assetIdSettingsScript } from '../onboarding_sql_scripts/assetidsettingsv2';

export class OrganizationSchemaManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mailConfigService: MailConfigService, // Inject service
    private readonly mailService: MailService,

  ) {}
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
  async createOrganizationSchemaAndTables(user: RegisterUserLogin): Promise<void> {
        console.log("user die:",user)
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
        await this.dataSource.getRepository(RegisterUserLogin).save(user);
        // await this.registerUser.save(user);
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

    // await this.mailService.sendEmail(
    //   user.business_email,
    //   'Welcome Aboard! Everything You Need to Get Started',
    //   await renderEmail(
    //     EmailTemplate.ONBOARDING_CONFIRMATION,
    //     {
    //       name: fullname,
    //       companyName: user.organization.organization_name,
    //       trialUrl: `${process.env.CLIENT_ORIGIN_URL}/sign-in`,
    //       username: user.business_email,
    //       password: randomPassword,
    //     },
    //     this.mailConfigService, // Ensure database connection is passed
    //   ),
    // );
  }
}
