// Fully signed by the server; rejected only because `exp` is in the past.
export const expiredToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzY29wZXMiOlsicmVhZCIsIndyaXRlIiwiYWRtaW4iXSwidHlwZSI6InVzZXIiLCJzdWIiOiJjbXdpaTZqOHUwMDAwZzFud2c2bnljdzloIiwiaWF0IjoxNzk0ODI1MTY1LCJleHAiOjE3OTQ4MjYwNjUsImlzcyI6ImRvam8tYXBpIn0.C5DdfDe43IdX9YTE6_Af7sLdU4UA1qxLnmCAtWhy5C8";

// Same token with the last characters of the signature replaced.
const tamperedToken = expiredToken.slice(0, -4) + "AAAA";

export const invalidTokenData = [
  {
    id: "API-018",
    title: "expired token",
    token: expiredToken,
    status: 401,
  },
  {
    id: "API-019",
    title: "empty token",
    token: "",
    status: 401,
  },
  {
    id: "API-020",
    title: "malformed token",
    token: "abc",
    status: 401,
  },
  {
    id: "API-021",
    title: "tampered signature",
    token: tamperedToken,
    status: 401,
  },
];
