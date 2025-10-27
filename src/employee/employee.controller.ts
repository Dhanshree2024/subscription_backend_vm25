import { Controller, Get, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('fetch-all-employees')
  @UseGuards(ApiKeyGuard, JwtAuthGuard) // Protect endpoint with API key guard
  async getEmployees() {
    try {
      // Call the service method to fetch user details
      return await this.employeeService.fetchEmployees();
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
