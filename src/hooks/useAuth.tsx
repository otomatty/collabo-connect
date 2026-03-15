import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: { id: string; name: string; email?: string; image?: string | null } | null;
  profile: Profile | null;
  session: { user: { id: string; name: string; email?: string; image?: string | null } } | null;
  loading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const user = session?.user ?? null;

  const fetchProfile = async (userId: string, authName: string, authImage?: string | null) => {
    try {
      const data = await apiFetch<Profile>("/api/profiles/me");
      setProfile(data);
    } catch (err) {
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("Profile not found"))) {
        try {
          await apiFetch("/api/profiles", {
            method: "POST",
            body: {
              name: authName || "User",
              avatar_url: authImage ?? "",
            },
          });
          const data = await apiFetch<Profile>("/api/profiles/me");
          setProfile(data);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (sessionPending) {
      setProfileLoading(true);
      return;
    }
    if (user?.id) {
      setProfileLoading(true);
      fetchProfile(user.id, user.name ?? user.email ?? "User", user.image);
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user?.id, sessionPending]);

  const signInWithEmail = async (email: string, password?: string) => {
    if (password) {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw error;
    } else {
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/`,
      });
      if (error) throw error;
    }
  };

  const signUpWithEmail = async (email: string, password?: string) => {
    if (!password) throw new Error("Password is required for signup");
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await authClient.signOut();
    setProfile(null);
  };

  const loading = sessionPending || profileLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session: session ?? null,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
