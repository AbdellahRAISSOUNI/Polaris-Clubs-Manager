import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import { supabase } from "@/lib/supabase";

// Define the user type with role
interface CustomUser extends User {
  role?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // First, check if the user exists in Supabase
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !data) {
            // For demo purposes, use hardcoded users if not found in Supabase
            // In production, you would just return null here
            const demoUsers = [
              {
                id: "1",
                name: "Club User",
                email: "club@example.com",
                password: "password123",
                role: "club",
              },
              {
                id: "2",
                name: "Admin User",
                email: "admin@example.com",
                password: "password123",
                role: "admin",
              },
            ];

            const user = demoUsers.find((user) => user.email === credentials.email);
            
            if (user && user.password === credentials.password) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
            
            return null;
          }

          // In a real app, you would verify the password hash here
          // For demo purposes, we're assuming the password is correct if the user exists
          return {
            id: data.id,
            name: data.name || data.email.split('@')[0],
            email: data.email,
            role: data.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as CustomUser).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 