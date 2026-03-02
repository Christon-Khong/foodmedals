import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Cap connections so that 4 build workers × 3 = 12,
// safely under the Supabase Session Pooler's 15-connection limit.
const POOL_MAX = 3

const globalForPrisma = globalThis as unknown as {
  pool:   Pool | undefined
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: POOL_MAX,
    })
  }
  const adapter = new PrismaPg(globalForPrisma.pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
