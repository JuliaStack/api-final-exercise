// Who sends the request in an access-control negative case;
// the `tokenFor` fixture turns it into an Authorization token.
export type Caller = "anonymous" | "expiredToken" | "regularUser";

// A caller the endpoint rejects, with the expected status and error text.
export type UnauthorizedCaller = {
  id: string;
  title: string;
  caller: Caller;
  status: number;
  error: string;
};

// A caller that must not see a hidden (e.g. draft) resource.
export type HiddenResourceCaller = Omit<UnauthorizedCaller, "status" | "error">;
