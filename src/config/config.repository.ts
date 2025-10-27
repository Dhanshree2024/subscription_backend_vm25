import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Config } from './config.entity';

@Injectable()
export class ConfigRepository extends Repository<Config> {
  constructor(private readonly dataSource: DataSource) {
    super(Config, dataSource.createEntityManager());
  }

  async getJwtSecret(): Promise<string> {
    const config = await this.findOne({ where: { id: 1 } });
    if (!config) {
      throw new Error('JWT_SECRET not found in the database');
    }
    return config.value;
  }

  // async findByKey(): Promise<string> {
  //   const config = await this.findOne({ key: 'JWT_SECRET'});
  //   return config ? config.value : null;
  // }
}
