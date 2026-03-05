import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseGoogleMapsUrl } from '@/lib/parse-maps-url'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await req.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const result = await parseGoogleMapsUrl(url)
    return NextResponse.json({
      name: result.name,
      address: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not parse URL'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
