export type TagFields = {
  id: string;
  name: string;
  slug: string;
};

export type CreateTagData = Pick<TagFields, "name">;

export type CreatedTag = TagFields;
