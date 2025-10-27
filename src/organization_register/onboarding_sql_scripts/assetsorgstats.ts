import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class orgStatsScriptScript {
    
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }
    
    
    async createOrgStatsScriptTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.org_stats
            (
                id SERIAL PRIMARY KEY,
                metric character varying(50) COLLATE pg_catalog."default",
                value integer,
                recorded_at timestamp without time zone DEFAULT now()
               
            )
    `);
    }

    async insertOrgStats(
        schemaName: string,
        stats: {
            metric: string;
            value: number;
            recorded_at?: Date;
        }[]
    ): Promise<void> {
        const statsInsertQuery = `
      INSERT INTO ${schemaName}.org_stats
      (
        metric,
        value,
        recorded_at
      )
      VALUES ($1, $2, $3);
    `;

        await Promise.all(
            stats.map(stat =>
                this.dataSource.query(statsInsertQuery, [
                    stat.metric,
                    stat.value,
                    stat.recorded_at || new Date(),
                ])
            )
        );
    }
}

