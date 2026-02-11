import { z } from 'zod';
export const ProjectStatus = z.enum(['draft', 'processing', 'completed', 'failed']);
export const ProjectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string().min(1).max(255),
    artist: z.string().min(1).max(255),
    audioUrl: z.string().url(),
    albumArtUrl: z.string().url().optional(),
    durationSeconds: z.number().positive(),
    config: z.any(), // VideoConfig - defined separately
    status: ProjectStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CreateProjectSchema = ProjectSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const UpdateProjectSchema = ProjectSchema.partial().required({ id: true });
