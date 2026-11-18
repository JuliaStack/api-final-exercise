import { faker } from "@faker-js/faker";
import { getRandomNumber } from "../utils";
import type { CreateCategoryData, CreateCourseData } from "../types/course";

export function buildCourseData(
  overrides: Partial<CreateCourseData> = {},
): CreateCourseData {
  return {
    title: `${faker.lorem.words(2)} ${getRandomNumber()}`,
    ...overrides,
  };
}

export function buildCategoryData(): CreateCategoryData {
  return { name: `${faker.word.noun()} ${getRandomNumber()}` };
}

// Unique text to narrow the shared course list down to the courses of one test.
export function buildSearchToken(): string {
  return faker.string.alphanumeric(12);
}
