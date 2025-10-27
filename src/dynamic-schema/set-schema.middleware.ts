// set-schema.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from './database.service'; // Import the DatabaseService
import { exit } from 'process';
import { encrypt, decrypt } from '../common/encryption_decryption/crypto-utils'; // Import encryption utility

@Injectable()
export class SetSchemaMiddleware implements NestMiddleware {
  constructor(private readonly databaseService: DatabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const schemaName = req.cookies['x-organization-schema']; // Extract schema name from cookies
    // const encryptedschemaName = decrypt(schemaName);

    if (schemaName) {
      try {
        // Decrypt the schema name only if it exists
        const decryptedSchemaName = decrypt(schemaName);
  
        if (decryptedSchemaName) {
          const fullSchemaName = `org_${decryptedSchemaName}`; // Prefix 'org_' to the schema name
          await this.databaseService.setSchema(fullSchemaName); // Set the schema using DatabaseService
        }
        
      } catch (error) {
        console.error('Error decrypting schema name:', error.message);
        // Optionally, you can handle the error (e.g., log, throw, or set a default schema)
      }
    }

    next(); // Proceed with the next middleware or route handler
  }
}
