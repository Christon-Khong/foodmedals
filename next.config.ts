import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Limit parallel build workers so we stay under Neon's session-mode
    // PgBouncer pool_size cap (workers × pool.max must stay well below it).
    // With pool.max = 1 in lib/prisma.ts: 2 workers × 1 = 2 server connections.
    cpus: 2,
  },
}

export default nextConfig
