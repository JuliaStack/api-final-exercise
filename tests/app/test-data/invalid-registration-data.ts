import { buildUserData } from "./user-data";

export const invalidRegistrationData = [
  {
    id: "API-002",
    title: "empty name",
    payload: { ...buildUserData(), name: "" },
  },

  {
    id: "API-003",
    title: "invalid name (1 symbol)",
    payload: { ...buildUserData(), name: "J" },
  },

  {
    id: "API-004",
    title: "empty email",
    payload: { ...buildUserData(), email: "" },
  },

  {
    id: "API-005",
    title: "invalid email (missing at sign)",
    payload: {
      ...buildUserData(),
      email: "johnexample.com",
    },
  },

  {
    id: "API-006",
    title: "empty password",
    payload: { ...buildUserData(), password: "" },
  },

  {
    id: "API-007",
    title: "invalid password (9 symbols)",
    payload: { ...buildUserData(), password: "WrongPass" },
  },
];
