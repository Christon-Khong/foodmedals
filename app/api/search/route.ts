import { NextRequest, NextResponse } from 'next/server'
import { searchAll } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2 || q.length > 100) return NextResponse.json({ restaurants: [], categories: [] })

  const results = await searchAll(q)
  return NextResponse.json(results)
}
