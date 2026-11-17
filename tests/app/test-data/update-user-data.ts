import { buildUserData } from "./user-data";

export const updateUserData = [
  {
    id: "API-022",
    title: "only name",
    buildPayload: () => ({ name: buildUserData().name }),
  },

  {
    id: "API-023",
    title: "only email",
    buildPayload: () => ({ email: buildUserData().email }),
  },

  {
    id: "API-024",
    title: "name and email",
    buildPayload: () => ({
      name: buildUserData().name,
      email: buildUserData().email,
    }),
  },
];
