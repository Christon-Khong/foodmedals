import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Force the Supabase pooler into transaction mode (port 6543) instead of
 * session mode (port 5432).  Transaction mode releases the backend
 * connection after each query, which prevents the "MaxClientsInSessionMode"
 * error in serverless environments where many function invocations run
 * concurrently.
 */
function toTransactionMode(url: string): string {
  return url.replace(
    /\.pooler\.supabase\.com:5432\b/,
    '.pooler.supabase.com:6543',
  )
}

const globalForPrisma = globalThis as unknown as {
  pool:   Pool | undefined
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString: toTransactionMode(process.env.DATABASE_URL!),
      max: 1,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  const adapter = new PrismaPg(globalForPrisma.pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
