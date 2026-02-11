import { z } from 'zod';
export const UserPlan = z.enum(['free', 'pro', 'studio', 'enterprise']);
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(255),
    plan: UserPlan,
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CreateUserSchema = UserSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    password: z.string().min(8),
    plan: UserPlan.default('free').optional(),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const AuthResponseSchema = z.object({
    user: UserSchema,
    token: z.string(),
});
