export type CourseFields = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  categoryIds: string[];
};

export type CreateCourseData = Pick<CourseFields, "title">;

export type UpdateCourseData = Partial<
  Pick<CourseFields, "description" | "isPublished" | "categoryIds">
>;

export type CreatedCourse = Pick<CourseFields, "id" | "title">;

export type CourseListQuery = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
};

export type CategoryFields = {
  id: string;
  name: string;
  slug: string;
};

export type CreateCategoryData = Pick<CategoryFields, "name">;

export type CreatedCategory = Pick<CategoryFields, "id" | "slug">;
