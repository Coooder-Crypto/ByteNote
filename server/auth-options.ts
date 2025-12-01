import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GithubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
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
    async jwt({ token, user }) {
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
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.avatarUrl =
          (token.avatarUrl as string | null) ??
          (token.picture as string | null) ??
          null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.image) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: user.image },
        });
      }
    },
    async signIn({ user }) {
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
  secret: process.env.NEXTAUTH_SECRET,
};
