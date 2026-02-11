import { Router } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from '../config/storage.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Serve audio files from S3/MinIO
// Note: No authentication required since HTML audio elements can't send auth headers
// Security is provided by the obscure file path (UUID-based)
router.get(
  '/audio/:userId/:filename',
  asyncHandler(async (req, res) => {
    const { userId, filename } = req.params;

    const key = `audio/${userId}/${filename}`;

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);

      // Set appropriate headers
      res.set({
        'Content-Type': response.ContentType || 'audio/mpeg',
        'Content-Length': response.ContentLength,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Cross-Origin-Resource-Policy': 'cross-origin', // Allow cross-origin access
      });

      // Handle range requests for audio seeking
      const range = req.headers.range;
      if (range && response.ContentLength) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : response.ContentLength - 1;
        const chunksize = end - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${response.ContentLength}`,
          'Content-Length': chunksize,
        });
      }

      // Stream the file
      if (response.Body) {
        // @ts-ignore - Body is a readable stream
        response.Body.pipe(res);
      } else {
        throw new AppError('File not found', 404);
      }
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        throw new AppError('Audio file not found', 404);
      }
      throw error;
    }
  })
);

export default router;
