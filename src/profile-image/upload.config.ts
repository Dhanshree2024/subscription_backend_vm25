// src/upload/upload.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

export const generateSimpleStorage = (type: 'user' | 'company') => {
  return diskStorage({
    destination: (req, file, cb) => {
      // Get and sanitize organization name from body or cookies
      const rawOrgName = req.body.org || req.cookies?.organization_name || 'default-org';
      const safeOrgName = rawOrgName.replace(/[^a-zA-Z0-9_-]/g, '');
      const folder = `uploads/${safeOrgName}`;

      fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },

    filename: (req, file, cb) => {
      const ext = extname(file.originalname);
      const date = new Date().toISOString().split('T')[0];

      // Fallbacks and sanitization
      const rawOrgName = req.body.org || req.cookies?.organization_name || 'org';
      const orgName = rawOrgName.replace(/[^a-zA-Z0-9_-]/g, '');

      const userId = req.body.userId || '0000';
      const username = req.body.username || 'user';
      const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');

      let filename = '';

      if (type === 'company') {
        // ✅ For organization: org-{orgName}-{date}.{ext}
        filename = `org-${orgName}-${date}${ext}`;
      } else {
        // ✅ For user: user-{userId}-{username}-{date}.{ext}
        filename = `user-${userId}-${safeUsername}-${date}${ext}`;
      }

      cb(null, filename);
    },
  });
};

export const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
