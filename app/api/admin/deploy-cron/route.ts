import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'

const GITHUB_REPO = 'Christon-Khong/foodmedals'
const BRANCH = 'main'

/** Helper to call the GitHub API */
async function ghApi(token: string, path: string, opts?: RequestInit) {
  return fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
  })
}

/**
 * Commit multiple file changes in a single commit using the Git Trees API.
 * This avoids triggering multiple Vercel builds.
 */
async function commitMultipleFiles(
  token: string,
  files: { path: string; content: string }[],
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  // 1. Get the latest commit SHA on the branch
  const refRes = await ghApi(token, `/git/ref/heads/${BRANCH}`)
  if (!refRes.ok) return { ok: false, error: `Failed to get branch ref: ${await refRes.text()}` }
  const refData = await refRes.json()
  const latestCommitSha = refData.object.sha

  // 2. Get the tree SHA of the latest commit
  const commitRes = await ghApi(token, `/git/commits/${latestCommitSha}`)
  if (!commitRes.ok) return { ok: false, error: `Failed to get commit: ${await commitRes.text()}` }
  const commitData = await commitRes.json()
  const baseTreeSha = commitData.tree.sha

  // 3. Create a new tree with all file changes
  const treeRes = await ghApi(token, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map(f => ({
        path: f.path,
        mode: '100644',
        type: 'blob',
        content: f.content,
      })),
    }),
  })
  if (!treeRes.ok) {
    const body = await treeRes.text()
    const hint = treeRes.status === 404
      ? ' (ensure GITHUB_TOKEN has "repo" and "workflow" scopes)'
      : ''
    return { ok: false, error: `Failed to create tree: ${body}${hint}` }
  }
  const treeData = await treeRes.json()

  // 4. Create a new commit pointing to the new tree
  const newCommitRes = await ghApi(token, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  })
  if (!newCommitRes.ok) return { ok: false, error: `Failed to create commit: ${await newCommitRes.text()}` }
  const newCommitData = await newCommitRes.json()

  // 5. Update the branch ref to point to the new commit
  const updateRefRes = await ghApi(token, `/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommitData.sha }),
  })
  if (!updateRefRes.ok) return { ok: false, error: `Failed to update ref: ${await updateRefRes.text()}` }

  return { ok: true }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured. Add a GitHub classic token with "repo" and "workflow" scopes to Vercel env vars.' },
      { status: 500 },
    )
  }

  const { cronHourUtc, cronMinuteUtc } = await req.json()
  const hour = Number(cronHourUtc)
  const minute = Number(cronMinuteUtc)
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return NextResponse.json({ error: 'Invalid cron time' }, { status: 400 })
  }

  const cronExpression = `${minute} ${hour} * * *`

  try {
    const workflowContent = `name: Discover Queue

# Runs daily to process the restaurant discover queue.
# Schedule is in UTC — update via admin Deploy Schedule button.
on:
  schedule:
    - cron: '${cronExpression}'
  workflow_dispatch:         # Allow manual trigger from Actions tab

jobs:
  process:
    name: Process Discover Queue
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Call process endpoint
        run: |
          RESPONSE=$(curl --silent --write-out "\\nHTTP_STATUS:%{http_code}" \\
            --max-time 300 \\
            --request GET \\
            "https://www.foodmedals.com/api/admin/restaurants/discover/queue/process" \\
            --header "Authorization: Bearer \${{ secrets.CRON_SECRET }}")

          HTTP_STATUS=$(echo "$RESPONSE" | tail -1 | sed 's/HTTP_STATUS://')
          BODY=$(echo "$RESPONSE" | sed '$d')

          echo "Status: $HTTP_STATUS"
          echo "Response: $BODY"

          if [ "$HTTP_STATUS" -ne 200 ]; then
            echo "Endpoint returned non-200 status"
            exit 1
          fi

          echo "Queue processed successfully"
`

    const vercelContent = JSON.stringify({
      framework: 'nextjs',
      crons: [{ path: '/api/admin/restaurants/discover/queue/process', schedule: cronExpression }],
    }, null, 2)

    const result = await commitMultipleFiles(
      token,
      [
        { path: '.github/workflows/discover-queue.yml', content: workflowContent },
        { path: 'vercel.json', content: vercelContent },
      ],
      `Update cron schedule to ${cronExpression} UTC`,
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, schedule: cronExpression })
  } catch (err) {
    return NextResponse.json({ error: `Deploy failed: ${(err as Error).message}` }, { status: 500 })
  }
}
