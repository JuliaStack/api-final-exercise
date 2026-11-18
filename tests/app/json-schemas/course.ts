import { z } from "zod";

const courseListItemSchema = z.strictObject({
  id: z.cuid(),
  title: z.string().min(3),
  slug: z.string().min(1),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.string().nullable(),
  isPublished: z.boolean(),
  isListed: z.boolean(),
  isFeatured: z.boolean(),
  featuredOrder: z.number().int(),
  outcomes: z.string().nullable(),
  requirements: z.string().nullable(),
  authorName: z.string().nullable(),
  authorRole: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  categories: z.array(
    z.strictObject({
      id: z.cuid(),
      name: z.string(),
      slug: z.string(),
    }),
  ),
  _count: z.strictObject({
    chapters: z.number().int().nonnegative(),
    purchases: z.number().int().nonnegative(),
  }),
});

// Response body of GET /api/courses
export const coursesPageSchema = z.strictObject({
  data: z.array(courseListItemSchema),
  pagination: z.strictObject({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type CoursesPage = z.infer<typeof coursesPageSchema>;
