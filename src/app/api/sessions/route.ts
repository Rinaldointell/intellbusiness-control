/**
 * Sessions API
 * Without OpenClaw, sessions are derived from the activities table grouped by agent.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agent') || undefined

  try {
    let query = supabaseServer
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (agentId) {
      query = query.eq('agent', agentId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group activities by agent as pseudo-sessions
    const sessionMap = new Map<string, {
      id: string
      agentId: string
      updatedAt: number
      messages: number
      lastMessage: string
    }>()

    for (const row of data ?? []) {
      const agent = row.agent ?? 'unknown'
      const existing = sessionMap.get(agent)
      const ts = new Date(row.timestamp).getTime()

      if (!existing || ts > existing.updatedAt) {
        sessionMap.set(agent, {
          id: `session-${agent}`,
          agentId: agent,
          updatedAt: ts,
          messages: (existing?.messages ?? 0) + 1,
          lastMessage: row.message ?? '',
        })
      } else {
        existing.messages += 1
      }
    }

    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((s) => ({
        id: s.id,
        key: s.id,
        type: 'main' as const,
        typeLabel: 'Sessão do Agente',
        typeEmoji: '🤖',
        sessionId: s.id,
        agentId: s.agentId,
        updatedAt: s.updatedAt,
        ageMs: Date.now() - s.updatedAt,
        model: 'claude-sonnet-4-6',
        modelProvider: 'anthropic',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        contextTokens: 0,
        contextUsedPercent: null,
        aborted: false,
        messages: s.messages,
        lastMessage: s.lastMessage,
      }))

    return NextResponse.json({ sessions, total: sessions.length })
  } catch (error) {
    console.error('[sessions] Error:', error)
    return NextResponse.json({ error: 'Failed to load sessions', sessions: [] }, { status: 500 })
  }
}
