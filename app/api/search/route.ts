import { NextRequest, NextResponse } from 'next/server'
import { searchAll, searchFull } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2 || q.length > 100) return NextResponse.json({ restaurants: [], categories: [] })

  const full = req.nextUrl.searchParams.get('full') === '1'
  const results = full ? await searchFull(q) : await searchAll(q)
  return NextResponse.json(results)
}
