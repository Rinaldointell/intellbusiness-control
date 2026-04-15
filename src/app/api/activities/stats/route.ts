/**
 * Activity Stats API — Supabase backend
 * GET /api/activities/stats
 */
import { NextResponse } from 'next/server'
import { getActivityStats } from '@/lib/activities-db'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getActivityStats()

    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

    // Heatmap: count per day (last 365 days)
    const { data: heatmapRows } = await supabaseServer
      .from('activities')
      .select('timestamp')
      .gte('timestamp', cutoff)

    const heatmapMap = new Map<string, number>()
    for (const row of heatmapRows ?? []) {
      const day = row.timestamp.slice(0, 10)
      heatmapMap.set(day, (heatmapMap.get(day) ?? 0) + 1)
    }
    const heatmap = Array.from(heatmapMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day))

    // Trend: last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: trendRows } = await supabaseServer
      .from('activities')
      .select('timestamp')
      .gte('timestamp', sevenDaysAgo)

    const trendMap = new Map<string, { count: number; success: number; errors: number }>()
    for (const row of trendRows ?? []) {
      const day = row.timestamp.slice(0, 10)
      const existing = trendMap.get(day) ?? { count: 0, success: 0, errors: 0 }
      existing.count += 1
      existing.success += 1 // all activities assumed success
      trendMap.set(day, existing)
    }
    const trend = Array.from(trendMap.entries())
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => b.day.localeCompare(a.day))

    // Hourly distribution (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: hourRows } = await supabaseServer
      .from('activities')
      .select('timestamp')
      .gte('timestamp', thirtyDaysAgo)

    const hourMap = new Map<string, number>()
    for (const row of hourRows ?? []) {
      const hour = row.timestamp.slice(11, 13)
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1)
    }
    const hourly = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 24)

    return NextResponse.json({
      ...stats,
      heatmap,
      trend,
      hourly,
    })
  } catch (error) {
    console.error('[activities/stats] Error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
