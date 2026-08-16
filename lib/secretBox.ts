import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

type SecretBoxPayload = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  data: string;
};

function getSecretKey() {
  const secret = process.env.REDTOURS_CREDENTIALS_SECRET || process.env.REDTOURS_AUTH_SECRET || process.env.REDTOURS_ADMIN_PASSWORD;

  if (!secret) {
    throw new Error("REDTOURS_CREDENTIALS_SECRET is missing. Add it to .env.local before storing supplier credentials.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptJsonSecret(value: Record<string, unknown>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const payload: SecretBoxPayload = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64")
  };

  return payload;
}

export function decryptJsonSecret(payload: unknown) {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Partial<SecretBoxPayload>;
  if (record.v !== 1 || record.alg !== "aes-256-gcm" || !record.iv || !record.tag || !record.data) return {};

  const decipher = createDecipheriv("aes-256-gcm", getSecretKey(), Buffer.from(record.iv, "base64"));
  decipher.setAuthTag(Buffer.from(record.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.data, "base64")),
    decipher.final()
  ]).toString("utf8");
  const parsed = JSON.parse(decrypted);

  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
}
