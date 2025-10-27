import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RegisterUserLogin } from '../organization_register/entities/register-user-login.entity';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';


@Injectable()
export class UserRepository extends Repository<RegisterUserLogin> {

  constructor(private dataSource: DataSource) {
    super(RegisterUserLogin, dataSource.createEntityManager());
  }

  async findByEmail(business_email: string): Promise<RegisterUserLogin> {
    return await this.findOne({
      where: { business_email },
      relations: ['organization'],
    });
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async findUserWithOrganizationSchema(email: string): Promise<RegisterUserLogin> {

    console.log(email);
    const user = await this.findOne({
      where: {
        business_email: email,
        verified: true // Add the verified condition
      },
      relations: ['organization'], // Fetch related organization
    });
    console.log('user', user);
    if (user) {
      return user;
    }
    return null;
  }

  async findUserWithEmail(email: string): Promise<RegisterUserLogin> {


    console.log('email', email);
    return this.findOne({
      where: {
        business_email: email, // Ensure this matches the entity
        verified: true, // Check if the user is verified
      },
      relations: ['organization'], // Include related organization details
    });
  }

  async findUserWithMobileNumber(identifier: string): Promise<RegisterUserLogin> {
    // return this.findOne({
    //   where: {
    //     phone_number: mobile_number, // Ensure this matches the entity
    //     verified: true, // Check if the user is verified
    //   },
    //   relations: ['organization'], // Include related organization details
    // });
    return await this.createQueryBuilder('user_register_login')
      .leftJoinAndSelect('user_register_login.organization', 'organization')
      .where('user_register_login.users_business_email = :identifier OR user_register_login.phone_number = :identifier', { identifier })
      .getOne();
  }


  async findById(userId: number): Promise<RegisterUserLogin> {
    return await this.findOne({
      where: { user_id: userId },
    });
  }


}
