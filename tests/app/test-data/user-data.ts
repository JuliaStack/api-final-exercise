import { getRandomNumber } from "../utils";
import { faker } from "@faker-js/faker";
import type { RegisterUserData, TokenRequestData } from "../types/user";

export function buildUserData(): RegisterUserData {
  return {
    name: faker.person.fullName() + getRandomNumber(),
    email: faker.internet.email().toLowerCase(),
    password: process.env.DEFAULT_USER_PASSWORD!,
  };
}

export function buildTokenRequestData(
  user: RegisterUserData,
): TokenRequestData {
  return {
    grant_type: "password",
    email: user.email,
    password: user.password,
  };
}
