export const adminSessionCookieName = "redtours_admin_session";

type AdminSession = {
  user: string;
  exp: number;
};

function getAuthSecret() {
  return process.env.REDTOURS_AUTH_SECRET || process.env.REDTOURS_ADMIN_PASSWORD || "";
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function sign(value: string) {
  const secret = getAuthSecret();

  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return base64UrlEncode(signature);
}

export async function createAdminSessionToken(user: string) {
  const session: AdminSession = {
    user,
    exp: Date.now() + 1000 * 60 * 60 * 8
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await sign(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AdminSession;

    if (!session.user || session.exp < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
