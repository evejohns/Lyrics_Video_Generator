import { Router } from 'express';
import { Queue } from 'bullmq';
import { pool } from '../config/database.js';
import redis from '../config/redis.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { CreateExportSchema } from '@shared/export.js';

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

// Get export status
router.get(
  '/:id/status',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT e.id, e.status, e.progress, e.error, e.file_url, e.created_at, e.completed_at
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
