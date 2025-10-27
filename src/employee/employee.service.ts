import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(private readonly dataSource: DataSource) {}

  // Fetch user details (excluding password)
  async fetchEmployees() {
    try {
      // Query to fetch user details except the password
      const query = `
        SELECT 
          user_id, 
          first_name, 
          last_name, 
          business_email, 
          phone_number, 
          organization_id
        FROM 
          org_tcs.users;
      `;
      const users = await this.dataSource.query(query);

      return users;
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch user details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
