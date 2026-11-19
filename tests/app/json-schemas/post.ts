import { z } from "zod";
import { tagSchema } from "./tag";

// Response body of POST /api/posts (and one element of GET /api/posts)
export const postSchema = z.strictObject({
  id: z.cuid(),
  title: z.string().min(3),
  slug: z.string().min(1),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  tags: z.array(tagSchema),
});

export type Post = z.infer<typeof postSchema>;

// Response body of GET /api/posts
export const postListSchema = z.array(postSchema);

export type PostList = z.infer<typeof postListSchema>;
