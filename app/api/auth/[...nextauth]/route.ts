import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' }
      },
      async authorize(credentials) {
        const allowed = [
          'joey@tradie.test',
          'ben@tradie.test',
          process.env.ADMIN_EMAIL,
        ].filter(Boolean)

        if (credentials?.email &&
            allowed.includes(credentials.email)) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            tradieConfigId: credentials.email === 'ben@tradie.test'
              ? 'ben-stonemason'
              : 'joey-tradie',
          }
        }
        return null
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
