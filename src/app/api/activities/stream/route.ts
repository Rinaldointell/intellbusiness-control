/**
 * Real-time activity stream via SSE — Supabase backend
 * GET /api/activities/stream
 */
import { NextRequest } from 'next/server'
import { getActivities } from '@/lib/activities-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let lastId: string | null = null
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      send({ type: 'connected', ts: new Date().toISOString() })

      const poll = async () => {
        if (closed) return

        try {
          const result = await getActivities({ limit: 10, sort: 'newest' })
          const activities = result.activities

          if (activities.length > 0) {
            const newest = activities[0]

            if (lastId === null) {
              send({ type: 'batch', activities: activities.slice(0, 5) })
              lastId = newest.id
            } else if (newest.id !== lastId) {
              const lastIdx = activities.findIndex((x) => x.id === lastId)
              const newActivities = activities.filter((_a, idx) =>
                lastIdx === -1 ? true : idx < lastIdx
              )
              for (const activity of newActivities.reverse()) {
                send({ type: 'new', activity })
              }
              lastId = newest.id
            }
          }
        } catch {}

        if (!closed) {
          setTimeout(poll, 5000)
        }
      }

      poll()

      request.signal?.addEventListener('abort', () => {
        closed = true
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
