import { z } from 'zod';

export const UserPlan = z.enum(['free', 'pro', 'studio', 'enterprise']);
export type UserPlan = z.infer<typeof UserPlan>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  plan: UserPlan,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8),
  plan: UserPlan.default('free').optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type Login = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
