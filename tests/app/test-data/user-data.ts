import { getRandomNumber } from "../utils";
import { faker } from "@faker-js/faker";
import type { RegisterUserData } from "../types/user";

export function buildUserData(): RegisterUserData {
  return {
    name: faker.person.fullName() + getRandomNumber(),
    email: faker.internet.email().toLowerCase(),
    password: process.env.DEFAULT_USER_PASSWORD!,
  };
}
