export class OrganizationalProfileWithUserDto {
    organization_profile_id: number;
    org_name: string;
    industry_type_id: number;
    organization_location_name: string;
    organization_address: string;
    city: string;
    pincode: number;
    state: string;
    country: string;
    mobile_number: string;
    org_alt_contact_number: string;
    base_currency: string;
    financial_year: string;
    time_zone: string;
    website_url: string;
    gst_no: string;
    report_basis: string;
    tenant_org_id: number;
    created_at: Date;
    updated_at: Date;
    primary_user: {
      user_id: number;
      first_name: string;
      last_name: string;
      business_email: string;
      phone_number: string;
    };
  }
  