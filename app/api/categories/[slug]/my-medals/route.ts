import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategoryBySlug, getUserMedalsForCategory } from '@/lib/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const year = parseInt(req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear()), 10)

  const category = await getCategoryBySlug(slug)
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const medals = await getUserMedalsForCategory(session.user.id, category.id, year)
  return NextResponse.json({ medals, year })
}
