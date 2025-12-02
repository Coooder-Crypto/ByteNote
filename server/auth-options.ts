import { PrismaAdapter } from "@auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

type NextAuthOptions = Parameters<typeof NextAuth>[0];

export const authOptions: any = {
  adapter: PrismaAdapter(prisma) as any,
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
    async jwt({ token, user }: { token: any; user?: any | null }) {
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
    async session({ session, token }: { session: Session; token: any }) {
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
    async createUser({ user }: { user: AdapterUser }) {
      if (user.image) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: user.image },
        });
      }
    },
    async signIn({ user }: { user: any }) {
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
