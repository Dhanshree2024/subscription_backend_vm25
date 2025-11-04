import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class otherSettingsOrgScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Create other_settings_org table if not exists
     */
    async createOtherSettingsOrgTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.other_settings_org
      (
          org_settings_id SERIAL PRIMARY KEY,
          settings JSONB,
          is_current BOOLEAN DEFAULT true,
          created_by INTEGER,
          updated_by INTEGER,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITHOUT TIME ZONE,
          org_id INTEGER,
          CONSTRAINT ${schemaName}_other_settings_org_is_current_check CHECK (is_current IN (true, false))
      );
    `);
    }

    /**
     * Insert organization-level settings
     */
    async insertOtherSettingsOrg(
        schemaName: string,
        orgSettings: {
            settings?: Record<string, any>;
            is_current?: boolean;
            created_by?: number;
            updated_by?: number;
            org_id?: number;
        }[],
    ): Promise<void> {
        const insertQuery = `
      INSERT INTO ${schemaName}.other_settings_org
      (
        settings,
        is_current,
        created_by,
        updated_by,
        org_id
      )
      VALUES ($1, $2, $3, $4, $5);
    `;

        await Promise.all(
            orgSettings.map((s) =>
                this.dataSource.query(insertQuery, [
                    s.settings ? JSON.stringify(s.settings) : null,
                    s.is_current ?? true,
                    s.created_by || null,
                    s.updated_by || null,
                    s.org_id || null,
                ]),
            ),
        );
    }
}
