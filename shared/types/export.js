import { z } from 'zod';
import { Resolution, VideoFormatSchema } from './config.js';
export const ExportStatusSchema = z.enum(['queued', 'processing', 'completed', 'failed']);
export const ExportSchema = z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    resolution: Resolution,
    format: VideoFormatSchema,
    fileUrl: z.string().url().optional(),
    fileSizeMb: z.number().positive().optional(),
    youtubeVideoId: z.string().optional(),
    status: ExportStatusSchema,
    progress: z.number().min(0).max(100).default(0),
    error: z.string().optional(),
    createdAt: z.date(),
    completedAt: z.date().optional(),
});
export const CreateExportSchema = ExportSchema.omit({
    id: true,
    fileUrl: true,
    fileSizeMb: true,
    youtubeVideoId: true,
    status: true,
    progress: true,
    error: true,
    createdAt: true,
    completedAt: true,
});
// YouTube Upload
export const YouTubeMetadataSchema = z.object({
    title: z.string().max(100),
    description: z.string().max(5000),
    tags: z.array(z.string()).max(500),
    category: z.string().default('10'), // Music
    privacy: z.enum(['private', 'unlisted', 'public']),
    thumbnail: z.string().url().optional(),
    playlist: z.string().optional(),
});
export const YouTubeUploadRequestSchema = z.object({
    exportId: z.string().uuid(),
    metadata: YouTubeMetadataSchema,
});
export const YouTubeUploadResponseSchema = z.object({
    videoId: z.string(),
    url: z.string().url(),
});
