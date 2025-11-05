import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reseller } from './entity/reseller.entity';
import { ResellersService } from './resellers.service';
import { ResellersController } from './resellers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reseller])],
  controllers: [ResellersController],
  providers: [ResellersService],
})
export class ResellersModule {}
