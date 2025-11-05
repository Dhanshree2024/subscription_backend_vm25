import { Controller, Get, Post, Body, Param,
  Query,
  Res,
  HttpStatus,} from '@nestjs/common';
import { Response } from 'express';

import { ResellersService } from './resellers.service';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';

@Controller('reseller')
export class ResellersController {
  constructor(private readonly resellersService: ResellersService) {}


@Post('get-all-resellers')
async getAllResellers(@Res() res: Response, @Body() filters: any) {
  try {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const search = filters.search?.trim() || '';
    const status = filters.status || 'All';

    const { data, total } = await this.resellersService.getAllResellers(
      page,
      limit,
      search,
      status,
    );

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Fetched resellers successfully',
      total,
      page,
      limit,
      data,
    });
  } catch (error) {
    console.error('Error fetching resellers:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch resellers',
      total: 0,
      data: [],
    });
  }
}

  // ✅ Add new reseller
 @Post('add-reseller')
  async addReseller(@Body() dto: CreateResellerDto) {
    try {
      const result = await this.resellersService.create(dto);
      return {
        success: true,
        message: 'Reseller added successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error adding reseller:', error);
      return {
        success: false,
        message: error.message || 'Failed to add reseller',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  // ✅ Update reseller
  @Post('update-reseller/:id')
  async updateReseller(
    @Param('id') id: number,
    @Body() dto: UpdateResellerDto,
  ) {
    try {
      const result = await this.resellersService.update(id, dto);
      return {
        success: true,
        message: 'Reseller updated successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error updating reseller:', error);
      return {
        success: false,
        message: error.message || 'Failed to update reseller',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

    @Get('get-reseller/:id')
  async getResellerById(@Param('id') id: number, @Res() res: Response) {
    try {
      const reseller = await this.resellersService.getSingleReseller(id);

      if (!reseller) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Reseller not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Reseller fetched successfully',
        data: reseller,
      });
    } catch (error) {
      console.error('Error fetching reseller:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch reseller',
      });
    }
  }

    @Post('delete-reseller/:id')
  async softDeleteReseller(@Res() res: Response, @Param('id') id: number) {
    try {
      const result = await this.resellersService.deleteReseller(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Reseller deleted successfully (soft delete)',
        data: result,
      });
    } catch (error) {
      console.error('Error deleting reseller:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete reseller',
      });
    }
  }

  @Get('dropdown-resellers')
async getDropdownResellers(@Res() res: Response) {
  try {
    const result = await this.resellersService.getResellerDropdown();
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Reseller dropdown fetched successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching reseller dropdown:', error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch reseller dropdown',
    });
  }
}

}
