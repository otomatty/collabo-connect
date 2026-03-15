import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export const authClient = createAuthClient({
  baseURL: apiUrl || "http://localhost:3000",
  plugins: [magicLinkClient()],
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
