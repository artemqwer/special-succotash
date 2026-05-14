import { createClient } from "./supabase";

export type Session = { email: string; name: string; avatar?: string; teamId?: string | null };


export async function registerUser(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
      return { success: false, error: "This email is already registered" };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; session?: Session; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed")) {
      return { success: false, error: "Please confirm your email first — check your inbox for a confirmation link" };
    }
    if (msg.includes("invalid") || msg.includes("credentials")) {
      return { success: false, error: "Incorrect email or password" };
    }
    return { success: false, error: error.message };
  }
  const name = data.user?.user_metadata?.full_name ?? email.split("@")[0];
  return { success: true, session: { email: data.user.email!, name } };
}

export async function loginWithGoogle(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function logoutUser(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getSupabaseSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  const user = data.session.user;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  const avatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  const teamId = (user.user_metadata?.team_id as string | undefined) ?? null;
  return { email: user.email!, name, avatar, teamId };
}
