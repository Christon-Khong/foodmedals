import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, getAllActiveCategories, getTrendingCategoriesInCity } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { ShareProfileButton } from '@/components/ShareProfileButton'
import { CrownJewelCard } from '@/components/CrownJewelCard'
import { TrophyCaseGrid } from '@/components/TrophyCaseGrid'
import { ProfileAvatarUpload } from '@/components/ProfileAvatarUpload'
import { Trophy, LayoutGrid, Calendar, Award } from 'lucide-react'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const profile = await getUserProfile(slug)
  if (!profile) return { title: 'Critic Not Found — FoodMedals' }
  return {
    title: `${profile.user.displayName} — Food Critic | FoodMedals`,
    description: `${profile.user.displayName}'s food rankings and medal picks on FoodMedals.`,
  }
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
      {initials}
    </div>
  )
}

const TIERS: Array<{
  min: number; label: string; color: string;
  glow: string | null; glowDim: string | null; animated: boolean;
}> = [
  { min: 80, label: 'Oracle',        color: 'from-amber-200 to-yellow-100 text-amber-900 border-amber-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 60, label: 'Vanguard',      color: 'from-cyan-100 to-sky-100 text-cyan-800 border-cyan-200',
    glow:    '0 0 18px 5px rgba(6,182,212,0.45), 0 0 36px 10px rgba(14,165,233,0.25), 0 0 50px 16px rgba(6,182,212,0.12)',
    glowDim: '0 0 12px 3px rgba(6,182,212,0.2), 0 0 24px 6px rgba(14,165,233,0.1), 0 0 34px 10px rgba(6,182,212,0.05)',
    animated: true },
  { min: 45, label: 'The Palate',    color: 'from-rose-100 to-pink-100 text-rose-800 border-rose-200',
    glow:    '0 0 16px 4px rgba(244,63,94,0.4), 0 0 32px 8px rgba(236,72,153,0.2), 0 0 44px 14px rgba(244,63,94,0.1)',
    glowDim: '0 0 10px 3px rgba(244,63,94,0.18), 0 0 20px 5px rgba(236,72,153,0.08), 0 0 30px 8px rgba(244,63,94,0.04)',
    animated: true },
  { min: 30, label: 'Grand Curator', color: 'from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    glow:    '0 0 14px 4px rgba(99,102,241,0.35), 0 0 28px 8px rgba(79,70,229,0.18)',
    glowDim: '0 0 8px 3px rgba(99,102,241,0.15), 0 0 18px 5px rgba(79,70,229,0.08)',
    animated: true },
  { min: 20, label: 'Master Critic', color: 'from-purple-100 to-violet-100 text-purple-800 border-purple-200',
    glow:    '0 0 12px 3px rgba(168,85,247,0.3), 0 0 24px 6px rgba(139,92,246,0.15)',
    glowDim: '0 0 7px 2px rgba(168,85,247,0.13), 0 0 16px 4px rgba(139,92,246,0.06)',
    animated: true },
  { min: 12, label: 'Local Legend',  color: 'from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200',
    glow:    '0 0 10px 3px rgba(16,185,129,0.28), 0 0 20px 5px rgba(20,184,166,0.12)',
    glowDim: '0 0 6px 2px rgba(16,185,129,0.12), 0 0 14px 3px rgba(20,184,166,0.05)',
    animated: true },
  { min:  7, label: 'Silver Spoon',  color: 'from-slate-100 to-gray-100 text-slate-700 border-slate-200',
    glow:    '0 0 8px 2px rgba(148,163,184,0.25), 0 0 16px 4px rgba(100,116,139,0.1)',
    glowDim: '0 0 5px 1px rgba(148,163,184,0.1), 0 0 10px 2px rgba(100,116,139,0.04)',
    animated: true },
  { min:  4, label: 'Flavor Chaser', color: 'from-orange-100 to-amber-100 text-orange-800 border-orange-200',
    glow:    '0 0 8px 2px rgba(251,146,60,0.2)',
    glowDim: '0 0 4px 1px rgba(251,146,60,0.08)',
    animated: true },
  { min:  2, label: 'Food Scout',    color: 'from-lime-100 to-green-100 text-lime-800 border-lime-200',
    glow: null, glowDim: null, animated: false },
  { min:  1, label: 'Taste Tester',  color: 'from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200',
    glow: null, glowDim: null, animated: false },
]

function getAchievementTier(categoryCount: number) {
  for (const tier of TIERS) {
    if (categoryCount >= tier.min) return tier
  }
  return null
}

