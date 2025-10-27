
import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class LicenceTypesScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }


  async createLicenceTypesTable(schemaName: string): Promise<void> {

    await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.item_licence_type
            (
                licence_id SERIAL PRIMARY KEY,
                is_active integer NOT NULL DEFAULT 1,
                is_delete integer NOT NULL DEFAULT 0,
                licence_key_type boolean NOT NULL DEFAULT true,
                licence_type character varying(100) COLLATE pg_catalog."default",
                needs_license_key boolean DEFAULT true,
                bulk_license boolean DEFAULT false,
                needs_start_date boolean DEFAULT false,
                needs_end_date boolean DEFAULT false,
                is_renewable boolean DEFAULT false,
                has_expiry boolean DEFAULT false,
                show_in_stock_form boolean DEFAULT true,
                have_plan_type boolean DEFAULT false
            )
        `);
  }

     async insertLicenceTypeTable(
  schemaName: string,
        licenceTypes: { licence_type: string, licence_key_type: boolean }[]
): Promise<void> {
        const licenceTypeInsertQuery = `
          INSERT INTO ${schemaName}.item_licence_type(licence_type, licence_key_type)
          VALUES ($1, $2);
  `;

  await Promise.all(
          licenceTypes.map(licenceType => {
            return this.dataSource.query(licenceTypeInsertQuery, [
              licenceType.licence_type,
              licenceType.licence_key_type
            ]);
          })
  );
}



}