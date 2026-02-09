import { z } from 'zod';

// Resolution and Aspect Ratio
export const Resolution = z.enum(['480p', '720p', '1080p', '4k']);
export type Resolution = z.infer<typeof Resolution>;

export const AspectRatio = z.enum(['16:9', '9:16', '1:1', '4:5']);
export type AspectRatio = z.infer<typeof AspectRatio>;

// Background Configuration
export const BackgroundTypeSchema = z.enum(['solid', 'gradient', 'image', 'video']);
export type BackgroundType = z.infer<typeof BackgroundTypeSchema>;

export const BackgroundConfigSchema = z.object({
  type: BackgroundTypeSchema,
  color: z.string().optional(),
  colors: z.array(z.string()).optional(),
  gradientType: z.enum(['linear', 'radial']).optional(),
  image: z.string().url().optional(),
  video: z.string().url().optional(),
  blur: z.number().min(0).max(100).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export type BackgroundConfig = z.infer<typeof BackgroundConfigSchema>;

// Text Configuration
export const TextAnimationType = z.enum([
  'none',
  'fade',
  'slide',
  'pop',
  'bounce',
  'typewriter',
]);
export type TextAnimationType = z.infer<typeof TextAnimationType>;

export const TextDisplayMode = z.enum(['single', 'karaoke', 'dual']);
export type TextDisplayMode = z.infer<typeof TextDisplayMode>;

export const TextAlignmentSchema = z.enum(['top', 'center', 'bottom']);
export type TextAlignment = z.infer<typeof TextAlignmentSchema>;

export const OutlineConfigSchema = z.object({
  enabled: z.boolean(),
  color: z.string(),
  width: z.number().min(0).max(20),
});

export const ShadowConfigSchema = z.object({
  enabled: z.boolean(),
  color: z.string(),
  blur: z.number().min(0).max(50),
  offsetX: z.number(),
  offsetY: z.number(),
});

export const TextConfigSchema = z.object({
  font: z.string(),
  size: z.number().min(20).max(200),
  weight: z.enum(['100', '300', '400', '600', '700', '900']),
  color: z.string(),
  outline: OutlineConfigSchema.optional(),
  shadow: ShadowConfigSchema.optional(),
  alignment: TextAlignmentSchema,
  position: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),
  maxWidth: z.number().min(10).max(100),
  animation: TextAnimationType,
  animationDuration: z.number().positive(),
  displayMode: TextDisplayMode,
});

export type TextConfig = z.infer<typeof TextConfigSchema>;

// Effects Configuration
export const EmojiAnimationType = z.enum(['float', 'fall', 'rise', 'explode', 'spiral']);
export type EmojiAnimationType = z.infer<typeof EmojiAnimationType>;

export const EmojiConfigSchema = z.object({
  types: z.array(z.string()),
  count: z.number().min(5).max(50),
  size: z.number().min(50).max(150),
  animation: EmojiAnimationType,
  speed: z.number().min(0.1).max(2.0),
  opacity: z.number().min(0).max(1),
});

export const EffectsConfigSchema = z.object({
  emojis: z.boolean(),
  emojiConfig: EmojiConfigSchema.optional(),
  blur: z.number().min(0).max(20).optional(),
  brightness: z.number().min(0).max(200).optional(),
  contrast: z.number().min(0).max(200).optional(),
  saturation: z.number().min(0).max(200).optional(),
  vhsEffect: z.boolean().optional(),
  glitchEffect: z.boolean().optional(),
  scanlines: z.boolean().optional(),
  filmGrain: z.boolean().optional(),
});

export type EffectsConfig = z.infer<typeof EffectsConfigSchema>;

// Album Art Configuration
export const AlbumArtPositionSchema = z.enum([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
  'custom',
]);

export const AlbumArtAnimationType = z.enum(['none', 'pulse', 'rotate', 'float']);

export const AlbumArtConfigSchema = z.object({
  enabled: z.boolean(),
  source: z.enum(['audio-metadata', 'upload', 'url']),
  file: z.string().url().optional(),
  url: z.string().url().optional(),
  position: AlbumArtPositionSchema,
  customPosition: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
  size: z.number().min(100).max(800),
  borderRadius: z.number().min(0).max(50),
  border: z
    .object({
      width: z.number().min(0).max(20),
      color: z.string(),
    })
    .optional(),
  shadow: z.boolean().optional(),
  rotation: z.number().min(-180).max(180).optional(),
  animation: AlbumArtAnimationType.optional(),
});

export type AlbumArtConfig = z.infer<typeof AlbumArtConfigSchema>;

// Branding Configuration
export const BrandingConfigSchema = z.object({
  enabled: z.boolean(),
  logo: z.string().url().optional(),
  watermark: z
    .object({
      text: z.string(),
      position: z.string(),
      opacity: z.number().min(0).max(1),
    })
    .optional(),
});

export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

// Main Video Configuration
export const VideoConfigSchema = z.object({
  resolution: Resolution,
  aspectRatio: AspectRatio,
  duration: z.number().positive(),
  background: BackgroundConfigSchema,
  text: TextConfigSchema,
  effects: EffectsConfigSchema,
  albumArt: AlbumArtConfigSchema,
  branding: BrandingConfigSchema.optional(),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;

// Export Configuration
export const VideoFormatSchema = z.enum(['mp4', 'mov', 'webm']);
export const VideoCodecSchema = z.enum(['h264', 'h265', 'vp9']);
export const AudioCodecSchema = z.enum(['aac', 'mp3', 'opus']);
export const RenderPresetSchema = z.enum(['ultrafast', 'fast', 'medium', 'slow', 'veryslow']);

export const ExportConfigSchema = z.object({
  resolution: Resolution,
  fps: z.enum([24, 30, 60]),
  bitrate: z.number().positive(),
  format: VideoFormatSchema,
  codec: VideoCodecSchema,
  audioCodec: AudioCodecSchema,
  audioBitrate: z.number().positive(),
  hardwareAcceleration: z.boolean(),
  preset: RenderPresetSchema,
});

export type ExportConfig = z.infer<typeof ExportConfigSchema>;
