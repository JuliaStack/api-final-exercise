import { z } from "zod";

// Response body of POST /api/tags (and one element of GET /api/tags)
export const tagSchema = z.strictObject({
  id: z.cuid(),
  name: z.string().min(2),
  slug: z.string().min(1),
});

// Response body of GET /api/tags
export const tagListSchema = z.array(tagSchema);

export type TagList = z.infer<typeof tagListSchema>;
