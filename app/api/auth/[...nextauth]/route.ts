import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth({
  ...authOptions,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, ...message) {
      console.error('[NextAuth][error]', code, ...message)
    },
    warn(code) {
      console.warn('[NextAuth][warn]', code)
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NextAuth][debug]', code, ...message)
      }
    },
  },
})
export { handler as GET, handler as POST }