export default async function CriticProfilePage({ params }: Props) {
  const { slug } = await params
  const [profile, session] = await Promise.all([
    getUserProfile(slug),
    getServerSession(authOptions),
  ])
  if (!profile) notFound()

  const { user, medals, year } = profile
  const isOwner = session?.user?.id === user.id

  // Group medals by category
  const byCategory = medals.reduce<Record<string, typeof medals>>(
    (acc, m) => {
      const key = m.foodCategoryId
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {},
  )

  const memberSince = user.createdAt.getFullYear()
  const categoriesVoted = Object.keys(byCategory).length

  // Expertise badges: categories where all 3 medals awarded
  const expertCategories = Object.values(byCategory)
    .filter(m => m.length === 3)
    .map(m => m[0].foodCategory.name)

  // Achievement tier
  const achievementTier = getAchievementTier(categoriesVoted)

  // Owner engagement: fetch all categories + trending to compute unranked
  let totalCategories: number | undefined
  let unrankedCategories: Array<{ id: string; name: string; slug: string; iconEmoji: string; iconUrl: string | null; trendingCount?: number }> | undefined

  if (isOwner) {
    const rankedIds = new Set(Object.keys(byCategory))
    const [allCategories, trending] = await Promise.all([
      getAllActiveCategories(),
      user.city && user.state
        ? getTrendingCategoriesInCity(year, user.city, user.state)
        : Promise.resolve([]),
    ])
    totalCategories = allCategories.length
    const trendingMap = new Map(trending.map(t => [t.categoryId, t.medalCount]))

    unrankedCategories = allCategories
      .filter(c => !rankedIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconEmoji: c.iconEmoji,
        iconUrl: c.iconUrl,
        trendingCount: trendingMap.get(c.id),
      }))
      .sort((a, b) => (b.trendingCount ?? 0) - (a.trendingCount ?? 0))
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {achievementTier?.animated && achievementTier.glow && achievementTier.glowDim && (
        <style>{`
          @keyframes aura-pulse {
            0%, 100% { box-shadow: ${achievementTier.glow}; }
            50% { box-shadow: ${achievementTier.glowDim}; }
          }
          .aura-animated { animation: aura-pulse 3s ease-in-out infinite; }
        `}</style>
      )}

      {/* Profile header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            <div
              className={`flex-shrink-0 rounded-full ${achievementTier?.animated ? 'aura-animated' : ''}`}
              style={achievementTier?.glow && !achievementTier.animated ? { boxShadow: achievementTier.glow } : undefined}
            >
              {isOwner ? (
                <ProfileAvatarUpload
                  currentAvatarUrl={user.avatarUrl}
                  displayName={user.displayName}
                />
              ) : user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={80}
                  height={80}
                  className="rounded-full shadow-lg"
                />
              ) : (
                <Initials name={user.displayName} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                  {achievementTier && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r ${achievementTier.color} px-2.5 py-0.5 rounded-full border`}>
                      <Award className="w-3 h-3" />
                      {achievementTier.label}
                    </span>
                  )}
                </div>
                <ShareProfileButton />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {user.city && user.state ? `${user.city}, ${user.state}` : 'Food Critic'}
              </p>

              {/* Expertise badges */}
              {expertCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {expertCategories.map(name => (
                    <span
                      key={name}
                      className="text-[11px] font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2.5 py-0.5 rounded-full border border-yellow-200"
                    >
                      {name} Expert
                    </span>
                  ))}
                </div>
              )}

              {/* Stats bar */}
              <div className="flex items-center gap-5 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-gray-700">{medals.length}</span> medal{medals.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-gray-700">{categoriesVoted}</span> categor{categoriesVoted !== 1 ? 'ies' : 'y'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  Since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crown Jewel + Category Pills — narrower container */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {medals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-amber-100">
            <div className="mb-4 flex justify-center">
              <Image src="/medals/gold.webp" alt="medals" width={48} height={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-1">No medals yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              {isOwner ? 'Browse a category and award your first Gold medal.' : "This critic hasn't awarded any medals yet."}
            </p>
            {isOwner && (
              <Link
                href="/categories"
                className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-2.5 rounded-full transition-colors"
              >
                Browse categories
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Crown Jewel */}
            <div className="max-w-2xl">
              {medals.some(m => m.medalType === 'gold') ? (
                <CrownJewelCard
                  medals={medals}
                  crownJewelMedalId={user.crownJewelMedalId}
                  isOwner={isOwner}
                />
              ) : isOwner ? (
                <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200/60 p-5">
                  <div className="flex items-start gap-3">
                    <Image src="/medals/gold.webp" alt="Gold Medal" width={36} height={36} className="flex-shrink-0 mt-0.5 opacity-40" />
                    <div>
                      <h3 className="text-sm font-bold text-yellow-800">Crown Jewel</h3>
                      <p className="text-xs text-yellow-700/70 mt-1 leading-relaxed">
                        Your Crown Jewel is your absolute #1 restaurant pick. It earns that restaurant a bonus point on the leaderboard. Award a Gold medal in any category to unlock it!
                      </p>
                      <Link
                        href="/categories"
                        className="inline-block mt-3 text-xs font-bold text-yellow-700 hover:text-yellow-900 bg-yellow-200/60 hover:bg-yellow-200 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Browse categories
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Trophy Case Grid */}
            <TrophyCaseGrid
              byCategory={byCategory}
              year={year}
              isOwner={isOwner}
              isAdmin={session?.user?.isAdmin ?? false}
              totalCategories={totalCategories}
              rankedCount={categoriesVoted}
              unrankedCategories={unrankedCategories}
              userCity={user.city ?? undefined}
            />
          </>
        )}

        {/* Bottom spacing */}
        <div className="pb-8" />
      </div>
    </div>
  )
}
