import { z } from "zod";

// Response body of POST /api/auth/register
export const registeredUserSchema = z.strictObject({
  id: z.cuid(),
  name: z.string().min(2),
  email: z.email("Invalid email format"),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.iso.datetime(),
});

export type RegisteredUser = z.infer<typeof registeredUserSchema>;

// Response body of POST /api/oauth/token (grant_type=password)
export const tokenResponseSchema = z.strictObject({
  access_token: z.jwt(),
  token_type: z.literal("Bearer"),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
  scope: z.string(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

// Response body of GET /api/oauth/userinfo
export const userInfoSchema = z.strictObject({
  id: z.cuid(),
  email: z.email("Invalid email format"),
  name: z.string().min(2),
  role: z.enum(["USER", "ADMIN"]),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type UserInfo = z.infer<typeof userInfoSchema>;
