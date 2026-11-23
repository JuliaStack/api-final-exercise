export function getRandomNumber() {
  return Math.floor(Math.random() * 1_000_000);
}

// Admin access token obtained once in global setup and read by the `adminToken` fixture.
export const adminTokenFile = ".auth/admin-token.json";
