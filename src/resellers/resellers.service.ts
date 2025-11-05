import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Like  } from 'typeorm';
import { Reseller } from './entity/reseller.entity';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';

@Injectable()
export class ResellersService {
  constructor(
    @InjectRepository(Reseller)
    private resellerRepo: Repository<Reseller>,
  ) {}

    async getAllResellers(
    page: number,
    limit: number,
    search: string,
    status: 'All' | 'Active' | 'Inactive',
  ): Promise<{ data: Reseller[]; total: number }> {
    try {
      const qb = this.resellerRepo.createQueryBuilder('reseller');

      qb.where('reseller.is_deleted = :deleted', { deleted: false });

      // 🔹 Apply status filter
      if (status === 'Active') {
        qb.andWhere('reseller.is_active = :active', { active: true });
      } else if (status === 'Inactive') {
        qb.andWhere('reseller.is_active = :active', { active: false });
      }

      // 🔹 Apply search
      if (search) {
        qb.andWhere(
          '(LOWER(reseller.company_name) LIKE :search OR LOWER(reseller.primary_contact_first_name) LIKE :search OR LOWER(reseller.primary_contact_last_name) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      // 🔹 Pagination
      qb.skip((page - 1) * limit).take(limit);
      qb.orderBy('reseller.reseller_id', 'ASC');

      const [data, total] = await qb.getManyAndCount();

      return { data, total };
    } catch (error) {
      console.error('Error fetching resellers:', error);
      throw new Error('Failed to fetch resellers');
    }
  }

// ✅ Create new reseller
async create(dto: CreateResellerDto): Promise<Reseller> {
  const reseller = this.resellerRepo.create({
    reseller_name: dto.reseller_name,
    contact_first_name: dto.contact_first_name,
    contact_last_name: dto.contact_last_name,
    email: dto.email,
    phone_number: dto.phone_number,
    industry_id: dto.industry_id ?? null,
    payment_term: dto.payment_term ?? null,
    gst_registered: dto.gst_registered ?? false,
    gst_number: dto.gst_number ?? null,
    is_active: dto.is_active ?? true,
    is_deleted: dto.is_deleted ?? false,
  });

  return await this.resellerRepo.save(reseller);
}

// ✏️ Update existing reseller
async update(id: number, dto: UpdateResellerDto): Promise<Reseller> {
  const reseller = await this.resellerRepo.findOneBy({ reseller_id: id });
  if (!reseller) {
    throw new Error('Reseller not found');
  }

  reseller.reseller_name = dto.reseller_name ?? reseller.reseller_name;
  reseller.contact_first_name = dto.contact_first_name ?? reseller.contact_first_name;
  reseller.contact_last_name = dto.contact_last_name ?? reseller.contact_last_name;
  reseller.email = dto.email ?? reseller.email;
  reseller.phone_number = dto.phone_number ?? reseller.phone_number;
  reseller.is_active = dto.is_active ?? reseller.is_active;
  reseller.is_deleted = dto.is_deleted ?? reseller.is_deleted;
  reseller.industry_id = dto.industry_id ?? reseller.industry_id;
  reseller.payment_term = dto.payment_term ?? reseller.payment_term;
  reseller.gst_registered = dto.gst_registered ?? reseller.gst_registered;
  reseller.gst_number = dto.gst_number ?? reseller.gst_number;

  return await this.resellerRepo.save(reseller);
}


  async getSingleReseller(id: number): Promise<Reseller | null> {
    return await this.resellerRepo.findOne({
      where: { reseller_id: id, is_deleted: false },
      relations: ['industry'],
    });
  }

   async deleteReseller(id: number): Promise<Reseller> {
    const reseller = await this.resellerRepo.findOneBy({ reseller_id: id });

    if (!reseller) {
      throw new Error('Reseller not found');
    }

    reseller.is_active = false;
    reseller.is_deleted = true;

    return await this.resellerRepo.save(reseller);
  }

async getResellerDropdown(): Promise<{ reseller_id: number; reseller_name: string }[]> {
  const data = await this.resellerRepo.find({
    select: ['reseller_id', 'reseller_name'],
    where: { is_deleted: false },
    order: { reseller_name: 'ASC' },
  });
  console.log('🔍 Reseller DB result:', data);
  return data;
}


}
