import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LeavePoliciesScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async createLeavePoliciesTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
        
            CREATE TABLE IF NOT EXISTS ${schemaName}.leave_policies (
                policy_id SERIAL PRIMARY KEY,
                policy_name character varying(150) COLLATE pg_catalog."default",
                leave_type_id integer NOT NULL,
                leave_accrual jsonb NOT NULL,
                leave_rules jsonb NOT NULL,
                leave_proof jsonb DEFAULT '{}'::jsonb,
                leave_eligibility jsonb DEFAULT '{}'::jsonb,
                sandwich_leave_rule jsonb DEFAULT '{}'::jsonb,
                blackout_period jsonb DEFAULT '{}'::jsonb,
                carry_forward_details jsonb DEFAULT '{}'::jsonb,
                policy_version integer DEFAULT 1,
                valid_from date NOT NULL,
                expires_on date,
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                created_by integer,
                created_at timestamp without time zone DEFAULT now(),
                updated_at timestamp without time zone DEFAULT now(),
                CONSTRAINT leave_policies_created_by_fkey2 FOREIGN KEY (created_by)
                    REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                CONSTRAINT leave_policies_leave_type_id_fkey2 FOREIGN KEY (leave_type_id)
                    REFERENCES ${schemaName}.leave_types (leave_type_id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
               
            );
      `);
      // ✅ Insert default policies for LOP, SL, CL
      const leaveTypes = await this.dataSource.query(`
        SELECT leave_type_id, short_code FROM ${schemaName}.leave_types
        WHERE short_code IN ('CL', 'SL', 'LOP');
      `);

      for (const leaveType of leaveTypes) {
        const isLOP = leaveType.short_code === 'LOP';
        const isFloater = leaveType.short_code === 'FL';

        const accrualValue = isLOP ? '30' : isFloater ? '2' : '6';
        const accrualCredit = accrualValue;
        const leaveAccrualJson = {
          creditDay: '1',
          accrualType: 'Year',
          creditMonth: 'January',
          accrualValue,
          accrualCredit,
          accrualFrequency: 'Yearly',
          startAccrualAfterJoining: '1'
        };

        const policyName = `${leaveType.short_code} Default Policy`;

        await this.dataSource.query(
          `
          INSERT INTO ${schemaName}.leave_policies (
            policy_name,
            leave_type_id,
            leave_accrual,
            leave_rules,
            valid_from,
            is_active,
            is_deleted,
            created_by
          )
          VALUES (
            $1, $2, $3, $4, CURRENT_DATE, true, false, $5
          )
          ON CONFLICT DO NOTHING;
        `,
          [
            policyName,
            leaveType.leave_type_id,
            JSON.stringify(leaveAccrualJson),
            JSON.stringify({}), // leave_rules placeholder
            1 // system user ID
          ]
        );
      }
            console.log(`Table ${schemaName}.leave_policies created successfully.`);

        } catch (error) {
            console.error(`Error creating leave_policies table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create leave_policies table in schema ${schemaName}.`);
        }
    }
}
