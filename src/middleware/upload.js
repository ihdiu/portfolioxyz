import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_MIMES = ['application/pdf'];

const fileFilter = (req, file, cb) => {
  const isImage = ALLOWED_IMAGE_MIMES.includes(file.mimetype);
  const isPdf = ALLOWED_DOC_MIMES.includes(file.mimetype) && file.fieldname === 'resume_file';

  // SVG is explicitly forbidden
  if (file.mimetype.includes('svg') || path.extname(file.originalname).toLowerCase() === '.svg') {
    return cb(new Error('SVG files are not permitted for security reasons.'), false);
  }

  if (isImage || isPdf) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP (and PDF for resume).`), false);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter,
});

/**
 * Process an uploaded image buffer and save as WebP
 * @param {Buffer} buffer 
 * @param {Object} options - { maxWidth: 1200, quality: 85 }
 * @returns {Promise<string>} web path (e.g. /uploads/abc123xyz.webp)
 */
export async function saveProcessedImage(buffer, options = {}) {
  const { maxWidth = 1200, quality = 85 } = options;
  const filename = `${crypto.randomUUID()}.webp`;
  const targetPath = path.join(uploadsDir, filename);

  await sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(targetPath);

  return `/uploads/${filename}`;
}

/**
 * Save an uploaded PDF buffer directly
 * @param {Buffer} buffer 
 * @returns {Promise<string>} web path
 */
export async function saveDocument(buffer) {
  const filename = `${crypto.randomUUID()}.pdf`;
  const targetPath = path.join(uploadsDir, filename);
  await fs.writeFile(targetPath, buffer);
  return `/uploads/${filename}`;
}

export default { upload, saveProcessedImage, saveDocument };
