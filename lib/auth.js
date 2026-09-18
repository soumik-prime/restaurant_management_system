import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev_only_insecure_secret";
const COOKIE_NAME = "rms_session";
const TOKEN_TTL = "12h";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;


export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}


export async function requireRole(roles) {
  const user = await getSessionUser();
  if (!user) return null;
  if (roles && roles.length > 0 && !roles.includes(user.role)) return null;
  return user;
}
