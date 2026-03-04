import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

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

/** Check if a user is admin by email — checks both env var and DB field. */
export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  if (isAdminEmail(email)) return true
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { isAdmin: true },
  })
  return user?.isAdmin ?? false
}

/** Returns the session if the caller is an authenticated admin, otherwise null. */
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  if (!(await isAdmin(session.user.email))) return null
  return session
}
