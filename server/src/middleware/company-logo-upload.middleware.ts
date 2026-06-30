import multer from 'multer';
import { RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../lib/app-error.ts';

const MAX_COMPANY_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const COMPANY_LOGO_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'company-logos');
const ALLOWED_COMPANY_LOGO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

fs.mkdirSync(COMPANY_LOGO_UPLOAD_DIR, { recursive: true });

const sanitizeFileName = (fileName: string): string => {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
};

const companyLogoUpload = multer({
  storage: multer.diskStorage({
    destination: COMPANY_LOGO_UPLOAD_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${randomUUID()}-${sanitizeFileName(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_COMPANY_LOGO_MIME_TYPES.has(file.mimetype)) {
      return cb(new BadRequestError('Company logo must be a JPG, PNG, WebP, or SVG image.'));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: MAX_COMPANY_LOGO_SIZE_BYTES,
    files: 1,
  },
});

export const toCompanyLogoUrl = (fileName: string): string => {
  return `/uploads/company-logos/${fileName}`;
};

export const resolveCompanyLogoPath = (logoUrl: string | null | undefined): string | null => {
  if (!logoUrl?.startsWith('/uploads/company-logos/')) {
    return null;
  }

  const fileName = path.basename(logoUrl);
  const filePath = path.resolve(COMPANY_LOGO_UPLOAD_DIR, fileName);

  if (!filePath.startsWith(`${COMPANY_LOGO_UPLOAD_DIR}${path.sep}`)) {
    return null;
  }

  return filePath;
};

export const deleteCompanyLogoFile = async (logoUrl: string | null | undefined): Promise<void> => {
  const filePath = resolveCompanyLogoPath(logoUrl);

  if (!filePath) {
    return;
  }

  await fs.promises.rm(filePath, { force: true });
};

export const companyLogoUploadMiddleware: RequestHandler = (req, res, next) => {
  companyLogoUpload.single('logo')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('Company logo cannot be greater than 2 MB.'));
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new BadRequestError('Upload exactly one image file using the logo field.'));
      }
    }

    return next(error);
  });
};
