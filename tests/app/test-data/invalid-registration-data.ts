import { getRandomNumber } from "../utils";
import { buildUserData } from "./user-data";

const nameTextErrorMessage = "Name must be at least 2 characters";
const emailTextErrorMessage = "Invalid email address";
const passwordTextErrorMessage = "Password must be at least 8 characters";

export const invalidRegistrationSet = [
  {
    id: "API-002",
    title: "register user with empty required parameter name",
    payload: { ...buildUserData(), name: "" },
    expectedError: nameTextErrorMessage,
  },

  {
    id: "API-003",
    title: "register user with invalid name (1 symbol)",
    payload: { ...buildUserData(), name: "J" },
    expectedError: nameTextErrorMessage,
  },

  {
    id: "API-004",
    title: "register user with empty required parameter email",
    payload: { ...buildUserData(), email: "" },
    expectedError: emailTextErrorMessage,
  },

  {
    id: "API-005",
    title: "register user with invalid email (without @)",
    payload: {
      ...buildUserData(),
      email: "john" + getRandomNumber() + "example.com",
    },
    expectedError: emailTextErrorMessage,
  },

  {
    id: "API-006",
    title: "register user with empty required parameter password",
    payload: { ...buildUserData(), password: "" },
    expectedError: passwordTextErrorMessage,
  },

  {
    id: "API-007",
    title: "register user with invalid password (7 symbols)",
    payload: { ...buildUserData(), password: "pass12%" },
    expectedError: passwordTextErrorMessage,
  },
];
