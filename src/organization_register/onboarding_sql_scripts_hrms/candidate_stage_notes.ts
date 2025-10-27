import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class CandidateStageNotesScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createCandidateStageNotesTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.candidate_stage_notes (
                id SERIAL PRIMARY KEY, -- Auto-incrementing primary key                
                user_id integer NOT NULL,
                status_id integer NOT NULL,
                notes text[] COLLATE pg_catalog."default" DEFAULT '{}'::text[],
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                created_by integer,
                created_at timestamp without time zone DEFAULT now(),
                candidate_id integer,
                candidate_note_id integer,
                CONSTRAINT candidate_stage_notes_created_by_fkey FOREIGN KEY (created_by)
                    REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION,
                CONSTRAINT candidate_stage_notes_status_id_fkey FOREIGN KEY (status_id)
                    REFERENCES ${schemaName}.hiring_status (status_id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION,
                CONSTRAINT candidate_stage_notes_user_id_fkey FOREIGN KEY (user_id)
                    REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION

            
                );

        `);
    }
}