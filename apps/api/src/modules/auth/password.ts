import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return [HASH_PREFIX, salt.toString("hex"), derivedKey.toString("hex")].join(
    "$",
  );
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [prefix, saltHex, keyHex] = storedHash.split("$");

  if (
    prefix !== HASH_PREFIX ||
    saltHex === undefined ||
    keyHex === undefined ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{128}$/i.test(keyHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(keyHex, "hex");

  const suppliedKey = (await scrypt(
    password,
    salt,
    storedKey.length,
  )) as Buffer;

  return timingSafeEqual(storedKey, suppliedKey);
}
