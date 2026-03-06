'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/CategoryIcon'
import dynamic from 'next/dynamic'
import { Sparkles, Loader2, Quote, Award, X, Pencil, EyeOff } from 'lucide-react'
import { useModalBack } from '@/lib/useModalBack'

const GoldCommentModal = dynamic(() => import('@/components/GoldCommentModal').then(m => m.GoldCommentModal), { ssr: false })

type Highlight = {
  id:           string
  userId:       string
  medalId:      string | null
  comment:      string
  photoUrl:     string | null
  createdAt:    string
  year:         number
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  userName:     string
  userSlug:     string | null
  userAvatar:   string | null
  upvoteCount:  number
  userCategoryCount: number
}

type Props = {
  highlights: Highlight[]
  totalCount: number
  restaurantId: string
  restaurantName: string
  isLoggedIn: boolean
  userUpvotedIds: string[]
  currentUserId?: string
  isAdmin?: boolean
}

type SortMode = 'popular' | 'newest'

// ─── Achievement tier definitions (matching critic profile page) ──────────

const TIERS: Array<{
  min: number; label: string; color: string;
  glow: string | null; glowDim: string | null; animated: boolean;
}> = [
  { min: 80, label: 'Oracle',        color: 'from-amber-200 to-yellow-100 text-amber-900 border-amber-300',
    glow:    '0 0 12px 3px rgba(251,191,36,0.4), 0 0 24px 6px rgba(245,158,11,0.2)',
    glowDim: '0 0 8px 2px rgba(251,191,36,0.18), 0 0 16px 4px rgba(245,158,11,0.08)',
    animated: true },
  { min: 60, label: 'Vanguard',      color: 'from-cyan-100 to-sky-100 text-cyan-800 border-cyan-200',
    glow:    '0 0 10px 3px rgba(6,182,212,0.35), 0 0 20px 5px rgba(14,165,233,0.18)',
    glowDim: '0 0 6px 2px rgba(6,182,212,0.15), 0 0 14px 3px rgba(14,165,233,0.07)',
    animated: true },
  { min: 45, label: 'The Palate',    color: 'from-rose-100 to-pink-100 text-rose-800 border-rose-200',
    glow:    '0 0 10px 3px rgba(244,63,94,0.3), 0 0 18px 5px rgba(236,72,153,0.15)',
    glowDim: '0 0 6px 2px rgba(244,63,94,0.13), 0 0 12px 3px rgba(236,72,153,0.06)',
    animated: true },
  { min: 30, label: 'Grand Curator', color: 'from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    glow:    '0 0 8px 2px rgba(99,102,241,0.28), 0 0 16px 4px rgba(79,70,229,0.12)',
    glowDim: '0 0 5px 1px rgba(99,102,241,0.12), 0 0 10px 2px rgba(79,70,229,0.05)',
    animated: true },
  { min: 20, label: 'Master Critic', color: 'from-purple-100 to-violet-100 text-purple-800 border-purple-200',
    glow:    '0 0 8px 2px rgba(168,85,247,0.25), 0 0 14px 3px rgba(139,92,246,0.1)',
    glowDim: '0 0 4px 1px rgba(168,85,247,0.1), 0 0 8px 2px rgba(139,92,246,0.04)',
    animated: true },
  { min: 12, label: 'Local Legend',  color: 'from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200',
    glow:    '0 0 6px 2px rgba(16,185,129,0.22), 0 0 12px 3px rgba(20,184,166,0.08)',
    glowDim: '0 0 4px 1px rgba(16,185,129,0.09), 0 0 8px 2px rgba(20,184,166,0.03)',
    animated: true },
  { min:  7, label: 'Silver Spoon',  color: 'from-slate-100 to-gray-100 text-slate-700 border-slate-200',
    glow:    '0 0 5px 1px rgba(148,163,184,0.2), 0 0 10px 2px rgba(100,116,139,0.07)',
    glowDim: '0 0 3px 1px rgba(148,163,184,0.08), 0 0 6px 1px rgba(100,116,139,0.03)',
    animated: true },
  { min:  4, label: 'Flavor Chaser', color: 'from-orange-100 to-amber-100 text-orange-800 border-orange-200',
    glow:    '0 0 5px 1px rgba(251,146,60,0.15)',
    glowDim: '0 0 3px 1px rgba(251,146,60,0.06)',
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

// ─── Sub-components ────────────────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size, tier }: {
  name: string
  avatarUrl: string | null
  size: number
  tier: ReturnType<typeof getAchievementTier>
}) {
  const animId = tier?.animated && tier.glow && tier.glowDim
    ? `highlight-aura-${tier.label.toLowerCase().replace(/\s+/g, '-')}`
    : null

  const avatar = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={name}
      width={size}
      height={size}
      className="rounded-full"
    />
  ) : (
    <div
      className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  )

  if (!tier?.glow) return avatar

  return (
    <>
      {animId && (
        <style>{`
          @keyframes ${animId} {
            0%, 100% { box-shadow: ${tier.glow}; }
            50% { box-shadow: ${tier.glowDim}; }
          }
        `}</style>
      )}
      <div
        className="rounded-full"
        style={{
          animation: animId ? `${animId} 3s ease-in-out infinite` : undefined,
          boxShadow: !animId && tier.glow ? tier.glow : undefined,
        }}
      >
        {avatar}
      </div>
    </>
  )
}

