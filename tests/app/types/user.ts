export type UserFields = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  password: string;
};

export type RegisterUserData = Pick<UserFields, "name" | "email" | "password">;

export type TokenRequestData = Pick<UserFields, "email" | "password"> & {
  grant_type: string;
};
