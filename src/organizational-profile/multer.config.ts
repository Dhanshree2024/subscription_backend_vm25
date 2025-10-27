// src/utils/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { decrypt } from 'src/common/encryption_decryption/crypto-utils';

export const multerStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {

    const orgId = decrypt(req.cookies.organization_id);
    const timestamp = Date.now();
    const ext = extname(file.originalname);
    const filename = `org-${orgId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Accepted MIME types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];

export const multerOptions = {
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only jpg, png, svg files are allowed'), false);
    }
    cb(null, true);
  },
};
