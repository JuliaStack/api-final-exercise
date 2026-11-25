import { faker } from "@faker-js/faker";
import { getRandomNumber } from "../utils";
import type {
  CreateLearningPathData,
  LearningPathCertificateData,
  LearningPathModuleData,
  LearningPathVideoData,
} from "../types/learning-path";

export function buildLearningPathData(
  overrides: Partial<CreateLearningPathData> = {},
): CreateLearningPathData {
  return {
    title: `${faker.lorem.words(3)} ${getRandomNumber()}`,
    description: faker.lorem.sentence(),
    instructor: {
      name: faker.person.fullName(),
      bio: faker.lorem.sentence(),
      avatarUrl: faker.image.avatar(),
    },
    ...overrides,
  };
}

export function buildLearningPathModuleData(
  overrides: Partial<LearningPathModuleData> = {},
): LearningPathModuleData {
  return {
    title: `${faker.lorem.words(2)} ${getRandomNumber()}`,
    description: faker.lorem.sentence(),
    ...overrides,
  };
}

export function buildLearningPathVideoData(
  overrides: Partial<LearningPathVideoData> = {},
): LearningPathVideoData {
  return {
    title: `${faker.lorem.words(3)} ${getRandomNumber()}`,
    videoId: faker.string.alphanumeric(11),
    ...overrides,
  };
}

export function buildLearningPathCertificateData(
  overrides: Partial<LearningPathCertificateData> = {},
): LearningPathCertificateData {
  return {
    name: `${faker.lorem.words(2)} ${getRandomNumber()}`,
    description: faker.lorem.sentence(),
    templateUrl: faker.internet.url(),
    ...overrides,
  };
}
