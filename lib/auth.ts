import { NextAuthOptions } from 'next-auth'
import type { Adapter, AdapterUser, AdapterAccount } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import TwitterProvider from 'next-auth/providers/twitter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/* ── Custom adapter (maps displayName/avatarUrl ↔ name/image) ── */

function toAdapterUser(user: {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: Date
}): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: null,
    name: user.displayName,
    image: user.avatarUrl,
  }
}

function foodMedalsAdapter(): Adapter {
  return {
    async createUser(data: { name?: string | null; email: string; image?: string | null; emailVerified?: Date | null }) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          displayName: data.name ?? data.email.split('@')[0],
          avatarUrl: data.image ?? null,
        },
      })
      return toAdapterUser(user)
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } })
      return user ? toAdapterUser(user) : null
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } })
      return user ? toAdapterUser(user) : null
    },

    async getUserByAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      })
      return account ? toAdapterUser(account.user) : null
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          ...(data.name  != null     && { displayName: data.name  }),
          ...(data.image !== undefined && { avatarUrl:   data.image }),
          ...(data.email !== undefined && { email:       data.email }),
        },
      })
      return toAdapterUser(user)
    },

    async linkAccount(data: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token ?? null,
          access_token: data.access_token ?? null,
          expires_at: data.expires_at ?? null,
          token_type: data.token_type ?? null,
          scope: data.scope ?? null,
          id_token: data.id_token ?? null,
          session_state: (data.session_state as string) ?? null,
        },
      })
    },

    async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      })
    },

    // Not used with JWT strategy but required by the interface
    async createSession() { return null as any },
    async getSessionAndUser() { return null },
    async updateSession() { return null as any },
    async deleteSession() {},
    async createVerificationToken() { return null },
    async useVerificationToken() { return null },
  }
}

/* ── Auth options ───────────────────────────────────── */

export const authOptions: NextAuthOptions = {
  adapter: foodMedalsAdapter(),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
      allowDangerousEmailAccountLinking: false,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id:    user.id,
          email: user.email,
          name:  user.displayName,
          image: user.avatarUrl ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
}
