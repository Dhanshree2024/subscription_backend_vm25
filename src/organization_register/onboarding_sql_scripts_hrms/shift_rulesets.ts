import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class ShiftRulesetsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createShiftRulesetsable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.shift_rulesets (
                shift_rulesets_id SERIAL PRIMARY KEY, -- Unique shift ID
                schedule_type integer NOT NULL,
                applicable_shifts jsonb,
                rotation_frequency character varying(20) COLLATE pg_catalog."default",
                start_date date,
                end_date date,
                weekly_off_count integer DEFAULT 0,
                weekly_off_days text[] COLLATE pg_catalog."default",
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                rule_name character varying COLLATE pg_catalog."default",
                is_temporary boolean DEFAULT false
            );

        `);
        const result = await this.dataSource.query(`
            SELECT shift_id, shifts_setup_name
            FROM ${schemaName}.shifts_setup
            WHERE shifts_setup_name = 'General Shift'
          `);
        // ✅ Insert default rule for "General Shift"
        if (result.length > 0) {
            await this.dataSource.query(`
              INSERT INTO ${schemaName}.shift_rulesets (
                schedule_type,
                applicable_shifts,
                rotation_frequency,
                start_date,
                end_date,
                weekly_off_count,
                weekly_off_days,
                rule_name,
                is_temporary
              )
              VALUES (
                1,
                $1,
                'None',
                CURRENT_DATE,
                NULL,
                1,
                ARRAY['Sunday'],
                'Default General RuleSet',
                false
              )
              ON CONFLICT DO NOTHING;
            `,  [
              JSON.stringify(
                result.map((row, index) => ({
                  label: row.shifts_setup_name,
                  value: row.shift_id,
                  preference: index + 1 // or hardcode 1 if only one
                }))
              )
            ]);
          }
      }
}
