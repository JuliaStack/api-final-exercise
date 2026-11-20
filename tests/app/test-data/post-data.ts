import { faker } from "@faker-js/faker";
import { getRandomNumber } from "../utils";
import type { CreatePostData } from "../types/post";

export function buildPostData(
  overrides: Partial<CreatePostData> = {},
): CreatePostData {
  return {
    title: `${faker.lorem.words(3)} ${getRandomNumber()}`,
    excerpt: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    imageUrl: faker.image.url(),
    ...overrides,
  };
}

export const nonExistingPostId = "cnonexistingpost000000000";
