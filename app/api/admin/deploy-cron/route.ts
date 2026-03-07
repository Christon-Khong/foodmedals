import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'

const GITHUB_REPO = 'Christon-Khong/foodmedals'
const FILE_PATH = 'vercel.json'
const BRANCH = 'main'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured. Add a fine-grained GitHub token with Contents write permission to Vercel env vars.' },
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
  const newContent = JSON.stringify({
    framework: 'nextjs',
    crons: [{ path: '/api/admin/restaurants/discover/queue/process', schedule: cronExpression }],
  }, null, 2)

  try {
    // Get the current file SHA (required for updates)
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } },
    )
    if (!getRes.ok) {
      const err = await getRes.text()
      return NextResponse.json({ error: `GitHub read failed: ${err}` }, { status: 500 })
    }
    const fileData = await getRes.json()

    // Update the file (triggers Vercel auto-deploy)
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update cron schedule to ${cronExpression} UTC`,
          content: Buffer.from(newContent).toString('base64'),
          sha: fileData.sha,
          branch: BRANCH,
        }),
      },
    )

    if (!putRes.ok) {
      const err = await putRes.text()
      return NextResponse.json({ error: `GitHub write failed: ${err}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, schedule: cronExpression })
  } catch (err) {
    return NextResponse.json({ error: `Deploy failed: ${(err as Error).message}` }, { status: 500 })
  }
}
