import { Router } from 'express';
import { google } from 'googleapis';
import { pool } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { YouTubeUploadRequestSchema } from 'shared/export.js';

const router = Router();

router.use(authenticate);

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Get YouTube auth URL
router.get(
  '/auth-url',
  asyncHandler(async (req: AuthRequest, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
      state: req.user!.id, // Pass user ID in state
    });

    res.json({
      success: true,
      data: { authUrl },
    });
  })
);

// OAuth callback
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
      throw new AppError('Missing code or state parameter', 400);
    }

    const userId = state as string;

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);

    // Save tokens to database
    await pool.query(
      `INSERT INTO youtube_credentials (user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = $2,
         refresh_token = $3,
         expires_at = $4,
         updated_at = NOW()`,
      [
        userId,
        tokens.access_token,
        tokens.refresh_token,
        new Date(tokens.expiry_date!),
      ]
    );

    res.send(`
      <html>
        <body>
          <h1>YouTube Connected Successfully!</h1>
          <p>You can close this window and return to the app.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  })
);

// Check YouTube connection status
router.get(
  '/status',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const result = await pool.query(
      'SELECT id, expires_at FROM youtube_credentials WHERE user_id = $1',
      [userId]
    );

    const isConnected = result.rows.length > 0 && new Date(result.rows[0].expires_at) > new Date();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        expiresAt: result.rows[0]?.expires_at,
      },
    });
  })
);

// Upload video to YouTube
router.post(
  '/upload',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const data = YouTubeUploadRequestSchema.parse(req.body);

    // Get YouTube credentials
    const credentials = await pool.query(
      'SELECT * FROM youtube_credentials WHERE user_id = $1',
      [userId]
    );

    if (credentials.rows.length === 0) {
      throw new AppError('YouTube not connected', 401);
    }

    const creds = credentials.rows[0];

    // Check if token is expired
    if (new Date(creds.expires_at) <= new Date()) {
      // Refresh token logic would go here
      throw new AppError('YouTube token expired, please reconnect', 401);
    }

    // Get export file URL
    const exportResult = await pool.query(
      `SELECT e.file_url, p.user_id FROM exports e
       JOIN projects p ON e.project_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [data.exportId, userId]
    );

    if (exportResult.rows.length === 0) {
      throw new AppError('Export not found', 404);
    }

    const { file_url } = exportResult.rows[0];

    if (!file_url) {
      throw new AppError('Export file not ready', 400);
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Upload video (simplified - would need to download and stream file)
    // This is a placeholder for the actual implementation
    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: data.metadata.title,
            description: data.metadata.description,
            tags: data.metadata.tags,
            categoryId: data.metadata.category,
          },
          status: {
            privacyStatus: data.metadata.privacy,
          },
        },
        media: {
          // This would need proper file streaming
          body: 'file stream here',
        },
      } as any);

      const videoId = response.data.id!;
      const videoUrl = `https://youtube.com/watch?v=${videoId}`;

      // Update export record
      await pool.query('UPDATE exports SET youtube_video_id = $1 WHERE id = $2', [
        videoId,
        data.exportId,
      ]);

      res.json({
        success: true,
        data: {
          videoId,
          url: videoUrl,
        },
        message: 'Video uploaded to YouTube successfully',
      });
    } catch (error) {
      console.error('YouTube upload error:', error);
      throw new AppError('Failed to upload to YouTube', 500);
    }
  })
);

// Disconnect YouTube
router.delete(
  '/disconnect',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    await pool.query('DELETE FROM youtube_credentials WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'YouTube disconnected successfully',
    });
  })
);

export default router;
