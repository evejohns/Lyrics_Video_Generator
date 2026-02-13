import { Router } from 'express';
import { Queue } from 'bullmq';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../config/database.js';
import redis from '../config/redis.js';
import { s3Client, bucketName } from '../config/storage.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { CreateExportSchema } from 'shared/export.js';

const router = Router();

// Create render queue
const renderQueue = new Queue('video-render', {
  connection: redis,
});

router.use(authenticate);

// Get all exports for a project
router.get(
  '/project/:projectId',
  asyncHandler(async (req: AuthRequest, res) => {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Verify project ownership
    const project = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [
      projectId,
      userId,
    ]);

    if (project.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const result = await pool.query(
      'SELECT * FROM exports WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

// Get single export
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT e.* FROM exports e
       JOIN projects p ON e.project_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Export not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  })
);

// Create new export/render job
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const data = CreateExportSchema.parse(req.body);

    // Verify project ownership
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [data.projectId, userId]
    );

    if (project.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    // Get lyrics for the project
    const lyrics = await pool.query(
      'SELECT * FROM lyrics WHERE project_id = $1 ORDER BY line_number ASC',
      [data.projectId]
    );

    // Create export record
    const exportResult = await pool.query(
      `INSERT INTO exports (project_id, resolution, format, status, progress)
       VALUES ($1, $2, $3, 'queued', 0)
       RETURNING *`,
      [data.projectId, data.resolution, data.format]
    );

    const exportRecord = exportResult.rows[0];

    // Add job to render queue
    await renderQueue.add(
      'render-video',
      {
        exportId: exportRecord.id,
        projectId: data.projectId,
        project: project.rows[0],
        lyrics: lyrics.rows,
        resolution: data.resolution,
        format: data.format,
        generateThumbnail: req.body.generateThumbnail !== false,
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    res.status(201).json({
      success: true,
      data: exportRecord,
      message: 'Render job queued successfully',
    });
  })
);

// Generate thumbnail only (no video render)
router.post(
  '/thumbnail',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { projectId } = req.body;

    if (!projectId) {
      throw new AppError('projectId is required', 400);
    }

    // Verify project ownership
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (project.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    // Get lyrics for the project
    const lyrics = await pool.query(
      'SELECT * FROM lyrics WHERE project_id = $1 ORDER BY line_number ASC',
      [projectId]
    );

    // Create export record for thumbnail
    const exportResult = await pool.query(
      `INSERT INTO exports (project_id, resolution, format, status, progress)
       VALUES ($1, '1080p', 'mp4', 'queued', 0)
       RETURNING *`,
      [projectId]
    );

    const exportRecord = exportResult.rows[0];

    // Add thumbnail-only job to render queue
    await renderQueue.add(
      'render-video',
      {
        exportId: exportRecord.id,
        projectId,
        project: project.rows[0],
        lyrics: lyrics.rows,
        resolution: '1080p',
        format: 'mp4',
        generateThumbnail: true,
        thumbnailOnly: true,
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    res.status(201).json({
      success: true,
      data: exportRecord,
      message: 'Thumbnail generation started',
    });
  })
);

// Get export status
router.get(
  '/:id/status',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT e.id, e.status, e.progress, e.error, e.file_url, e.thumbnail_url, e.created_at, e.completed_at
       FROM exports e
       JOIN projects p ON e.project_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Export not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  })
);

// Download export file (proxies download from S3)
router.get(
  '/:id/download',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get export and verify ownership
    const result = await pool.query(
      `SELECT e.*, p.title FROM exports e
       JOIN projects p ON e.project_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Export not found', 404);
    }

    const exportRecord = result.rows[0];

    if (exportRecord.status !== 'completed') {
      throw new AppError('Export is not ready for download', 400);
    }

    if (!exportRecord.file_url) {
      throw new AppError('File URL not available', 500);
    }

    // Extract S3 key from file URL
    const s3Key = `exports/${id}/${id}.${exportRecord.format}`;

    try {
      // Get file from S3
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      const s3Response = await s3Client.send(command);

      // Set response headers for download
      const filename = `${exportRecord.title || 'video'}.${exportRecord.format}`;
      res.setHeader('Content-Type', s3Response.ContentType || `video/${exportRecord.format}`);
      res.setHeader('Content-Length', s3Response.ContentLength || 0);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream file to client
      if (s3Response.Body) {
        // @ts-ignore - Body is a readable stream
        s3Response.Body.pipe(res);
      } else {
        throw new Error('No file content received from storage');
      }
    } catch (error) {
      console.error('Download error:', error);
      throw new AppError('Failed to download file', 500);
    }
  })
);

// Download thumbnail
router.get(
  '/:id/thumbnail',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT e.*, p.title FROM exports e
       JOIN projects p ON e.project_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Export not found', 404);
    }

    const exportRecord = result.rows[0];

    if (!exportRecord.thumbnail_url) {
      throw new AppError('Thumbnail not available', 404);
    }

    const s3Key = `exports/${id}/${id}-thumbnail.jpg`;

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      const s3Response = await s3Client.send(command);

      const filename = `${exportRecord.title || 'thumbnail'}-thumbnail.jpg`;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', s3Response.ContentLength || 0);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (s3Response.Body) {
        // @ts-ignore - Body is a readable stream
        s3Response.Body.pipe(res);
      } else {
        throw new Error('No file content received from storage');
      }
    } catch (error) {
      console.error('Thumbnail download error:', error);
      throw new AppError('Failed to download thumbnail', 500);
    }
  })
);

// Cancel export
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `UPDATE exports e SET status = 'failed', error = 'Cancelled by user'
       FROM projects p
       WHERE e.id = $1 AND e.project_id = p.id AND p.user_id = $2 AND e.status IN ('queued', 'processing')
       RETURNING e.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Export not found or cannot be cancelled', 404);
    }

    res.json({
      success: true,
      message: 'Export cancelled successfully',
    });
  })
);

export default router;
