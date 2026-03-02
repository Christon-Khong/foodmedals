import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Limit parallel build workers so we stay under the Supabase
    // Session Pooler's 15-connection cap (workers × pool.max must stay < 15).
    cpus: 4,
  },
}

export default nextConfig
