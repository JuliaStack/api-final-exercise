export type PostFields = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  tagIds: string[];
  isPublished: boolean;
};

export type CreatePostData = Pick<PostFields, "title"> &
  Partial<
    Pick<
      PostFields,
      "excerpt" | "content" | "imageUrl" | "tagIds" | "isPublished"
    >
  >;

export type CreatedPost = Pick<PostFields, "id" | "title" | "slug">;
