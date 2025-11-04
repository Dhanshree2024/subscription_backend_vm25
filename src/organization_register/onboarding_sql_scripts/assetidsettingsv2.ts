import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class assetIdSettingsScript {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Create asset_id_settings_v2 table and insert initial templates
   */
  async createAssetIdSettingsV2Table(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_id_settings_v2
      (
          id SERIAL PRIMARY KEY,
          prefix VARCHAR(25) DEFAULT 'ASSET',
          suffix VARCHAR(25) DEFAULT '',
          starting_number INTEGER DEFAULT 1,
          next_number INTEGER DEFAULT 1,
          sequence_length INTEGER DEFAULT 6,
          separator TEXT NOT NULL DEFAULT '-',
          reset_sequence TEXT DEFAULT 'never',
          include_year BOOLEAN DEFAULT false,
          include_date BOOLEAN DEFAULT false,
          date_format TEXT DEFAULT 'DDMMYY',
          include_branch BOOLEAN DEFAULT false,
          branch_source TEXT DEFAULT 'CODE',
          branch_length INTEGER,
          include_department BOOLEAN DEFAULT false,
          department_source TEXT DEFAULT 'CODE',
          department_length INTEGER,
          include_category BOOLEAN DEFAULT false,
          category_source TEXT DEFAULT 'CODE',
          category_length INTEGER,
          include_sub_category BOOLEAN DEFAULT false,
          sub_category_source TEXT DEFAULT 'CODE',
          sub_category_length INTEGER,
          include_item BOOLEAN DEFAULT false,
          item_source TEXT DEFAULT 'CODE',
          item_length INTEGER,
          scope TEXT DEFAULT 'Global',
          word_case TEXT DEFAULT 'upper',
          max_length INTEGER DEFAULT 25,
          user_input BOOLEAN DEFAULT false,
          applied_template_id INTEGER,
          created_by INTEGER NOT NULL,
          updated_by INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE,
          qr_code_settings JSON,
          is_current BOOLEAN DEFAULT true,
          org_id INTEGER,
          label character varying(30) COLLATE pg_catalog."default",
          CONSTRAINT asset_id_settings_v2_branch_source_check CHECK (branch_source IN ('CODE','NAME')),
          CONSTRAINT asset_id_settings_v2_category_source_check CHECK (category_source IN ('CODE','NAME')),
          CONSTRAINT asset_id_settings_v2_date_format_check CHECK (date_format IN ('DDMMYY','YYYYMMDD','YYMM','YYYY','YY','None')),
          CONSTRAINT asset_id_settings_v2_department_source_check CHECK (department_source IN ('CODE','NAME')),
          CONSTRAINT asset_id_settings_v2_item_source_check CHECK (item_source IN ('CODE','NAME')),
          CONSTRAINT asset_id_settings_v2_reset_sequence_check CHECK (reset_sequence IN ('never','yearly','monthly')),
          CONSTRAINT asset_id_settings_v2_scope_check CHECK (scope IN ('Global','Branch','Department')),
          CONSTRAINT asset_id_settings_v2_sub_category_source_check CHECK (sub_category_source IN ('CODE','NAME')),
          CONSTRAINT asset_id_settings_v2_word_case_check CHECK (word_case IN ('upper','lower','mixed'))
      );
    `);

    // 2️⃣ Check if table is empty
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ${schemaName}.asset_id_settings_v2`
    );
    const count = parseInt(countResult[0].count, 10);

    if (count === 0) {
      const templates = [
        // --- Default Template ---
        {
          label: 'Default Template',
          prefix: 'ASSET',
          starting_number: 1,
          next_number: 1,
          sequence_length: 8,
          separator: '-',
          reset_sequence: 'never',
          include_year: false,
          include_date: false,
          date_format: 'DDMMYY',
          include_branch: false,
          branch_source: 'CODE',
          include_department: false,
          department_source: 'CODE',
          include_category: false,
          category_source: 'CODE',
          include_sub_category: false,
          sub_category_source: 'CODE',
          include_item: false,
          item_source: 'CODE',
          scope: 'Global',
          word_case: 'upper',
          max_length: 14,
          created_by: 1,
          updated_by: 1,
          is_current: true,
        },
        // --- Year Template ---
        {
          label: 'Year',
          prefix: 'AST',
          starting_number: 1,
          next_number: 1,
          sequence_length: 3,
          separator: '-',
          reset_sequence: 'never',
          include_year: true,
          include_date: false,
          date_format: 'YYYY',
          include_branch: false,
          branch_source: 'CODE',
          include_department: false,
          department_source: 'CODE',
          include_category: false,
          category_source: 'CODE',
          include_sub_category: false,
          sub_category_source: 'CODE',
          include_item: false,
          item_source: 'CODE',
          scope: 'Global',
          word_case: 'upper',
          max_length: 25,
          created_by: 1,
          updated_by: 1,
          is_current: false,
        },
        // --- Department Template ---
        {
          label: 'Department',
          prefix: 'DEV',
          starting_number: 1,
          next_number: 1,
          sequence_length: 3,
          separator: '-',
          reset_sequence: 'never',
          include_year: false,
          include_date: false,
          date_format: 'DDMMYY',
          include_branch: false,
          branch_source: 'CODE',
          include_department: true,
          department_source: 'CODE',
          include_category: false,
          category_source: 'CODE',
          include_sub_category: false,
          sub_category_source: 'CODE',
          include_item: false,
          item_source: 'CODE',
          scope: 'Global',
          word_case: 'upper',
          max_length: 23,
          created_by: 1,
          updated_by: 1,
          is_current: false,
        },
        // --- Item Template ---
        {
          label: 'Item',
          prefix: '',
          starting_number: 1,
          next_number: 1,
          sequence_length: 3,
          separator: '-',
          reset_sequence: 'never',
          include_year: false,
          include_date: false,
          date_format: 'DDMMYY',
          include_branch: false,
          branch_source: 'CODE',
          include_department: false,
          department_source: 'CODE',
          include_category: false,
          category_source: 'CODE',
          include_sub_category: false,
          sub_category_source: 'CODE',
          include_item: true,
          item_source: 'CODE',
          scope: 'Global',
          word_case: 'upper',
          max_length: 25,
          created_by: 1,
          updated_by: 1,
          is_current: false,
        },
        // --- Branch Template ---
        {
          label: 'Branch',
          prefix: '',
          starting_number: 1,
          next_number: 1,
          sequence_length: 3,
          separator: '-',
          reset_sequence: 'never',
          include_year: false,
          include_date: false,
          date_format: 'DDMMYY',
          include_branch: true,
          branch_source: 'CODE',
          include_department: false,
          department_source: 'CODE',
          include_category: false,
          category_source: 'CODE',
          include_sub_category: false,
          sub_category_source: 'CODE',
          include_item: false,
          item_source: 'CODE',
          scope: 'Global',
          word_case: 'upper',
          max_length: 25,
          created_by: 1,
          updated_by: 1,
          is_current: false,
        },
      ];

      await this.insertAssetIdSettings(schemaName, templates);
    }
  }

  /**
   * Generic insert helper
   */
  async insertAssetIdSettings(
    schemaName: string,
    settings: any[]
  ): Promise<void> {
    const insertQuery = `
      INSERT INTO ${schemaName}.asset_id_settings_v2
      (
        label, prefix, suffix, starting_number, next_number, sequence_length,
        separator, reset_sequence, include_year, include_date, date_format,
        include_branch, branch_source, include_department, department_source,
        include_category, category_source, include_sub_category, sub_category_source,
        include_item, item_source, scope, word_case, max_length,
        created_by, updated_by, is_current
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,
        $20,$21,$22,$23,$24,
        $25,$26,$27
      );
    `;

    for (const s of settings) {
      await this.dataSource.query(insertQuery, [
        s.label,
        s.prefix,
        s.suffix || '',
        s.starting_number,
        s.next_number,
        s.sequence_length,
        s.separator,
        s.reset_sequence,
        s.include_year,
        s.include_date,
        s.date_format,
        s.include_branch,
        s.branch_source,
        s.include_department,
        s.department_source,
        s.include_category,
        s.category_source,
        s.include_sub_category,
        s.sub_category_source,
        s.include_item,
        s.item_source,
        s.scope,
        s.word_case,
        s.max_length,
        s.created_by,
        s.updated_by,
        s.is_current,
      ]);
    }
  }
}
