import { DataSource } from 'typeorm';
import { Injectable, NotFoundException, InternalServerErrorException, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';

import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
//
import { MailService } from 'src/common/mail/mail.service';
import { renderEmail, EmailTemplate } from 'src/common/mail/render-email';
import { MailConfigService } from 'src/common/mail/mail-config.service';
//

import * as bcrypt from 'bcrypt';

// all scripts to use to create org
import { UserScript } from '../../organization_register/onboarding_sql_scripts_hrms/users';
import { OrganizationProfileScript } from '../../organization_register/onboarding_sql_scripts_hrms/organizational_profile';
import { BranchesScript } from '../../organization_register/onboarding_sql_scripts_hrms/branches';
import { DepartmentsScript } from '../../organization_register/onboarding_sql_scripts_hrms/departments';
import { DocumentTypeScript } from '../../organization_register/onboarding_sql_scripts_hrms/document_type';
import { OrganizationPermissionScript } from '../../organization_register/onboarding_sql_scripts_hrms/organization_permissions';
import { OrganizationRolesScript } from '../../organization_register/onboarding_sql_scripts_hrms/organization_roles';
import { ShiftRulesetsScript } from '../../organization_register/onboarding_sql_scripts_hrms/shift_rulesets';
import { UserCompanyDetailsScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_company_details';
import { UsersDocumentStoreScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_document_store';
import { UsersEducationScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_education';
import { UsersBankDetailsScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_banks_details';
import { UsersPerviousCompanyDetailsScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_previous_company_details';
import { DesignationScript } from '../../organization_register/onboarding_sql_scripts_hrms/designation';
// import { Plan } from '../onboarding_sql_scripts_hrms/';
// import { Subscription } from './entities/public_subscription.entity';
import { v4 as uuidv4 } from 'uuid';  // Import UUID for generating unique identifiers
import { EmployeeStatusScript } from '../../organization_register/onboarding_sql_scripts_hrms/hiring_status';
import { ActivityLogScript } from '../../organization_register/onboarding_sql_scripts_hrms/activity_log';
import { UsersBenefitsScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_benefits';
import { UsersAssetScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_asset';
import { MisconductReasonsScript } from '../../organization_register/onboarding_sql_scripts_hrms/misconduct_reasons';
import { DisciplinaryActionsScript } from '../../organization_register/onboarding_sql_scripts_hrms/disciplinary_actions';
import { DisciplinaryActionStatusesScript } from '../../organization_register/onboarding_sql_scripts_hrms/disciplinary_action_statuses';
import { EmployeeDisciplinaryRecordsScript } from '../../organization_register/onboarding_sql_scripts_hrms/employee_disciplinary_records';
import { DisciplinaryDocumentsScript } from '../../organization_register/onboarding_sql_scripts_hrms/disciplinary_documents';
import { ResignationRequestScript } from '../../organization_register/onboarding_sql_scripts_hrms/resignation_requests';
import { AttendanceScript } from '../../organization_register/onboarding_sql_scripts_hrms/attendance';
import { ManualAttendanceScript } from '../../organization_register/onboarding_sql_scripts_hrms/manual_attendance_requests';
import { OrganizationSetupScript } from '../../organization_register/onboarding_sql_scripts_hrms/organization_setup';
import { CandidateStageNotesScript } from '../../organization_register/onboarding_sql_scripts_hrms/candidate_stage_notes';
import { EmployeeLeaveEntitlementScript } from '../../organization_register/onboarding_sql_scripts_hrms/employee_leave_entitlement';
import { EmployeeShiftsScript } from '../../organization_register/onboarding_sql_scripts_hrms/employee_shifts';
import { InterviewsScript } from '../../organization_register/onboarding_sql_scripts_hrms/interviews';
// import { JobOpeningsScript } from '../../organization_register/onboarding_sql_scripts_hrms/job_openings';
import { LeavePoliciesScript } from '../../organization_register/onboarding_sql_scripts_hrms/leave_policies';
import { LeaveTypesScript } from '../../organization_register/onboarding_sql_scripts_hrms/leave_types';
import { OrganizationHolidaysScript } from '../../organization_register/onboarding_sql_scripts_hrms/organization_holidays';
import { ShiftChangeRequestsScript } from '../../organization_register/onboarding_sql_scripts_hrms/shift_change_requests';
// import { ShiftsSetupScript } from '../../organization_register/onboarding_sql_scripts_hrms/shifts_setup';
import { LeaveApplicationScript } from '../../organization_register/onboarding_sql_scripts_hrms/leave_application';
import { EmployeeFloaterLeaveScript } from '../../organization_register/onboarding_sql_scripts_hrms/employee_floater_holidays';
import { UsersBranchPermissionScript } from '../../organization_register/onboarding_sql_scripts_hrms/users_branch_permissions';
import { EmergencyContactsScript  } from '../../organization_register/onboarding_sql_scripts_hrms/emergency_contact';
import { FamilyDetailsScript } from '../../organization_register/onboarding_sql_scripts_hrms/family_details';
import { CompOffRequestsScript } from '../../organization_register/onboarding_sql_scripts_hrms/com-off';
import { Product } from '../entity/product.entity';

export class HrmsOrganizationSchemaManager {
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

        const product = await this.dataSource
          .getRepository(Product)
          .findOne({ where: { productId: 2 } });

        if (!product) {
          throw new Error("Product with ID 2 not found");
        }

        console.log("Product schema_initial:", product.schemaInitial);
    
        // Create schema for the organization
        // const schemaName = `org_${user.organization.organization_schema_name}`;
        const schemaName = `${product.schemaInitial}_org_${user.organization.organization_schema_name}`;
        const organizationId = user.organization.organization_id;
        await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
       console.log('1');
    // Create tables in the users schema
    const script = new UserScript(this.dataSource);
    await script.createUserTable(schemaName);
    const hashedPassword1 = await script.insertUserTable(schemaName, user);

    console.log('2');
    // Create tables in the organization profile schema
    const script1 = new OrganizationProfileScript(this.dataSource);
    await script1.createOrganizationProfileTable(schemaName);
    await script1.insertOrganizationProfileTable(schemaName, user);

    console.log('3');
    // Create table branches
    const branchscript = new BranchesScript(this.dataSource);
    await branchscript.createBranchesTable(schemaName);

    console.log('4');
    // Create table department
    const departmentscript = new DepartmentsScript(this.dataSource);
    await departmentscript.createDepartmentsTable(schemaName);

    console.log('5');
    // Create table organization roles tables
    const organizationrolesscript = new OrganizationRolesScript(this.dataSource);
    await organizationrolesscript.createOrganizationRolesTable(schemaName);


    console.log('6');
    // Create table organization permission tables
    const organizationpermissionsscript = new OrganizationPermissionScript(this.dataSource);
    await organizationpermissionsscript.createOrganizationPermissionTable(schemaName);

    // console.log('7');
    // const shiftsSetupScript = new ShiftsSetupScript(this.dataSource);
    // await shiftsSetupScript.createShiftsSetuptable(schemaName);

    // console.log('8');
    // // Create table shifts tables
    // const shiftRulesetsScript = new ShiftRulesetsScript(this.dataSource);
    // await shiftRulesetsScript.createShiftRulesetsable(schemaName);

    console.log('9');
    // Create table designation
    const designationcript = new DesignationScript(this.dataSource);
    await designationcript.createDesignationTable(schemaName);

    // console.log('10');

    // // Create table users company details tables
    // const userscompanydetailsscript = new UserCompanyDetailsScript(this.dataSource);
    // await userscompanydetailsscript.createUserCompanyDetailsTable(schemaName);

    // console.log('11');
    // // Create table document types
    // const documenttypescript = new DocumentTypeScript(this.dataSource);
    // await documenttypescript.createDocumentTypeTable(schemaName);

    // console.log('12');

    // // Create table users document store tables
    // const usersdocumentstorescript = new UsersDocumentStoreScript(this.dataSource);
    // await usersdocumentstorescript.createUsersDocumentStoreTable(schemaName);

    // console.log('13');

    // // Create table users education tables
    // const userseducationscript = new UsersEducationScript(this.dataSource);
    // await userseducationscript.createUsersEducationTable(schemaName);

    // console.log('14');

    // // Create table users bank details tables
    // const usersbankdetailsscript = new UsersBankDetailsScript(this.dataSource);
    // await usersbankdetailsscript.createUsersBankDetailsTable(schemaName);

    // console.log('15');

    // // Create table users bank details tables
    // const usersperviouscompanydetailsscript = new UsersPerviousCompanyDetailsScript(this.dataSource);
    // await usersperviouscompanydetailsscript.createUsersPerviousCompanyDetailsTable(schemaName);


    // console.log('16');

    // // Create table users bank details tables
    // const employeestatusscript = new EmployeeStatusScript(this.dataSource);
    // await employeestatusscript.createEmployeeStatusTable(schemaName);

    // console.log('17');

    // const employeeactivityLogScript = new ActivityLogScript(this.dataSource);
    // await employeeactivityLogScript.createActivityLogTable(schemaName);

    // console.log('18');
    // const employeeUsersBenefitsScript = new UsersBenefitsScript(this.dataSource);
    // await employeeUsersBenefitsScript.createUsersBenefitsTable(schemaName);

    // console.log('19');
    // const employeeUsersAssetScript = new UsersAssetScript(this.dataSource);
    // await employeeUsersAssetScript.createUsersAssetTable(schemaName);


    // console.log('20');
    // const employeeMisconductReasonsScript = new MisconductReasonsScript(this.dataSource);
    // await employeeMisconductReasonsScript.createMisconductReasonsTable(schemaName);

    // console.log('21');
    // const employeeDisciplinaryActionsScript = new DisciplinaryActionsScript(this.dataSource);
    // await employeeDisciplinaryActionsScript.createDisciplinaryActionsTable(schemaName);


    // console.log('22');
    // const employeeDisciplinaryActionStatusesScript = new DisciplinaryActionStatusesScript(this.dataSource);
    // await employeeDisciplinaryActionStatusesScript.createDisciplinaryActionStatusesTable(schemaName);

    // console.log('23');
    // const employeeEmployeeDisciplinaryRecordsScript = new EmployeeDisciplinaryRecordsScript(this.dataSource);
    // await employeeEmployeeDisciplinaryRecordsScript.createEmployeeDisciplinaryRecordsTable(schemaName);

    // console.log('24');
    // const employeeDisciplinaryDocumentsScript = new DisciplinaryDocumentsScript(this.dataSource);
    // await employeeDisciplinaryDocumentsScript.createDisciplinaryDocumentsTable(schemaName);

    // console.log('25');
    // const employeeResignationRequestScriptScript = new ResignationRequestScript(this.dataSource);
    // await employeeResignationRequestScriptScript.createResignationRequestTable(schemaName);

    // console.log('26');
    // const employeeAttendanceScript = new AttendanceScript(this.dataSource);
    // await employeeAttendanceScript.createAttendanceTable(schemaName);

    // console.log('27');
    // const employeeManualAttendanceScript = new ManualAttendanceScript(this.dataSource);
    // await employeeManualAttendanceScript.createManualAttendanceTable(schemaName);

    // console.log('28');
    // const organizationsetupScript = new OrganizationSetupScript(this.dataSource);
    // await organizationsetupScript.createOrganizationSetupTable(schemaName,organizationId);

    // console.log('29');
    // const candidateStageNotesScript = new CandidateStageNotesScript(this.dataSource);
    // await candidateStageNotesScript.createCandidateStageNotesTable(schemaName);

    // console.log('30');
    // const leaveTypesScript = new LeaveTypesScript(this.dataSource);
    // await leaveTypesScript.createLeaveTypesTable(schemaName);

    // console.log('31');
    // const employeeLeaveEntitlementScript = new EmployeeLeaveEntitlementScript(this.dataSource);
    // await employeeLeaveEntitlementScript.createEmployeeLeaveEntitlementTable(schemaName);

    // console.log('32');
    // const employeeShiftsScript = new EmployeeShiftsScript(this.dataSource);
    // await employeeShiftsScript.createEmployeeShiftsTable(schemaName);


    // console.log('33');
    // const interviewsScript = new InterviewsScript(this.dataSource);
    // await interviewsScript.createInterviewsTable(schemaName);

    // console.log('34');
    // const jobOpeningsScript = new JobOpeningsScript(this.dataSource);
    // await jobOpeningsScript.createJobOpeningsTable(schemaName);

    // console.log('35');
    // const leavePoliciesScript = new LeavePoliciesScript(this.dataSource);
    // await leavePoliciesScript.createLeavePoliciesTable(schemaName);


    // console.log('36');
    // const organizationHolidaysScript = new OrganizationHolidaysScript(this.dataSource);
    // await organizationHolidaysScript.OrganizationHolidaysTable(schemaName);

    // console.log('37');
    // const shiftChangeRequestsScript = new ShiftChangeRequestsScript(this.dataSource);
    // await shiftChangeRequestsScript.createShiftChangeRequestsTable(schemaName);

    // console.log('38');
    // const leaveApplicationScript = new LeaveApplicationScript(this.dataSource);
    // await leaveApplicationScript.createLeaveApplicationTable(schemaName);

    // console.log('39');
    // const employeeFloaterLeaveScript = new EmployeeFloaterLeaveScript(this.dataSource);
    // await employeeFloaterLeaveScript.createEmployeeFloaterLeaveTable(schemaName);

    // console.log('40');
    // const usersBranchPermissionScript  = new UsersBranchPermissionScript (this.dataSource);
    // await usersBranchPermissionScript.createUsersBranchPermissionsTable(schemaName);
    // console.log('✅ organizational_profile table created in schema:', schemaName);

    // console.log('41');
    // const emergencycontactsScript = new EmergencyContactsScript(this.dataSource);
    // await emergencycontactsScript.createEmergencyContactsTable(schemaName);

    // console.log('42');
    // const familydetailsScript = new FamilyDetailsScript(this.dataSource);
    // await familydetailsScript.createFamilyDetailsTable(schemaName);

    // console.log('43');
    // const compoffRequestsScript = new CompOffRequestsScript(this.dataSource);
    // await compoffRequestsScript.createCompOffRequestsTable(schemaName);
    // // Fetch the plan associated with the subscription
    // const planRepo = this.dataSource.getRepository(Plan);
    // const plan = await planRepo.findOne({
    //   where: { plan_id: 2 }, // Adjust this if the plan_id is dynamic
    // });

    // if (!plan) {
    //   throw new BadRequestException({
    //     statusCode: 400,
    //     message: 'Plan not found.',
    //   });
    // }

    // // Calculate the renewal date based on the billing cycle
    // let renewalDate = new Date();
    // if (plan.billing_cycle === 'MONTHLY') {
    //   renewalDate.setMonth(renewalDate.getMonth() + 1);
    // } else if (plan.billing_cycle === 'YEARLY') {
    //   renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    // }

    // // Generate unique license_no and invoice_number
    // const licenseNo = `LIC-${uuidv4()}`;  // Example: LIC-4f4d1dce-8f36-4b66-9b12-0a8c57b3d681
    // const invoiceNumber = `INV-${uuidv4().split('-')[0]}`;  // Example: INV-4f4d1dce

    // // Subscription Entity update logic
    // const subscriptionRepo = this.dataSource.getRepository(Subscription);
    // const subscription = await subscriptionRepo.findOne({
    //   where: { organization_profile_id: user.organization.organization_id },
    // });

    // if (subscription) {
    //   // Subscription exists, update it

    //   const discountedPrice = plan.price - (plan.price * plan.discounted_percentage / 100);
    //   const grandTotal = discountedPrice; // Adjust for other charges as needed

    //   subscription.price = plan.price;
    //   subscription.payment_mode = 'TRAIL_USAGE';
    //   subscription.discounted_price = discountedPrice;
    //   subscription.discounted_percentage = plan.discounted_percentage;
    //   subscription.grand_total = grandTotal;
    //   subscription.payment_status = 'COMPLETED';
    //   subscription.start_date = new Date();
    //   subscription.renewal_date = renewalDate;
    //   subscription.license_no = licenseNo;  // Set the generated license_no
    //   subscription.invoice_number = invoiceNumber;  // Set the generated invoice_number

    //   await subscriptionRepo.save(subscription);
    // } else {
    //   // Create a new subscription if none exists
    //   const discountedPrice = plan.price - (plan.price * plan.discounted_percentage / 100);
    //   const grandTotal = discountedPrice; // Adjust for other charges as needed

    //   const newSubscription = subscriptionRepo.create({
    //     organization_profile_id: user.organization.organization_id,
    //     plan_id: plan.plan_id,
    //     payment_mode: 'TRAIL_USAGE',
    //     payment_status: 'COMPLETED',
    //     permissions_features: '{}',
    //     start_date: new Date(),
    //     renewal_date: renewalDate,
    //     price: plan.price,
    //     discounted_price: discountedPrice,
    //     discounted_percentage: plan.discounted_percentage,
    //     grand_total: grandTotal,
    //     license_no: licenseNo,  // Set the generated license_no
    //     invoice_number: invoiceNumber,  // Set the generated invoice_number
    //   });

    //   await subscriptionRepo.save(newSubscription);
    // }

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
