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
