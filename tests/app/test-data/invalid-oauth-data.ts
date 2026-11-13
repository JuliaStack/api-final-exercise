export const invalidOauthData = [
  {
    id: "API-011",
    title: "empty grant_type",
    overrides: { grant_type: "" },
    status: 400,
  },

  {
    id: "API-012",
    title: "invalid grant_type",
    overrides: { grant_type: "reader" },
    status: 400,
  },

  {
    id: "API-013",
    title: "empty email",
    overrides: { email: "" },
    status: 400,
  },

  {
    id: "API-014",
    title: "invalid email (missing at sign)",
    overrides: { email: "johnexample.com" },
    status: 400,
  },

  {
    id: "API-015",
    title: "empty password",
    overrides: { password: "" },
    status: 400,
  },

  {
    id: "API-016",
    title: "wrong password",
    overrides: { password: "WrongPass" },
    status: 401,
  },
];
