import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Static metadata for INTELLBUSINESS agents
// Matches agentsConfig used in the 3D Office
const AGENT_META: Record<string, { name: string; emoji: string; color: string; role: string; squad: string }> = {
  'isabella': {
    name: 'Isabella',
    emoji: '💬',
    color: '#7c3aed',
    role: 'Agente WhatsApp',
    squad: 'whatsapp-agents',
  },
  'sarah-lynn': {
    name: 'Sarah Lynn',
    emoji: '🤝',
    color: '#a855f7',
    role: 'Atendimento',
    squad: 'whatsapp-agents',
  },
  'samantha': {
    name: 'Samantha',
    emoji: '📋',
    color: '#c084fc',
    role: 'Coordenadora',
    squad: 'whatsapp-agents',
  },
  'brand-strategist': {
    name: 'Brand Strategist',
    emoji: '🎯',
    color: '#f59e0b',
    role: 'Estratégia de Marca',
    squad: 'branding-design',
  },
  'visual-designer': {
    name: 'Visual Designer',
    emoji: '🎨',
    color: '#10b981',
    role: 'Design Visual',
    squad: 'branding-design',
  },
  'ux-architect': {
    name: 'UX Architect',
    emoji: '🏗️',
    color: '#3b82f6',
    role: 'Arquitetura UX',
    squad: 'branding-design',
  },
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('agents')
      .select('*')
      .order('id')

    if (error) throw error

    // Merge DB status with static metadata
    const agents = (data ?? []).map((row) => {
      const meta = AGENT_META[row.id] ?? {
        name: row.id,
        emoji: '🤖',
        color: '#6b7280',
        role: 'Agente',
        squad: row.squad ?? 'general',
      }

      return {
        id: row.id,
        name: meta.name,
        emoji: meta.emoji,
        color: meta.color,
        role: meta.role,
        squad: row.squad ?? meta.squad,
        status: row.status ?? 'offline',
        currentTask: row.current_task ?? null,
        executionsToday: row.executions_today ?? 0,
        lastActivity: row.updated_at ?? null,
        model: row.model ?? 'claude-sonnet-4-6',
        activeSessions: row.status === 'busy' ? 1 : 0,
        workspace: row.workspace ?? '',
        dmPolicy: row.dm_policy ?? null,
        allowAgents: Array.isArray(row.allow_agents) ? row.allow_agents : [],
        botToken: row.bot_token ?? null,
      }
    })

    // If Supabase table is empty, return static list as offline
    if (agents.length === 0) {
      const fallback = Object.entries(AGENT_META).map(([id, meta]) => ({
        id,
        ...meta,
        status: 'offline',
        currentTask: null,
        executionsToday: 0,
        lastActivity: null,
        model: 'claude-sonnet-4-6',
        activeSessions: 0,
        workspace: '',
        dmPolicy: null,
        allowAgents: [],
        botToken: null,
      }))
      return NextResponse.json({ agents: fallback })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error reading agents:', error)
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 })
  }
}
