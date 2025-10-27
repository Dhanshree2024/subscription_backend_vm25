import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailConfig } from './entities/email-config.entity';

@Injectable()
export class MailConfigService {
  constructor(
    @InjectRepository(MailConfig)
    private readonly mailConfigRepository: Repository<MailConfig>,
  ) {}

  async getMailConfig(): Promise<MailConfig | null> {
    return this.mailConfigRepository.findOne({
      where: { isActive: 1 },
      order: { createdAt: 'DESC' },
    });
  }
}
