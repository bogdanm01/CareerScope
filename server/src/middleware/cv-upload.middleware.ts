import multer from 'multer';
import { RequestHandler } from 'express';
import { BadRequestError } from '../lib/app-error.ts';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

const MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CV_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'cv');

fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });

const sanitizeFileName = (fileName: string): string => {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
};

const cvUpload = multer({
  storage: multer.diskStorage({
    destination: CV_UPLOAD_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${randomUUID()}-${sanitizeFileName(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new BadRequestError('CV file must be a PDF.'));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: MAX_CV_FILE_SIZE_BYTES,
    files: 1,
  },
});

export const toCvUrl = (fileName: string): string => {
  return `/uploads/cv/${fileName}`;
};

export const resolveCvFilePath = (cvUrl: string | null | undefined): string | null => {
  if (!cvUrl?.startsWith('/uploads/cv/')) {
    return null;
  }

  const fileName = path.basename(cvUrl);
  const filePath = path.resolve(CV_UPLOAD_DIR, fileName);

  if (!filePath.startsWith(`${CV_UPLOAD_DIR}${path.sep}`)) {
    return null;
  }

  return filePath;
};

export const deleteCvFile = async (cvUrl: string | null | undefined): Promise<void> => {
  const filePath = resolveCvFilePath(cvUrl);

  if (!filePath) {
    return;
  }

  await fs.promises.rm(filePath, { force: true });
};

export const cvUploadMiddleware: RequestHandler = (req, res, next) => {
  cvUpload.single('cv')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('CV file size cannot be greater than 5 MB.'));
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new BadRequestError('Upload exactly one PDF file using the cv field.'));
      }
    }

    return next(error);
  });
};
