import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { CreateUserSchema, LoginSchema } from 'shared/user.js';

const router = Router();

// Register new user
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name, plan } = CreateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, plan) VALUES ($1, $2, $3, $4) RETURNING id, email, name, plan, created_at',
      [email, passwordHash, name, plan || 'free']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = LoginSchema.parse(req.body);

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, name, plan FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  })
);

// Get current user
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // This would use the authenticate middleware
    res.json({
      success: true,
      message: 'Protected route - implement authenticate middleware',
    });
  })
);

export default router;
