import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getTradieByEmail } from '@/lib/notion'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // Admin access
        if (credentials.email === process.env.ADMIN_EMAIL) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            tradieConfigId: 'admin',
          }
        }

        // Lookup tradie in Notion CONFIG database by Email
        const tradie = await getTradieByEmail(credentials.email)
        if (!tradie) return null

        return {
          id: credentials.email,
          email: credentials.email,
          name: tradie.name,
          tradieConfigId: tradie.id,
        }
      }
    })
  ],
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.tradieConfigId = user.tradieConfigId
        token.email = user.email
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.tradieConfigId = token.tradieConfigId
        session.user.email = token.email
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
