import { buildUserData } from "./user-data";

export const invalidRegistrationData = [
  {
    id: "API-002",
    title: "empty name",
    payload: { ...buildUserData(), name: "" },
    error: "Name must be at least 2 characters",
  },

  {
    id: "API-003",
    title: "invalid name (1 symbol)",
    payload: { ...buildUserData(), name: "J" },
    error: "Name must be at least 2 characters",
  },

  {
    id: "API-004",
    title: "empty email",
    payload: { ...buildUserData(), email: "" },
    error: "Invalid email address",
  },

  {
    id: "API-005",
    title: "invalid email (missing at sign)",
    payload: {
      ...buildUserData(),
      email: "johnexample.com",
    },
    error: "Invalid email address",
  },

  {
    id: "API-006",
    title: "empty password",
    payload: { ...buildUserData(), password: "" },
    error: "Password must be at least 8 characters",
  },

  {
    id: "API-007",
    title: "invalid password (no digits)",
    payload: { ...buildUserData(), password: "WrongPass" },
    error: "Password must contain at least one digit",
  },
];
