import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class qrCodeSettingsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Create qr_code_settings table if not exists
     */
    async createQrCodeSettingsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.qr_code_settings
      (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          is_current BOOLEAN DEFAULT true,
          created_by INTEGER NOT NULL,
          updated_by INTEGER,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITHOUT TIME ZONE,
          asset_id_setting_id INTEGER,
          org_id INTEGER,
          CONSTRAINT qr_code_settings_v2_is_current_check CHECK (is_current IN (true, false))
      );
    `);
    }

    /**
     * Insert QR code settings records
     */
    async insertQrCodeSettings(
        schemaName: string,
        qrSettings: {
            settings: Record<string, any>;
            is_current?: boolean;
            created_by: number;
            updated_by?: number;
            asset_id_setting_id?: number;
            org_id?: number;
        }[],
    ): Promise<void> {
        const insertQuery = `
      INSERT INTO ${schemaName}.qr_code_settings
      (
        settings,
        is_current,
        created_by,
        updated_by,
        asset_id_setting_id,
        org_id
      )
      VALUES ($1, $2, $3, $4, $5, $6);
    `;

        await Promise.all(
            qrSettings.map((qr) =>
                this.dataSource.query(insertQuery, [
                    JSON.stringify(qr.settings),
                    qr.is_current ?? true,
                    qr.created_by,
                    qr.updated_by || null,
                    qr.asset_id_setting_id || null,
                    qr.org_id || null,
                ]),
            ),
        );
    }
}
