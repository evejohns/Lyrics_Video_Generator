import { z } from 'zod';
import { VideoConfigSchema } from './config.js';

export const TemplateCategorySchema = z.enum([
  'minimal',
  'vibrant',
  'retro',
  'modern',
  'custom',
]);

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(), // null for system templates
  name: z.string().min(1).max(255),
  category: TemplateCategorySchema,
  thumbnail: z.string().url(),
  config: VideoConfigSchema,
  isPublic: z.boolean().default(false),
  uses: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const CreateTemplateSchema = TemplateSchema.omit({
  id: true,
  uses: true,
  createdAt: true,
});

export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;
