import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import { connectMongo } from "@/lib/mongodb";
import { User as UserModel } from "@/models/User";
import { Club } from "@/models/Club";

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
          await connectMongo();
          
          // First, check if the user exists in MongoDB (users table)
          const user = await UserModel.findOne({ email: credentials.email }).lean();

          if (user) {
            // In a real app, you would verify the password hash here (e.g., using bcrypt)
            // For demo purposes, we're checking if password matches
            // Note: This is insecure - implement proper password hashing in production
            if (user.password && user.password === credentials.password) {
              return {
                id: user.id,
                name: user.name || user.email.split('@')[0],
                email: user.email,
                role: user.role || 'club',
              };
            }
          }

          // If not found in users table, check clubs table (club login)
          const club = await Club.findOne({ email: credentials.email }).lean();
          
          if (club) {
            // Check club password
            if (club.password && club.password === credentials.password) {
              return {
                id: club.id,
                name: club.name,
                email: club.email,
                role: 'club',
              };
            }
          }

          // For demo purposes, use hardcoded users if not found
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

          const demoUser = demoUsers.find((u) => u.email === credentials.email);
          
          if (demoUser && demoUser.password === credentials.password) {
            return {
              id: demoUser.id,
              name: demoUser.name,
              email: demoUser.email,
              role: demoUser.role,
            };
          }
          
          return null;
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
        token.role = (user as CustomUser).role || 'club';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) || 'club';
        session.user.id = (token.id as string) || '';
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