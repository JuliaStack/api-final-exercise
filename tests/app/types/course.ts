export type CourseFields = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: number;
  isPublished: boolean;
  categoryIds: string[];
  outcomes: string[];
  requirements: string[];
  authorName: string;
  authorRole: string;
};

export type CreateCourseData = Pick<CourseFields, "title">;

export type UpdateCourseData = Partial<
  Pick<
    CourseFields,
    | "title"
    | "description"
    | "imageUrl"
    | "price"
    | "isPublished"
    | "categoryIds"
    | "outcomes"
    | "requirements"
    | "authorName"
    | "authorRole"
  >
>;

export type PurchaseCourseData = { promoCode?: string };

export type CreatedCourse = Pick<CourseFields, "id" | "title" | "slug">;

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

export type ChapterFields = {
  id: string;
  title: string;
  isPublished: boolean;
};

export type CreateChapterData = Pick<ChapterFields, "title">;

export type UpdateChapterData = Partial<Pick<ChapterFields, "isPublished">>;

export type CreatedChapter = Pick<ChapterFields, "id" | "title">;

// A draft course with one published and one draft chapter.
export type CourseWithChapters = {
  course: CreatedCourse;
  publishedChapter: CreatedChapter;
  draftChapter: CreatedChapter;
};

// A published course with a known price and its image.
export type PublishedCourse = CreatedCourse &
  Pick<CourseFields, "price" | "imageUrl">;
