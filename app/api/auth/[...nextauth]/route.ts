import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth({
  ...authOptions,
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('[NextAuth][error]', code, ...message)
    },
    warn(code) {
      console.warn('[NextAuth][warn]', code)
    },
    debug(code, ...message) {
      console.log('[NextAuth][debug]', code, ...message)
    },
  },
})
export { handler as GET, handler as POST }
