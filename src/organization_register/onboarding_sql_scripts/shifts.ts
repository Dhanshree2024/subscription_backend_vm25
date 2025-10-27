import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class ShiftsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createShiftsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.shifts (
                shift_id SERIAL PRIMARY KEY, -- Unique shift ID
                shift_name VARCHAR(255) NOT NULL, -- Name of the shift (e.g., Morning, Evening)
                start_time TIME NOT NULL, -- Shift start time
                end_time TIME NOT NULL, -- Shift end time
                break_time INTERVAL, -- Break time duration
                timezone VARCHAR(50), -- Timezone for the shift (e.g., 'UTC', 'EST', etc.)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Mark shift as active
                is_delete BOOLEAN DEFAULT FALSE -- Mark shift as deleted
            );

        `);
    }
}