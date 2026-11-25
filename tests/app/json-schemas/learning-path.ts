import { z } from "zod";
import { categorySchema } from "./course";

const learningPathModuleSchema = z.strictObject({
  id: z.cuid(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  learningPathId: z.cuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const learningPathVideoSchema = z.strictObject({
  id: z.cuid(),
  title: z.string(),
  videoId: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  isPublished: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const learningPathCertificateSchema = z.strictObject({
  id: z.cuid(),
  name: z.string(),
  description: z.string().nullable(),
  templateUrl: z.string().nullable(),
  learningPathId: z.cuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const learningPathInstructorSchema = z.strictObject({
  id: z.cuid(),
  name: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Response body of POST /api/learning-paths
export const learningPathSchema = z.strictObject({
  id: z.cuid(),
  title: z.string().min(3),
  slug: z.string(),
  description: z.string().nullable(),
  isPublished: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  videoId: z.cuid().nullable(),
  instructorId: z.cuid(),
  modules: z.array(learningPathModuleSchema),
  categories: z.array(categorySchema),
  video: learningPathVideoSchema.nullable(),
  certificate: learningPathCertificateSchema.nullable(),
  instructor: learningPathInstructorSchema,
});

export type LearningPath = z.infer<typeof learningPathSchema>;
