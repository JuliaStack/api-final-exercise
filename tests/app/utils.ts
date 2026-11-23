export function getRandomNumber() {
  return Math.floor(Math.random() * 1_000_000);
}

// Admin access token obtained in global setup and read by the `adminToken` fixture (which refreshes it when expired).
export const adminTokenFile = ".auth/admin-token.json";

// True if the JWT has expired or will within `marginSeconds` (the signature is not checked).
export function isTokenExpired(token: string, marginSeconds = 60) {
  try {
    const { exp } = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    return typeof exp !== "number" || exp - marginSeconds <= Date.now() / 1000;
  } catch {
    return true;
  }
}
