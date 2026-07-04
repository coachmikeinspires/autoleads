import { compare } from "bcryptjs";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions, Session } from "next-auth";

function getSafeNextAuthUrl() {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).toString();
    } catch {
      // Ignore invalid values and use fallback below.
    }
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return "http://localhost:3000";
}

process.env.NEXTAUTH_URL = getSafeNextAuthUrl();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.password) return null;
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const enrichedUser = user as typeof user & { role?: string; orgId?: string };
        token.id = user.id;
        token.role = enrichedUser.role;
        token.orgId = enrichedUser.orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.orgId = token.orgId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
  return await getServerSession(authOptions) as Session | null;
}
