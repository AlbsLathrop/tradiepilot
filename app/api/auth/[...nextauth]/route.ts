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
        console.log('[NextAuth authorize] Attempting sign-in:', { email: credentials?.email })

        if (!credentials?.email) {
          console.error('[NextAuth authorize] No email provided')
          return null
        }

        // Admin access
        if (credentials.email === process.env.ADMIN_EMAIL) {
          console.log('[NextAuth authorize] Admin sign-in successful:', { email: credentials.email })
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            tradieConfigId: 'admin',
          }
        }

        // Lookup tradie in Notion CONFIG database by Email
        console.log('[NextAuth authorize] Looking up tradie in Notion:', { email: credentials.email })
        const tradie = await getTradieByEmail(credentials.email)

        if (!tradie) {
          console.error('[NextAuth authorize] Tradie not found in Notion:', { email: credentials.email })
          return null
        }

        console.log('[NextAuth authorize] Tradie sign-in successful:', { email: credentials.email, tradieId: tradie.id, tradieName: tradie.name })
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
