
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      avatarUrl: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    avatarUrl?: string | null;
  }
}

export {};
