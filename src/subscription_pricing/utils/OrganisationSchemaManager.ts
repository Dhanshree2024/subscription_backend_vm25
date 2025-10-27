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
import { orgStatsScriptScript } from 'src/organization_register/onboarding_sql_scripts/assetsorgstats';
import { assetProjectScript } from 'src/organization_register/onboarding_sql_scripts/assetproject';
import { assetCostCenterScript } from 'src/organization_register/onboarding_sql_scripts/assetcostcenter';
import { assetLocationScript } from 'src/organization_register/onboarding_sql_scripts/assetlocation';
import { assetDepreciationMethodsScript } from 'src/organization_register/onboarding_sql_scripts/assetdepreciationmethods';
import { Product } from '../entity/product.entity';

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

         // ✅ Fetch product with product_id = 1
          const product = await this.dataSource
            .getRepository(Product)
            .findOne({ where: { productId: 1 } });

          if (!product) {
            throw new Error("Product with ID 1 not found");
          }

          console.log("Product schema_initial:", product.schemaInitial);
        // Create schema for the organization
        const schemaName = `${product.schemaInitial}_org_${user.organization.organization_schema_name}`;
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
      { department_name: 'Administration' },
      { department_name: 'Human Resources (HR)' },
      { department_name: 'Store' },
      { department_name: 'Sales' },
      { department_name: 'Support/ Customer Service' },
    ];

    await departmentscript.insertOrganizationDepartmentTable(
      schemaName,
      departmentData,
    );

    console.log('4');

    const rolesData = [
      { role_id: 1, role_name: 'Admin' },
      { role_id: 2, role_name: 'User' },
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
      { role_id: 1, permission: adminDefaultPermission },
      { role_id: 2, permission: userDefaultPermission },
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
    ];

    await fieldCategoryScript.insertFieldCategoryTable(
      schemaName,
      fieldCategoryData,
    );

    const insertedFieldCategories = await this.dataSource.query(
      `SELECT asset_field_category_id, asset_field_category_name 
       FROM ${schemaName}.asset_field_category 
       WHERE asset_field_category_name IN ('General Information', 'Network & Domain Information', 'System Specification')`,
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
        asset_field_name: 'Location',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Location',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Expiry Date',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Expiry Date',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Port',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Port',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Contract Type',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Contract Type',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Firmware Version',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Firmware Version',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Processor',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Processor',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'RAM',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'RAM',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'HDD',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'HDD',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Graphics',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Graphics',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Screen Size',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Screen Size',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Screen',
        asset_field_category_id: categoryMap['System Specification'],
        asset_field_label_name: 'Screen',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Pixel',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Pixel',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Product Description',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Product Description',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Type',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Type',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Capacity',
        asset_field_category_id: categoryMap['General Information'],
        asset_field_label_name: 'Capacity',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Host Name',
        asset_field_category_id: categoryMap['General Information'],
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
        asset_field_name: 'Carrier',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'Carrier',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'IMEI No.',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'IMEI No.',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'IPv4',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'IPv4',
        asset_field_type: 'text',
      },
      {
        asset_field_name: 'Platform',
        asset_field_category_id: categoryMap['Network & Domain Information'],
        asset_field_label_name: 'Platform',
        asset_field_type: 'text',
      },
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
      { main_category_id: mainCatMap['IT'], sub_category_name: 'Cloud' },
      { main_category_id: mainCatMap['IT'], sub_category_name: 'Data' },
      {
        main_category_id: mainCatMap['IT'],
        sub_category_name: 'Consumable Inventory',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Electrical Equipment',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Scientific Equipment',
      },
      {
        main_category_id: mainCatMap['Non IT'],
        sub_category_name: 'Office Equipment',
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
        name: 'Computer',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Server',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Mobile',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Keyboard',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Mouse',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Webcam',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Router',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Switch',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Peripherals',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Printer and Scanners',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'IP Camera',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Access Point',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Monitors',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Headset',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Projector',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Tablet',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Videoconference Camera',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Storage Device',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Operating System',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Application Software',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Contract',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Cloud',
        name: 'Virtual Machine',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Cloud',
        name: 'Storage resources',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Data',
        name: 'Contract',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Data',
        name: 'Warranty',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Data',
        name: 'Business Application',
        is_licensable: true,
        item_type: 'Virtual',
      },
      {
        main: 'IT',
        sub: 'Consumable Inventory',
        name: 'Pen Drive',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Consumable Inventory',
        name: 'Cartridge',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Consumable Inventory',
        name: 'CD / DVD',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Air Conditioner',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Pedestal Fan',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Desert Coolers',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Refrigerators',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Microwaves',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Electric Motors',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Generators',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Invertors',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Shredding machine',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'Voltage Stabilizer',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'UPS',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Furniture',
        name: 'Chair',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Furniture',
        name: 'Computer Desk',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'CCTV Camera',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'Non IT',
        sub: 'Electrical Equipment',
        name: 'VC Camera',
        is_licensable: true,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Hardware',
        name: 'Wireless AP',
        is_licensable: false,
        item_type: 'Physical',
      },
      {
        main: 'IT',
        sub: 'Software',
        name: 'Firewall',
        is_licensable: false,
        item_type: 'Physical',
      },
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
      { itemName: 'Computer', fieldName: 'RAM' },
      { itemName: 'Computer', fieldName: 'Processor' },
      { itemName: 'Computer', fieldName: 'Graphics' },
      { itemName: 'Computer', fieldName: 'HDD' },
      { itemName: 'Computer', fieldName: 'Host Name' },
      { itemName: 'Computer', fieldName: 'Domain Name' },
      { itemName: 'Computer', fieldName: 'IPv4' },
      { itemName: 'Server', fieldName: 'RAM' },
      { itemName: 'Server', fieldName: 'Processor' },
      { itemName: 'Server', fieldName: 'Graphics' },
      { itemName: 'Server', fieldName: 'HDD' },
      { itemName: 'Server', fieldName: 'IPv4' },
      { itemName: 'Server', fieldName: 'Graphics' },
      { itemName: 'Server', fieldName: 'Host Name' },
      { itemName: 'Server', fieldName: 'Domain Name' },

      { itemName: 'Tablet', fieldName: 'RAM' },
      { itemName: 'Tablet', fieldName: 'Processor' },
      { itemName: 'Tablet', fieldName: 'Graphics' },
      { itemName: 'Tablet', fieldName: 'HDD' },
      { itemName: 'Tablet', fieldName: 'IPv4' },
      { itemName: 'Tablet', fieldName: 'Graphics' },
      { itemName: 'Tablet', fieldName: 'Host Name' },
      { itemName: 'Tablet', fieldName: 'Domain Name' },

      { itemName: 'Mobile', fieldName: 'RAM' },
      { itemName: 'Mobile', fieldName: 'Processor' },
      { itemName: 'Mobile', fieldName: 'Graphics' },
      { itemName: 'Mobile', fieldName: 'HDD' },
      { itemName: 'Mobile', fieldName: 'IPv4' },
      { itemName: 'Mobile', fieldName: 'Screen' },
      { itemName: 'Mobile', fieldName: 'IMEI No.' },
      { itemName: 'Mobile', fieldName: 'Carrier' },

      { itemName: 'Switch', fieldName: 'RAM' },
      { itemName: 'Switch', fieldName: 'Processor' },
      { itemName: 'Switch', fieldName: 'HDD' },
      { itemName: 'Switch', fieldName: 'Host Name' },
      { itemName: 'Switch', fieldName: 'Domain Name' },
      { itemName: 'Switch', fieldName: 'IPv4' },

      { itemName: 'Router', fieldName: 'RAM' },
      { itemName: 'Router', fieldName: 'Processor' },
      { itemName: 'Router', fieldName: 'HDD' },
      { itemName: 'Router', fieldName: 'Host Name' },
      { itemName: 'Router', fieldName: 'Domain Name' },
      { itemName: 'Router', fieldName: 'IPv4' },


      { itemName: 'Firewall', fieldName: 'RAM' },
      { itemName: 'Firewall', fieldName: 'Processor' },
      { itemName: 'Firewall', fieldName: 'HDD' },
      { itemName: 'Firewall', fieldName: 'IPv4' },
      { itemName: 'Firewall', fieldName: 'Graphics' },
      { itemName: 'Firewall', fieldName: 'Host Name' },
      { itemName: 'Firewall', fieldName: 'Domain Name' },
      { itemName: 'Firewall', fieldName: 'Carrier' },

      { itemName: 'CCTV Camera', fieldName: 'Type' },
      { itemName: 'CCTV Camera', fieldName: 'Pixel' },
      { itemName: 'CCTV Camera', fieldName: 'IPv4' },

      { itemName: 'VC Camera', fieldName: 'Type' },
      { itemName: 'VC Camera', fieldName: 'Pixel' },
      { itemName: 'VC Camera', fieldName: 'IPv4' },

      { itemName: 'Storage Device', fieldName: 'Type' },
      { itemName: 'Storage Device', fieldName: 'Product Description' },
      { itemName: 'Storage Device', fieldName: 'IPv4' },

      { itemName: 'Wireless AP', fieldName: 'IPv4' },
      { itemName: 'Wireless AP', fieldName: 'Host Name' },

      { itemName: 'Printer and Scanners', fieldName: 'RAM' },
      { itemName: 'Printer and Scanners', fieldName: 'Host Name' },
      { itemName: 'Printer and Scanners', fieldName: 'Domain Name' },
      { itemName: 'Printer and Scanners', fieldName: 'IPv4' },
    ];

    await itemfieldMappingScript.insertItemFieldMappings(schemaName, mappings);

    // Create table designation
    const statusScript = new AssetStatusTypesScript(this.dataSource);
    await statusScript.createAssetStatusTable(schemaName);

    const statusData = [
      { status_type_name: 'AVAILABLE' },
      { status_type_name: 'IN USE' },
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
      { ownership_status_type_name: 'CAPEX' },
      { ownership_status_type_name: 'LEASE' },
      { ownership_status_type_name: 'OPEX' },
      { ownership_status_type_name: 'RENTED' },
      { ownership_status_type_name: 'OWNED' },
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
      Other = "Other",
      Accessory = "Accessory",
      Contract = "Contract",
      Application = "Application",

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
  

    // Send onboarding email with plain-text password
    // await this.sendOnboardingEmail(user.users_business_email, randomPassword);
    // const fullname = 'Norbik Asset';
    // console.log("Generated plain password (to be sent via email):", randomPassword);

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
