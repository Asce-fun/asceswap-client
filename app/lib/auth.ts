import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { decodeWithoutVerify, validateJWT } from "./dynamic/auth-helpers";
export const secret = process.env.NEXTAUTH_SECRET!;

type User = {
  id: string;
  name: string;
  email: string;
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          console.log("NextAuth authorize called");
          const token = credentials?.token as string;

          if (typeof token !== "string" || !token) {
            console.error("No token provided in credentials");
            throw new Error("Token is required");
          }

          // Try to decode without verification first to see what we're working with
          const decodedWithoutVerify = decodeWithoutVerify(token);

          console.log("Attempting to validate JWT...");
          const jwtPayload = await validateJWT(token);

          if (!jwtPayload) {
            console.error("JWT validation failed");

            // TEMPORARY DEVELOPMENT FALLBACK:
            // If we're in development and have a decoded token, use it
            if (
              process.env.NODE_ENV === "development" &&
              decodedWithoutVerify
            ) {
              console.log(
                "DEVELOPMENT MODE: Using decoded token without verification"
              );
              const user: User = {
                id: decodedWithoutVerify.sub || "",
                name: decodedWithoutVerify.username || "",
                email: decodedWithoutVerify.email || "",
              };

              return { ...user, walletAddress: null };
            }

            return null;
          }

          console.log("JWT validation successful, payload:", {
            sub: jwtPayload.sub,
            username: jwtPayload.username,
            email: jwtPayload.email,
          });

          const user: User = {
            id: jwtPayload.sub || "",
            name: jwtPayload.username || "",
            email: jwtPayload.email || "",
          };

          const evmWallet =
            jwtPayload.verified_credentials
              ?.filter((cred: any) => cred.chain === "eip155")
              .sort(
                (a: any, b: any) =>
                  new Date(b.lastSelectedAt).getTime() -
                  new Date(a.lastSelectedAt).getTime()
              )
              .map((cred: any) => cred.address)[0] || null;

          console.log("EVM wallet found:", evmWallet);

          const cookieStore = await cookies();
          const referral = cookieStore.get("referral")?.value;

          return { ...user, walletAddress: evmWallet };
        } catch (e) {
          console.error("Authorization error:", e);
          return null;
        }
      },
    }),
  ],

  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.walletAddress =
          typeof token.walletAddress === "string" ? token.walletAddress : null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user && "walletAddress" in user) {
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    signIn: async ({ user }) => {
      console.log("signIn callback:", user);
      return true;
    },
  },
} satisfies NextAuthOptions;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      walletAddress?: string | null;
    };
  }

  interface JWT {
    id: string;
    walletAddress?: string | null;
  }
}
