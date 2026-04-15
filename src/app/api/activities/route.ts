import { NextRequest, NextResponse } from 'next/server'
import { logActivity, getActivities } from '@/lib/activities-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const agent = searchParams.get('agent') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getActivities({ type, status, agent, startDate, endDate, sort, limit, offset })

    return NextResponse.json({
      activities: result.activities,
      total: result.total,
      limit,
      offset,
      hasMore: offset + limit < result.total,
    })
  } catch (error) {
    console.error('Failed to get activities:', error)
    return NextResponse.json({ error: 'Failed to get activities' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.type || (!body.description && !body.message) || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: type, description/message, status' },
        { status: 400 }
      )
    }

    const activity = await logActivity(
      body.type,
      body.description ?? body.message,
      body.status,
      {
        duration_ms: body.duration_ms ?? null,
        tokens_used: body.tokens_used ?? null,
        agent: body.agent ?? null,
        metadata: body.metadata ?? null,
      }
    )

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Failed to save activity:', error)
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 })
  }
}
