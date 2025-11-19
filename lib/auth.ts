import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);

  return { hash, salt };
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
