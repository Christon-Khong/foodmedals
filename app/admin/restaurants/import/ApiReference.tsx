'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

type Category = { id: string; name: string; iconEmoji: string; slug: string }

type Props = {
  categories: Category[]
  slugs: string[]
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-yellow-300 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>{label ?? 'Copy'}</span>
        </>
      )}
    </button>
  )
}

export function ApiReference({ categories, slugs }: Props) {
  const [open, setOpen] = useState(false)

  const slugList = slugs.join(', ')

  const slugJson = JSON.stringify(slugs, null, 2)

  const exampleBody = JSON.stringify({
    restaurants: [
      {
        name: "Joe's Burger Joint",
        address: "123 Main St",
        city: "Salt Lake City",
        state: "UT",
        zip: "84101",
        websiteUrl: "https://joesburgers.com",
        description: "Classic burgers and shakes",
        categorySlugs: ["burgers", "shakes"],
      },
    ],
  }, null, 2)

  const claudePrompt = `Research and import restaurants for [CITY, STATE] in the [CATEGORY] category to FoodMedals.

1. Research the top 20-30 [CATEGORY] restaurants in [CITY, STATE] using web search
2. For each restaurant, find: name, street address, city, state, zip, and website URL
3. Format as JSON and POST to the FoodMedals bulk import API:
   - Endpoint: POST https://foodmedals.com/api/admin/restaurants/import-direct
   - Auth header: Authorization: Bearer [PASTE_YOUR_ADMIN_API_KEY]
   - Content-Type: application/json
   - Body: { "restaurants": [{ "name", "address", "city", "state", "zip", "websiteUrl?", "description?", "categorySlugs?": [...] }] }
   - Max 50 restaurants per request
4. Report the results summary (successes, duplicates, errors)

Available category slugs: ${slugList}

Safeguards (already built into the API):
- Deduplicates by name + city (won't create duplicates)
- Validates every address via Google Maps geocoding (rejects unverifiable addresses)
- Only links active categories (ignores invalid slugs)
- Max 50 per request, 120s timeout`

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors w-full"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        API Reference &amp; Claude Cowork Instructions
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {/* Claude Cowork Prompt */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Claude Cowork Prompt</h3>
              <CopyButton text={claudePrompt} label="Copy prompt" />
            </div>
            <p className="text-xs text-gray-500">
              Paste this into Claude Cowork. Replace <code className="bg-gray-700 px-1 rounded text-yellow-300">[CITY, STATE]</code>, <code className="bg-gray-700 px-1 rounded text-yellow-300">[CATEGORY]</code>, and <code className="bg-gray-700 px-1 rounded text-yellow-300">[PASTE_YOUR_ADMIN_API_KEY]</code> with real values.
            </p>
            <pre className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-4 text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
              {claudePrompt}
            </pre>
          </div>

          {/* Category Slugs */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Active Category Slugs
                <span className="text-gray-600 font-normal ml-2">({slugs.length})</span>
              </h3>
              <div className="flex gap-3">
                <CopyButton text={slugList} label="Copy list" />
                <CopyButton text={slugJson} label="Copy JSON" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-gray-800 rounded-lg border border-gray-700/50"
                >
                  <span>{cat.iconEmoji}</span>
                  <span className="text-gray-400 truncate">{cat.name}</span>
                  <code className="ml-auto text-[10px] text-yellow-400/70 font-mono shrink-0">{cat.slug}</code>
                </div>
              ))}
            </div>
          </div>

          {/* API Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Direct Import API</h3>

            <div className="space-y-3 text-xs">
              {/* Endpoint */}
              <div>
                <span className="text-gray-500 font-medium">Endpoint</span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-gray-300 font-mono flex-1">
                    <span className="text-green-400">POST</span>{' '}
                    /api/admin/restaurants/import-direct
                  </code>
                  <CopyButton text="POST https://foodmedals.com/api/admin/restaurants/import-direct" />
                </div>
              </div>

              {/* Auth */}
              <div>
                <span className="text-gray-500 font-medium">Authentication</span>
                <div className="mt-1">
                  <code className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-gray-300 font-mono block">
                    Authorization: Bearer <span className="text-yellow-300">{'<ADMIN_API_KEY>'}</span>
                  </code>
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Request Body</span>
                  <CopyButton text={exampleBody} label="Copy example" />
                </div>
                <pre className="mt-1 bg-gray-800/80 border border-gray-700/50 rounded-xl p-3 text-gray-300 whitespace-pre-wrap overflow-x-auto leading-relaxed font-mono">
{exampleBody}
                </pre>
              </div>

              {/* Fields */}
              <div>
                <span className="text-gray-500 font-medium">Fields</span>
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">name</code>
                    <span className="text-gray-500">Required — restaurant name</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">address</code>
                    <span className="text-gray-500">Required — street address</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">city</code>
                    <span className="text-gray-500">Required</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">state</code>
                    <span className="text-gray-500">Required — 2-letter abbreviation</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">zip</code>
                    <span className="text-gray-500">Required — 5-digit ZIP</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">websiteUrl</code>
                    <span className="text-gray-500">Optional</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">description</code>
                    <span className="text-gray-500">Optional — short description</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-gray-300 font-mono w-28 shrink-0">categorySlugs</code>
                    <span className="text-gray-500">Optional — array of slugs from above</span>
                  </div>
                </div>
              </div>

              {/* Limits & Behavior */}
              <div>
                <span className="text-gray-500 font-medium">Limits &amp; Behavior</span>
                <ul className="mt-1.5 space-y-1 text-gray-400">
                  <li className="flex gap-2">
                    <span className="text-gray-600">&#8226;</span>
                    Max <span className="text-gray-300 font-medium">50 restaurants</span> per request
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-600">&#8226;</span>
                    Deduplicates by name + city (case-insensitive)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-600">&#8226;</span>
                    Validates addresses via Google Maps geocoding
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-600">&#8226;</span>
                    Created as <span className="text-green-400 font-medium">active</span> with verified category links
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-600">&#8226;</span>
                    120-second timeout
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
