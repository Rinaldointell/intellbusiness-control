import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const AGENT_META: Record<string, { emoji: string; color: string; name: string; role: string }> = {
  'isabella':         { emoji: '💬', color: '#7c3aed', name: 'Isabella',         role: 'Agente WhatsApp' },
  'sarah-lynn':       { emoji: '🤝', color: '#a855f7', name: 'Sarah Lynn',       role: 'Atendimento' },
  'samantha':         { emoji: '📋', color: '#c084fc', name: 'Samantha',         role: 'Coordenadora' },
  'brand-strategist': { emoji: '🎯', color: '#f59e0b', name: 'Brand Strategist', role: 'Estratégia de Marca' },
  'visual-designer':  { emoji: '🎨', color: '#10b981', name: 'Visual Designer',  role: 'Design Visual' },
  'ux-architect':     { emoji: '🏗️', color: '#3b82f6', name: 'UX Architect',     role: 'Arquitetura UX' },
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('agents')
      .select('id, status, current_task, updated_at, squad')

    if (error) throw error

    const agents = (data ?? []).map((row) => {
      const meta = AGENT_META[row.id] ?? {
        emoji: '🤖',
        color: '#6b7280',
        name: row.id,
        role: 'Agente',
      }

      const isActive = row.status === 'busy'
      let currentTask = 'zzZ...'
      if (row.status === 'busy' && row.current_task) {
        currentTask = `ATIVO: ${row.current_task}`
      } else if (row.status === 'idle') {
        currentTask = 'IDLE: Aguardando...'
      }

      return {
        id: row.id,
        name: meta.name,
        emoji: meta.emoji,
        color: meta.color,
        role: meta.role,
        currentTask,
        isActive,
        status: row.status ?? 'offline',
        squad: row.squad ?? null,
      }
    })

    // Fallback: if empty, return all agents as offline
    if (agents.length === 0) {
      const fallback = Object.entries(AGENT_META).map(([id, meta]) => ({
        id,
        ...meta,
        currentTask: 'zzZ...',
        isActive: false,
        status: 'offline',
        squad: null,
      }))
      return NextResponse.json({ agents: fallback })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error getting office data:', error)
    return NextResponse.json({ error: 'Failed to load office data' }, { status: 500 })
  }
}
