import { z } from 'zod';

export const LyricLineSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  lineNumber: z.number().int().positive(),
  text: z.string().max(500),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).optional(), // For AI sync
});

export type LyricLine = z.infer<typeof LyricLineSchema>;

export const CreateLyricLineSchema = LyricLineSchema.omit({ id: true });
export type CreateLyricLine = z.infer<typeof CreateLyricLineSchema>;

export const SyncedLyricsSchema = z.object({
  lines: z.array(LyricLineSchema),
  totalDuration: z.number().positive(),
  averageConfidence: z.number().min(0).max(1).optional(),
});

export type SyncedLyrics = z.infer<typeof SyncedLyricsSchema>;

// For manual lyrics input
export const LyricsInputSchema = z.object({
  text: z.string().min(1),
  format: z.enum(['plain', 'lrc', 'srt']),
});

export type LyricsInput = z.infer<typeof LyricsInputSchema>;

// For auto-sync request
export const AutoSyncRequestSchema = z.object({
  projectId: z.string().uuid(),
  audioUrl: z.string().url(),
  lyrics: z.string().min(1),
  language: z.string().default('en'),
});

export type AutoSyncRequest = z.infer<typeof AutoSyncRequestSchema>;
