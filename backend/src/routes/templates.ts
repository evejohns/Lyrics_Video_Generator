import { Router } from 'express';
import { pool } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { CreateTemplateSchema } from 'shared/template.js';

const router = Router();

// Public templates don't require auth
router.get(
  '/public',
  asyncHandler(async (req, res) => {
    const { category, page = '1', pageSize = '20' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    let query = 'SELECT * FROM templates WHERE is_public = true';
    const params: any[] = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ` ORDER BY uses DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(pageSize as string), offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = category
      ? 'SELECT COUNT(*) FROM templates WHERE is_public = true AND category = $1'
      : 'SELECT COUNT(*) FROM templates WHERE is_public = true';
    const countParams = category ? [category] : [];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        items: result.rows,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(total / parseInt(pageSize as string)),
      },
    });
  })
);

// Get single template
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Template not found', 404);
    }

    // Increment uses counter
    await pool.query('UPDATE templates SET uses = uses + 1 WHERE id = $1', [id]);

    res.json({
      success: true,
      data: result.rows[0],
    });
  })
);

// Protected routes require authentication
router.use(authenticate);

// Get user's custom templates
router.get(
  '/user/me',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const result = await pool.query(
      'SELECT * FROM templates WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

// Create custom template
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const data = CreateTemplateSchema.parse({
      ...req.body,
      userId,
    });

    const result = await pool.query(
      `INSERT INTO templates (user_id, name, category, thumbnail, config, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        data.name,
        data.category,
        data.thumbnail,
        JSON.stringify(data.config),
        data.isPublic || false,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  })
);

// Update template
router.patch(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const existing = await pool.query('SELECT id FROM templates WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);

    if (existing.rows.length === 0) {
      throw new AppError('Template not found', 404);
    }

    const { name, category, thumbnail, config, isPublic } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (thumbnail) {
      updates.push(`thumbnail = $${paramCount++}`);
      values.push(thumbnail);
    }
    if (config) {
      updates.push(`config = $${paramCount++}`);
      values.push(JSON.stringify(config));
    }
    if (typeof isPublic === 'boolean') {
      updates.push(`is_public = $${paramCount++}`);
      values.push(isPublic);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id);
    const query = `UPDATE templates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  })
);

// Delete template
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pool.query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Template not found', 404);
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  })
);

export default router;
