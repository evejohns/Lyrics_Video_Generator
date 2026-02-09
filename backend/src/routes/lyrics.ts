import { Router } from 'express';
import axios from 'axios';
import { pool } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { CreateLyricLineSchema, AutoSyncRequestSchema } from '@shared/lyrics.js';

const router = Router();

router.use(authenticate);

// Get lyrics for a project
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
      'SELECT * FROM lyrics WHERE project_id = $1 ORDER BY line_number ASC',
      [projectId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

// Add/update lyrics for a project
router.post(
  '/project/:projectId',
  asyncHandler(async (req: AuthRequest, res) => {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const { lines } = req.body;

    // Verify project ownership
    const project = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [
      projectId,
      userId,
    ]);

    if (project.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    // Delete existing lyrics
    await pool.query('DELETE FROM lyrics WHERE project_id = $1', [projectId]);

    // Insert new lyrics
    const insertPromises = lines.map((line: any, index: number) => {
      const data = CreateLyricLineSchema.parse({
        ...line,
        projectId,
        lineNumber: index + 1,
      });

      return pool.query(
        'INSERT INTO lyrics (project_id, line_number, text, start_time, end_time, confidence) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [projectId, data.lineNumber, data.text, data.startTime, data.endTime, data.confidence]
      );
    });

    const results = await Promise.all(insertPromises);
    const insertedLines = results.map((r) => r.rows[0]);

    res.json({
      success: true,
      data: insertedLines,
    });
  })
);

// Auto-sync lyrics using AI
router.post(
  '/auto-sync',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const data = AutoSyncRequestSchema.parse(req.body);

    // Verify project ownership
    const project = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [
      data.projectId,
      userId,
    ]);

    if (project.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    // Call Python sync service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${pythonServiceUrl}/sync`, {
        audio_url: data.audioUrl,
        lyrics: data.lyrics,
        language: data.language,
      });

      const syncedLyrics = response.data;

      // Save synced lyrics to database
      const insertPromises = syncedLyrics.lines.map((line: any, index: number) => {
        return pool.query(
          'INSERT INTO lyrics (project_id, line_number, text, start_time, end_time, confidence) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [data.projectId, index + 1, line.text, line.start, line.end, line.confidence]
        );
      });

      await Promise.all(insertPromises);

      res.json({
        success: true,
        data: syncedLyrics,
        message: 'Lyrics synced successfully',
      });
    } catch (error) {
      console.error('Auto-sync error:', error);
      throw new AppError('Failed to auto-sync lyrics', 500);
    }
  })
);

// Search lyrics from Genius API
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { artist, title } = req.query;

    if (!artist || !title) {
      throw new AppError('Artist and title are required', 400);
    }

    // This would integrate with Genius API
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Genius API integration coming soon',
      data: {
        artist,
        title,
        lyrics: 'Placeholder lyrics...',
      },
    });
  })
);

export default router;
