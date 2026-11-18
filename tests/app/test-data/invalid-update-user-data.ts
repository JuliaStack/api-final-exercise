export const invalidUpdateUserData = [
  {
    id: "API-029",
    title: "empty body",
    buildPayload: () => ({}),
    status: 400,
    error: "No valid fields to update",
  },

  {
    id: "API-030",
    title: "isActive as a string",
    buildPayload: () => ({ isActive: "false" }),
    status: 400,
    error: "No valid fields to update",
  },
];
