import { faker } from "@faker-js/faker";
import { getRandomNumber } from "../utils";
import type {
  CreateCategoryData,
  CreateChapterData,
  CreateCourseData,
} from "../types/course";

export function buildCourseData(
  overrides: Partial<CreateCourseData> = {},
): CreateCourseData {
  return {
    title: `${faker.lorem.words(2)} ${getRandomNumber()}`,
    ...overrides,
  };
}

export function buildChapterData(): CreateChapterData {
  return { title: `${faker.lorem.words(2)} ${getRandomNumber()}` };
}

// Well-formed id of a course that does not exist.
export const nonExistingCourseId = "cnonexistingcourse0000000";

export function buildCategoryData(): CreateCategoryData {
  return { name: `${faker.word.noun()} ${getRandomNumber()}` };
}

// Unique text to narrow the shared course list down to the courses of one test.
export function buildSearchToken(): string {
  return faker.string.alphanumeric(12);
}
