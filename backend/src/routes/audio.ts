import { Router } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName, bucketUrl } from '../config/storage.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { randomUUID } from 'crypto';
import path from 'path';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/x-m4a',
      'audio/m4a',
      'audio/flac',
      'audio/ogg',
      'audio/x-flac',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only audio files are allowed.', 400) as any);
    }
  },
});

// Note: Bucket should be created manually via MinIO console or CLI
// The bucket 'lyric-videos' has been pre-created in MinIO

// Upload audio file
router.post(
  '/upload',
  authenticate,
  upload.single('audio'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      throw new AppError('No audio file provided', 400);
    }

    const userId = req.user!.id;
    const file = req.file;

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `audio/${userId}/${randomUUID()}${ext}`;

    // Upload to S3/MinIO
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Construct public URL
    const audioUrl = `${bucketUrl}/${filename}`;

    // Extract basic metadata (enhanced metadata will be done client-side with music-metadata)
    const metadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        url: audioUrl,
        filename,
        metadata,
      },
    });
  })
);

export default router;
