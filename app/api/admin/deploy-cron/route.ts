import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'

const GITHUB_REPO = 'Christon-Khong/foodmedals'
const BRANCH = 'main'

async function updateGitHubFile(
  token: string,
  filePath: string,
  newContent: string,
  commitMessage: string,
): Promise<{ ok: boolean; error?: string }> {
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } },
  )
  if (!getRes.ok) {
    return { ok: false, error: `GitHub read failed for ${filePath}: ${await getRes.text()}` }
  }
  const fileData = await getRes.json()

  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(newContent).toString('base64'),
        sha: fileData.sha,
        branch: BRANCH,
      }),
    },
  )
  if (!putRes.ok) {
    return { ok: false, error: `GitHub write failed for ${filePath}: ${await putRes.text()}` }
  }
  return { ok: true }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured. Add a GitHub token with Contents write permission to Vercel env vars.' },
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
    // Update GitHub Actions workflow (primary scheduler)
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

    const workflowResult = await updateGitHubFile(
      token,
      '.github/workflows/discover-queue.yml',
      workflowContent,
      `Update cron schedule to ${cronExpression} UTC`,
    )
    if (!workflowResult.ok) {
      return NextResponse.json({ error: workflowResult.error }, { status: 500 })
    }

    // Also update vercel.json (backup, though Hobby plan is unreliable)
    const vercelContent = JSON.stringify({
      framework: 'nextjs',
      crons: [{ path: '/api/admin/restaurants/discover/queue/process', schedule: cronExpression }],
    }, null, 2)

    await updateGitHubFile(
      token,
      'vercel.json',
      vercelContent,
      `Update vercel.json cron schedule to ${cronExpression} UTC`,
    )

    return NextResponse.json({ ok: true, schedule: cronExpression })
  } catch (err) {
    return NextResponse.json({ error: `Deploy failed: ${(err as Error).message}` }, { status: 500 })
  }
}
