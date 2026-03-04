import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function MyMedalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/my-medals')

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { slug: true },
  })

  if (dbUser?.slug) {
    redirect(`/critics/${dbUser.slug}`)
  }

  // Fallback: if user has no slug somehow, redirect to categories
  redirect('/categories')
}
