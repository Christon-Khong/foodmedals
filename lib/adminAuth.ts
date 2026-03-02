import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

/** Returns the session if the caller is an authenticated admin, otherwise null. */
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  if (!isAdminEmail(session.user.email)) return null
  return session
}
