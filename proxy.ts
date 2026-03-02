import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/auth/signin' },
})

export const config = {
  matcher: [
    '/categories/:slug*/award',
    '/my-medals',
    '/suggest/:path*',
    '/admin/:path*',
  ],
}
