import multer from 'multer';
import { RequestHandler } from 'express';
import { BadRequestError } from '../lib/app-error.ts';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

const MAX_PROFILE_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const PROFILE_IMAGE_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'profile');
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

fs.mkdirSync(PROFILE_IMAGE_UPLOAD_DIR, { recursive: true });

const sanitizeFileName = (fileName: string): string => {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
};

const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: PROFILE_IMAGE_UPLOAD_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${randomUUID()}-${sanitizeFileName(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(new BadRequestError('Profile picture must be a JPG, PNG, or WebP image.'));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: MAX_PROFILE_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

export const toProfileImageUrl = (fileName: string): string => {
  return `/uploads/profile/${fileName}`;
};

export const resolveProfileImagePath = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl?.startsWith('/uploads/profile/')) {
    return null;
  }

  const fileName = path.basename(imageUrl);
  const filePath = path.resolve(PROFILE_IMAGE_UPLOAD_DIR, fileName);

  if (!filePath.startsWith(`${PROFILE_IMAGE_UPLOAD_DIR}${path.sep}`)) {
    return null;
  }

  return filePath;
};

export const deleteProfileImageFile = async (imageUrl: string | null | undefined): Promise<void> => {
  const filePath = resolveProfileImagePath(imageUrl);

  if (!filePath) {
    return;
  }

  await fs.promises.rm(filePath, { force: true });
};

export const profileImageUploadMiddleware: RequestHandler = (req, res, next) => {
  profileImageUpload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('Profile picture cannot be greater than 2 MB.'));
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new BadRequestError('Upload exactly one image file using the image field.'));
      }
    }

    return next(error);
  });
};
