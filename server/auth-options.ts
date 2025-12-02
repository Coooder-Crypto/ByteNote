import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: { token: JWT; user?: User | AdapterUser | null }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        const avatarUrl =
          (user.avatarUrl as string | null | undefined) ?? user.image ?? null;
        token.picture = avatarUrl;
        token.avatarUrl = avatarUrl;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { id?: string; avatarUrl?: string | null; picture?: string | null };
    }) {
      if (session.user) {
        (session.user as Session["user"] & { id?: string }).id =
          (token.id as string) ?? "";
        (
          session.user as Session["user"] & { avatarUrl?: string | null }
        ).avatarUrl =
          (token.avatarUrl as string | null) ??
          (token.picture as string | null) ??
          null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: { user: User }) {
      if (user.image) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: user.image },
        });
      }
    },
    async signIn({ user }: { user: User | AdapterUser }) {
      const existingAvatar =
        (user.avatarUrl as string | null | undefined) ?? null;
      if (existingAvatar || !user.image) {
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: user.image },
      });
    },
  },
  secret: authSecret,
};
