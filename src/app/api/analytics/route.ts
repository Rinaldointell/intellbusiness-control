import { NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface AnalyticsData {
  byDay: { date: string; count: number }[]
  byType: { type: string; count: number }[]
  byHour: { hour: number; day: number; count: number }[]
  successRate: number
}

export async function GET(): Promise<NextResponse<AnalyticsData>> {
  let activities: Array<{ type: string; timestamp: string }> = []

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabaseServer
      .from('activities')
      .select('type, timestamp')
      .gte('timestamp', thirtyDaysAgo)
      .order('timestamp', { ascending: false })

    activities = data ?? []
  } catch {}

  const today = new Date()
  const byDay: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const displayDate = format(date, 'MMM d')
    const count = activities.filter((a) => a.timestamp.startsWith(dateStr)).length
    byDay.push({ date: displayDate, count })
  }

  const typeMap = new Map<string, number>()
  activities.forEach((a) => {
    const normalized =
      a.type === 'cron_run' ? 'cron'
      : a.type === 'file_read' || a.type === 'file_write' ? 'file'
      : a.type === 'web_search' ? 'search'
      : a.type === 'message_sent' ? 'message'
      : a.type === 'tool_call' || a.type === 'agent_action' ? 'task'
      : a.type
    typeMap.set(normalized, (typeMap.get(normalized) ?? 0) + 1)
  })
  const byType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const hourDayMap = new Map<string, number>()
  activities.forEach((a) => {
    try {
      const d = new Date(a.timestamp)
      const hour = d.getHours()
      const day = d.getDay()
      const key = `${hour}-${day}`
      hourDayMap.set(key, (hourDayMap.get(key) ?? 0) + 1)
    } catch {}
  })

  const byHour: { hour: number; day: number; count: number }[] = []
  hourDayMap.forEach((count, key) => {
    const [hour, day] = key.split('-').map(Number)
    byHour.push({ hour, day, count })
  })

  return NextResponse.json({ byDay, byType, byHour, successRate: 100 })
}
