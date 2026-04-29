import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { Client as NotionClient } from '@notionhq/client';
import { isFullPage } from '@notionhq/client';

const notion = process.env.NOTION_API_KEY
  ? new NotionClient({ auth: process.env.NOTION_API_KEY })
  : null;
const TRADIE_CONFIG_DB_ID = process.env.NOTION_TRADIE_CONFIG_DB_ID!;

// Test tradie for development (remove in production)
const TEST_TRADIE = {
  email: 'joey@tradie.test',
  name: 'Joey Tradie',
  tradieConfigId: 'ff9248a4dd244ad9a0761281967750ea',
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'joey@tradie.test' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // For development: allow test tradie
        if (credentials.email === TEST_TRADIE.email) {
          return {
            id: TEST_TRADIE.email,
            email: TEST_TRADIE.email,
            name: TEST_TRADIE.name,
            tradieConfigId: TEST_TRADIE.tradieConfigId,
          };
        }

        // In production, lookup in Notion
        if (!notion) return null;

        try {
          const response = await notion.databases.query({
            database_id: TRADIE_CONFIG_DB_ID,
            filter: {
              property: 'Email',
              email: { equals: credentials.email },
            },
          });

          if (response.results.length === 0) return null;

          const config = response.results[0];
          if (!isFullPage(config)) return null;

          const tradieConfigId = config.id.replace(/-/g, '');
          return {
            id: tradieConfigId,
            email: credentials.email,
            name:
              (config.properties['Name'] as any)?.[0]?.plain_text ||
              credentials.email,
            tradieConfigId,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tradieConfigId = (user as any).tradieConfigId ?? 'joey-tradie';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.tradieConfigId = (token.tradieConfigId as string) ?? 'joey-tradie';
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
