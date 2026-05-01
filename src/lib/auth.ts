const SESSION_KEY = "dr_session";
const USERS_KEY = "dr_users";

export type Session = { email: string; name: string };
type StoredUser = { email: string; name: string; passwordHash: string };

// ─── Session ─────────────────────────────────────────────────────────────────

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Password hashing (Web Crypto SHA-256) ───────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Users store ─────────────────────────────────────────────────────────────

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "This email is already registered" };
  }
  const passwordHash = await hashPassword(password);
  users.push({ email, name, passwordHash });
  saveUsers(users);
  return { success: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; session?: Session; error?: string }> {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { success: false, error: "No account found with this email" };
  }
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    return { success: false, error: "Incorrect password" };
  }
  return { success: true, session: { email: user.email, name: user.name } };
}