function HighFiveButton({
  commentId,
  initialUpvoted,
  initialCount,
  isLoggedIn,
}: {
  commentId: string
  initialUpvoted: boolean
  initialCount: number
  isLoggedIn: boolean
}) {
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [count, setCount] = useState(initialCount)
  const [toggling, setToggling] = useState(false)

  const handleClick = async () => {
    if (!isLoggedIn || toggling) return
    setToggling(true)

    const wasUpvoted = upvoted
    setUpvoted(!wasUpvoted)
    setCount(prev => wasUpvoted ? prev - 1 : prev + 1)

    try {
      const res = await fetch(`/api/comments/${commentId}/upvote`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setUpvoted(data.upvoted)
        setCount(data.count)
      } else {
        setUpvoted(wasUpvoted)
        setCount(prev => wasUpvoted ? prev + 1 : prev - 1)
      }
    } catch {
      setUpvoted(wasUpvoted)
      setCount(prev => wasUpvoted ? prev + 1 : prev - 1)
    } finally {
      setToggling(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isLoggedIn}
      title={isLoggedIn ? (upvoted ? 'Remove high five' : 'High five — you agree!') : 'Sign in to high five'}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border-2 transition-all duration-200 ${
        upvoted
          ? 'bg-yellow-100 border-yellow-400 text-yellow-800 scale-105 shadow-sm'
          : 'bg-white border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50'
      } ${!isLoggedIn ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-95'}`}
    >
      <span className="text-base leading-none">{upvoted ? '🙌' : '🖐️'}</span>
      {count > 0 ? count : 'High Five'}
    </button>
  )
}

function HighlightCard({
  highlight,
  isLoggedIn,
  upvoted,
  restaurantName,
  onPhotoClick,
  canEdit,
  canHide,
  onEdit,
  onHide,
}: {
  highlight: Highlight
  isLoggedIn: boolean
  upvoted: boolean
  restaurantName: string
  onPhotoClick: (url: string) => void
  canEdit: boolean
  canHide: boolean
  onEdit: () => void
  onHide: () => void
}) {
  const tier = getAchievementTier(highlight.userCategoryCount)
  const [hiding, setHiding] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Quote body — the hero */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Quote className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 rotate-180" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canEdit && (
              <button
                onClick={onEdit}
                title="Edit comment"
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-yellow-700 transition-colors px-2 py-1 rounded-lg hover:bg-yellow-50"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            )}
            {canHide && (
              <button
                onClick={async () => {
                  if (hiding) return
                  setHiding(true)
                  try {
                    const res = await fetch(`/api/comments/${highlight.id}/hide`, { method: 'POST' })
                    if (res.ok) onHide()
                  } finally {
                    setHiding(false)
                  }
                }}
                disabled={hiding}
                title="Hide comment (admin)"
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <EyeOff className="w-3 h-3" />
                Hide
              </button>
            )}
          </div>
        </div>
        <p className="font-[family-name:var(--font-lora)] italic text-gray-800 text-lg sm:text-xl leading-relaxed">
          {highlight.comment}
        </p>
        <div className="flex justify-end mt-1">
          <Quote className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        </div>
      </div>

      {/* Review photo */}
      {highlight.photoUrl && (
        <div className="mx-6 mb-4">
          <button
            type="button"
            onClick={() => onPhotoClick(highlight.photoUrl!)}
            className="block w-full max-h-[300px] overflow-hidden rounded-xl ring-1 ring-black/5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
          >
            <Image
              src={highlight.photoUrl}
              alt={`${highlight.userName}'s Gold review of ${restaurantName}`}
              width={600}
              height={300}
              className="w-full object-cover"
              style={{ maxHeight: 300 }}
            />
          </button>
        </div>
      )}

      {/* Attribution bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-gradient-to-r from-amber-50/80 to-yellow-50/60 border-t border-amber-100">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with tier aura */}
          <div className="flex-shrink-0">
            {highlight.userSlug ? (
              <Link href={`/critics/${highlight.userSlug}`}>
                <UserAvatar name={highlight.userName} avatarUrl={highlight.userAvatar} size={40} tier={tier} />
              </Link>
            ) : (
              <UserAvatar name={highlight.userName} avatarUrl={highlight.userAvatar} size={40} tier={tier} />
            )}
          </div>

          {/* Name + badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {highlight.userSlug ? (
                <Link
                  href={`/critics/${highlight.userSlug}`}
                  className="text-sm font-bold text-gray-900 hover:text-yellow-700 transition-colors truncate"
                >
                  {highlight.userName}
                </Link>
              ) : (
                <span className="text-sm font-bold text-gray-900 truncate">{highlight.userName}</span>
              )}
              {tier && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r ${tier.color} px-2 py-0.5 rounded-full border`}>
                  <Award className="w-2.5 h-2.5" />
                  {tier.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Link
                href={`/categories/${highlight.categorySlug}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-yellow-800 transition-colors"
              >
                <CategoryIcon slug={highlight.categorySlug} iconEmoji={highlight.iconEmoji} iconUrl={highlight.iconUrl} />
                {highlight.categoryName}
              </Link>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] font-medium text-gray-400 flex items-center gap-0.5">
                <Image src="/medals/gold.webp" alt="gold" width={10} height={10} />
                {highlight.year}
              </span>
            </div>
          </div>
        </div>

        {/* High Five */}
        <div className="flex-shrink-0">
          <HighFiveButton
            commentId={highlight.id}
            initialUpvoted={upvoted}
            initialCount={highlight.upvoteCount}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function RestaurantHighlights({ highlights: initialHighlights, totalCount, restaurantId, restaurantName, isLoggedIn, userUpvotedIds, currentUserId, isAdmin }: Props) {
  const [sort, setSort] = useState<SortMode>('popular')
  const [allHighlights, setAllHighlights] = useState<Highlight[]>(initialHighlights)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHighlights.length < totalCount)

  const [currentSort, setCurrentSort] = useState<SortMode>('popular')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const closeLightbox = useCallback(() => setLightboxUrl(null), [])
  useModalBack(!!lightboxUrl, closeLightbox)
  const [commentPrompt, setCommentPrompt] = useState<{
    medalId: string
    restaurantName: string
    categoryName: string
    initialComment: string
    initialPhotoUrl: string | null
    highlightId: string
  } | null>(null)

  const handleSortChange = useCallback(async (newSort: SortMode) => {
    if (newSort === currentSort) return
    setSort(newSort)
    setCurrentSort(newSort)
    setLoading(true)

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/highlights?limit=10&offset=0&sort=${newSort}`
      )
      if (res.ok) {
        const data = await res.json()
        setAllHighlights(data.highlights)
        setHasMore(data.hasMore)
      }
    } catch {
      // Keep current data on error
    } finally {
      setLoading(false)
    }
  }, [currentSort, restaurantId])

  const handleLoadMore = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/highlights?limit=10&offset=${allHighlights.length}&sort=${currentSort}`
      )
      if (res.ok) {
        const data = await res.json()
        setAllHighlights(prev => [...prev, ...data.highlights])
        setHasMore(data.hasMore)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, allHighlights.length, restaurantId, currentSort])

  const displayed = useMemo(() => {
    if (sort === 'newest' && currentSort === 'popular') {
      return [...allHighlights].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    return allHighlights
  }, [allHighlights, sort, currentSort])

  if (totalCount === 0) return null

  const remaining = totalCount - allHighlights.length

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          What people are saying
          {totalCount > 1 && (
            <span className="text-sm font-normal text-gray-400">({totalCount})</span>
          )}
        </h2>

        {totalCount > 1 && (
          <div className="flex bg-white rounded-full border border-gray-200 p-0.5">
            <button
              onClick={() => handleSortChange('popular')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sort === 'popular' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => handleSortChange('newest')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sort === 'newest' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Newest
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {displayed.map(h => (
          <HighlightCard
            key={h.id}
            highlight={h}
            isLoggedIn={isLoggedIn}
            upvoted={userUpvotedIds.includes(h.id)}
            restaurantName={restaurantName}
            onPhotoClick={setLightboxUrl}
            canEdit={!!currentUserId && h.userId === currentUserId && !!h.medalId}
            canHide={!!isAdmin}
            onEdit={() => {
              if (h.medalId) {
                setCommentPrompt({
                  medalId: h.medalId,
                  restaurantName,
                  categoryName: h.categoryName,
                  initialComment: h.comment,
                  initialPhotoUrl: h.photoUrl,
                  highlightId: h.id,
                })
              }
            }}
            onHide={() => {
              setAllHighlights(prev => prev.filter(x => x.id !== h.id))
            }}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-5 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-yellow-700 bg-white border border-yellow-300 rounded-full hover:bg-yellow-50 hover:border-yellow-400 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Show more (${remaining} remaining)`
            )}
          </button>
        </div>
      )}

      {/* Edit comment modal */}
      {commentPrompt && (
        <GoldCommentModal
          medalId={commentPrompt.medalId}
          restaurantName={commentPrompt.restaurantName}
          categoryName={commentPrompt.categoryName}
          initialComment={commentPrompt.initialComment}
          initialPhotoUrl={commentPrompt.initialPhotoUrl}
          onClose={() => setCommentPrompt(null)}
          onSaved={(newComment, newPhotoUrl) => {
            setAllHighlights(prev =>
              prev.map(h =>
                h.id === commentPrompt.highlightId
                  ? { ...h, comment: newComment, photoUrl: newPhotoUrl ?? h.photoUrl }
                  : h
              )
            )
            setCommentPrompt(null)
          }}
        />
      )}

      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size review photo"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
