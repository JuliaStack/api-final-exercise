import { faker } from "@faker-js/faker";
import { getRandomNumber } from "../utils";
import type { CreateTagData } from "../types/tag";

export function buildTagData(
  overrides: Partial<CreateTagData> = {},
): CreateTagData {
  return {
    name: `${faker.word.noun()} ${getRandomNumber()}`,
    ...overrides,
  };
}
