'use client'

import { useState } from 'react'
import { CategoryIcon } from '@/components/CategoryIcon'

type Category = {
  id: string
  name: string
  iconEmoji: string
  iconUrl: string | null
  slug: string
}

type ImportResult = {
  url: string
  status: 'success' | 'error' | 'duplicate'
  name?: string
  slug?: string
  restaurantId?: string
  error?: string
}

type Props = {
  categories: Category[]
}

export function BulkImportForm({ categories }: Props) {
  const [mode, setMode] = useState<'textarea' | 'csv'>('textarea')
  const [urlText, setUrlText] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [sharedCategoryIds, setSharedCategoryIds] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [summary, setSummary] = useState<{
    total: number; success: number; duplicates: number; errors: number
  } | null>(null)
  const [error, setError] = useState('')

  function toggleCategory(id: string) {
    setSharedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleImport() {
    setImporting(true)
    setError('')
    setResults([])
    setSummary(null)

    try {
      let body: { urls: Array<{ url: string; categoryIds?: string[] }>; sharedCategoryIds?: string[] }

      if (mode === 'textarea') {
        const lines = urlText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)

        if (lines.length === 0) {
          setError('Paste at least one URL')
          setImporting(false)
          return
        }
        if (lines.length > 50) {
          setError('Maximum 50 URLs per batch')
          setImporting(false)
          return
        }

        body = {
          urls: lines.map(url => ({ url })),
          sharedCategoryIds: sharedCategoryIds.length > 0 ? sharedCategoryIds : undefined,
        }
      } else {
        if (!csvFile) {
          setError('Select a CSV file')
          setImporting(false)
          return
        }

        const text = await csvFile.text()
        const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0)
        if (rows.length < 2) {
          setError('CSV must have a header row and at least one data row')
          setImporting(false)
          return
        }

        const headers = rows[0].toLowerCase().split(',').map(h => h.trim())
        const urlCol = headers.indexOf('url')
        if (urlCol === -1) {
          setError('CSV must have a "url" column')
          setImporting(false)
          return
        }
        const catCol = headers.indexOf('categories')

        // Build slug → id map for category lookups
        const slugToId = new Map(categories.map(c => [c.slug, c.id]))

        const urls: Array<{ url: string; categoryIds?: string[] }> = []
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(c => c.trim())
          const url = cols[urlCol]
          if (!url) continue

          let categoryIds: string[] | undefined
          if (catCol !== -1 && cols[catCol]) {
            const slugs = cols[catCol].split(';').map(s => s.trim()).filter(Boolean)
            const ids = slugs.map(s => slugToId.get(s)).filter((id): id is string => !!id)
            if (ids.length > 0) categoryIds = ids
          }

          urls.push({ url, categoryIds })
        }

        if (urls.length === 0) {
          setError('No valid rows found in CSV')
          setImporting(false)
          return
        }
        if (urls.length > 50) {
          setError('Maximum 50 URLs per batch')
          setImporting(false)
          return
        }

        body = {
          urls,
          sharedCategoryIds: sharedCategoryIds.length > 0 ? sharedCategoryIds : undefined,
        }
      }

      const res = await fetch('/api/admin/restaurants/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Import failed')
        setImporting(false)
        return
      }

      const data = await res.json()
      setResults(data.results)
      setSummary(data.summary)
    } catch {
      setError('Network error — please try again')
    } finally {
      setImporting(false)
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500'

  const urlCount = mode === 'textarea'
    ? urlText.split('\n').map(l => l.trim()).filter(l => l.length > 0).length
    : 0

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setMode('textarea')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'textarea'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Paste URLs
        </button>
        <button
          type="button"
          onClick={() => setMode('csv')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'csv'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Upload CSV
        </button>
      </div>

      {/* Input area */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {mode === 'textarea' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Google Maps URLs
              {urlCount > 0 && (
                <span className="text-gray-500 font-normal ml-2">({urlCount} URL{urlCount !== 1 ? 's' : ''})</span>
              )}
            </label>
            <textarea
              value={urlText}
              onChange={e => setUrlText(e.target.value)}
              placeholder={'Paste Google Maps URLs, one per line...\nhttps://maps.app.goo.gl/abc123\nhttps://www.google.com/maps/place/...'}
              rows={10}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-2">
              One URL per line. Accepts full Google Maps URLs or shortened links (maps.app.goo.gl).
              Categories selected below will apply to all URLs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">CSV File</label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={e => setCsvFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600 cursor-pointer"
              />
              {csvFile && (
                <p className="text-xs text-gray-400 mt-1">{csvFile.name}</p>
              )}
            </div>

            {/* CSV format instructions */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CSV Format</h3>
              <div className="text-xs text-gray-400 space-y-1.5">
                <p>
                  <span className="text-gray-300 font-medium">Required column:</span>{' '}
                  <code className="bg-gray-700 px-1.5 py-0.5 rounded text-yellow-300">url</code> — a Google Maps URL
                </p>
                <p>
                  <span className="text-gray-300 font-medium">Optional column:</span>{' '}
                  <code className="bg-gray-700 px-1.5 py-0.5 rounded text-yellow-300">categories</code> — category slugs separated by semicolons
                </p>
                <p className="text-gray-500">
                  Rows without a <code className="bg-gray-700 px-1 rounded">categories</code> column will use the default categories selected below.
                </p>
              </div>

              {/* Example table */}
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-gray-700/50 text-gray-300">
                      <th className="text-left px-3 py-2 font-semibold border-r border-gray-700">url</th>
                      <th className="text-left px-3 py-2 font-semibold">categories</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    <tr className="border-t border-gray-700/50">
                      <td className="px-3 py-1.5 border-r border-gray-700 text-gray-300">https://maps.app.goo.gl/abc123</td>
                      <td className="px-3 py-1.5">burgers;fries</td>
                    </tr>
                    <tr className="border-t border-gray-700/50">
                      <td className="px-3 py-1.5 border-r border-gray-700 text-gray-300">https://www.google.com/maps/place/...</td>
                      <td className="px-3 py-1.5">pizza;pasta;wings</td>
                    </tr>
                    <tr className="border-t border-gray-700/50">
                      <td className="px-3 py-1.5 border-r border-gray-700 text-gray-300">https://maps.app.goo.gl/xyz789</td>
                      <td className="px-3 py-1.5 text-gray-600 italic">{'(empty — uses default categories)'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-gray-500">
                Category slugs can be found in the URL of each category page (e.g., <code className="bg-gray-700 px-1 rounded">/categories/burgers</code> {'→'} slug is <code className="bg-gray-700 px-1 rounded">burgers</code>).
                Use semicolons to separate multiple categories, not commas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Default Categories
          <span className="text-gray-600 font-normal normal-case tracking-normal ml-2">
            (applied to URLs without per-row categories)
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
          {categories.map(cat => {
            const selected = sharedCategoryIds.includes(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                  selected
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
                <span className="min-w-0">
                  <span className="block truncate">{cat.name}</span>
                  <span className={`block truncate text-[10px] ${selected ? 'text-yellow-500/60' : 'text-gray-600'}`}>{cat.slug}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Import button */}
      <button
        type="button"
        onClick={handleImport}
        disabled={importing}
        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {importing ? 'Importing… (this may take a minute)' : 'Import Restaurants'}
      </button>

      {/* Results */}
      {summary && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex gap-3 text-sm">
            <span className="bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg">
              {summary.success} imported
            </span>
            {summary.duplicates > 0 && (
              <span className="bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
                {summary.duplicates} duplicate{summary.duplicates !== 1 ? 's' : ''}
              </span>
            )}
            {summary.errors > 0 && (
              <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg">
                {summary.errors} error{summary.errors !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Per-row results */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      {r.status === 'success' && (
                        <span className="text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                          Imported
                        </span>
                      )}
                      {r.status === 'duplicate' && (
                        <span className="text-xs font-medium bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                          Duplicate
                        </span>
                      )}
                      {r.status === 'error' && (
                        <span className="text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {r.status === 'success' && r.slug ? (
                        <a
                          href={`/restaurants/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:underline"
                        >
                          {r.name}
                        </a>
                      ) : (
                        <span className="text-gray-400">{r.name || truncateUrl(r.url)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">
                      {r.error || truncateUrl(r.url)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function truncateUrl(url: string, maxLen = 60) {
  if (url.length <= maxLen) return url
  return url.slice(0, maxLen) + '…'
}
