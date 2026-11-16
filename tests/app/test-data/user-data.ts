import { getRandomNumber } from "../utils";
import { faker } from "@faker-js/faker";
import type {
  RegisterUserData,
  TokenRequestData,
  UserFields,
} from "../types/user";

// Pre-existing admin account; it shares its password with the default user.
export const adminCredentials: Pick<UserFields, "email" | "password"> = {
  email: process.env.ADMIN_EMAIL!,
  password: process.env.DEFAULT_USER_PASSWORD!,
};

export function buildUserData(): RegisterUserData {
  return {
    name: faker.person.fullName() + getRandomNumber(),
    email: faker.internet.email().toLowerCase(),
    password: process.env.DEFAULT_USER_PASSWORD!,
  };
}

export function buildTokenRequestData(
  user: Pick<UserFields, "email" | "password">,
): TokenRequestData {
  return {
    grant_type: "password",
    email: user.email,
    password: user.password,
  };
}
