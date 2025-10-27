import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from "@nestjs/typeorm";
import { decrypt } from '../encryption_decryption/crypto-utils';
import { Request } from "express";

import { OrganizationalProfile } from 'src/organizational-profile/entity/organizational-profile.entity';
import { Subscription } from 'src/organization_register/entities/public_subscription.entity';

import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';

import { Branch } from 'src/organizational-profile/entity/branches.entity';
@Injectable()
export class OrganizationalProfileCommonData {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,


        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,

    ) { }



    async getOrganizationDetails(req: Request): Promise<{
        organizationName: string | null;
        loginUserId: number | null;
        organizationId: number;
    }> {
        try {
            const schemaName = req.cookies["x-organization-schema"];
            const organizationName = schemaName ? await decrypt(schemaName) : null;

            const createdBy = req.cookies.system_user_id;
            const loginUserId = createdBy ? Number(await decrypt(createdBy)) : null;

            const orgID = req.cookies.organization_id;
            const organizationId = orgID ? Number(await decrypt(orgID)) : null;

            if (!organizationId) {
                throw new BadRequestException("Organization ID is missing or invalid.");
            }

            return {
                organizationName, // Decrypted schema name
                loginUserId, // Decrypted user ID (Number)
                organizationId, // Decrypted organization ID (Number)
            };
        } catch (error) {
            throw new BadRequestException(`Error extracting organization details: ${error.message}`);
        }
    }



}

