import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

export async function isAdmin(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  return got === expected;
}
