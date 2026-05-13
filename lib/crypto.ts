import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY environment variable is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64-encoded)`);
  }
  return buf;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv(12) + tag(16) + ciphertext → base64
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
