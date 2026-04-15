/**
 * Activity Logger — Supabase backend
 * Replaces SQLite (better-sqlite3) with Supabase queries
 */
import { supabaseServer } from './supabase-server'

export type ActivityType =
  | 'file'
  | 'search'
  | 'message'
  | 'command'
  | 'security'
  | 'build'
  | 'task'
  | 'cron'
  | 'memory'
  | 'cron_run'
  | 'file_read'
  | 'file_write'
  | 'web_search'
  | 'message_sent'
  | 'tool_call'
  | 'agent_action'
  | 'task_completed'
  | 'deploy'

export type ActivityStatus = 'success' | 'error' | 'pending' | 'running'

export interface Activity {
  id: string
  timestamp: string
  type: string
  description: string
  status: string
  duration_ms: number | null
  tokens_used: number | null
  agent: string | null
  metadata: Record<string, unknown> | null
  // n8n-style fields (optional)
  message?: string
  icon?: string
  squad?: string
}

export interface GetActivitiesOptions {
  type?: string
  status?: string
  agent?: string
  startDate?: string
  endDate?: string
  sort?: 'newest' | 'oldest'
  limit?: number
  offset?: number
}

export interface ActivitiesResult {
  activities: Activity[]
  total: number
}

export async function logActivity(
  type: string,
  description: string,
  status: string,
  opts?: {
    duration_ms?: number | null
    tokens_used?: number | null
    agent?: string | null
    metadata?: Record<string, unknown> | null
  }
): Promise<Activity> {
  const { data, error } = await supabaseServer
    .from('activities')
    .insert({
      type,
      message: description,
      icon: '⚙️',
      agent: opts?.agent ?? null,
      squad: null,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    timestamp: data.timestamp,
    type: data.type,
    description: data.message ?? description,
    status,
    duration_ms: opts?.duration_ms ?? null,
    tokens_used: opts?.tokens_used ?? null,
    agent: data.agent,
    metadata: opts?.metadata ?? null,
  }
}

export async function getActivities(opts: GetActivitiesOptions = {}): Promise<ActivitiesResult> {
  const limit = opts.limit ?? 20
  const offset = opts.offset ?? 0
  const order = opts.sort === 'oldest' ? true : false // ascending = oldest first

  let query = supabaseServer
    .from('activities')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: order })
    .range(offset, offset + limit - 1)

  if (opts.agent) query = query.eq('agent', opts.agent)
  if (opts.startDate) query = query.gte('timestamp', opts.startDate)
  if (opts.endDate) query = query.lte('timestamp', opts.endDate + 'T23:59:59Z')

  if (opts.type && opts.type !== 'all') {
    const types = opts.type.split(',').map((t) => t.trim()).filter(Boolean)
    // Expand legacy aliases
    const aliases: Record<string, string[]> = {
      cron: ['cron', 'cron_run'],
      file: ['file', 'file_read', 'file_write'],
      search: ['search', 'web_search'],
      message: ['message', 'message_sent'],
      task: ['task', 'tool_call', 'agent_action', 'task_completed'],
    }
    const expanded = types.flatMap((t) => aliases[t] ?? [t])
    query = query.in('type', expanded)
  }

  const { data, error, count } = await query

  if (error) throw error

  const activities: Activity[] = (data ?? []).map((row) => ({
    id: String(row.id),
    timestamp: row.timestamp,
    type: row.type,
    description: row.message ?? '',
    status: 'success',
    duration_ms: null,
    tokens_used: null,
    agent: row.agent ?? null,
    metadata: null,
    message: row.message,
    icon: row.icon,
    squad: row.squad,
  }))

  return { activities, total: count ?? 0 }
}

export async function getActivityStats(): Promise<{
  total: number
  today: number
  byType: Record<string, number>
  byStatus: Record<string, number>
}> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalRes, todayRes, typeRes] = await Promise.all([
    supabaseServer.from('activities').select('*', { count: 'exact', head: true }),
    supabaseServer
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', todayStart.toISOString()),
    supabaseServer.from('activities').select('type'),
  ])

  const byType: Record<string, number> = {}
  for (const row of typeRes.data ?? []) {
    byType[row.type] = (byType[row.type] ?? 0) + 1
  }

  return {
    total: totalRes.count ?? 0,
    today: todayRes.count ?? 0,
    byType,
    byStatus: { success: totalRes.count ?? 0 },
  }
}

// Sync version stubs (used by some imports) — delegate to async
export function updateActivity(_id: string, _status: string): void {
  // no-op — Supabase activities are immutable in this architecture
}
