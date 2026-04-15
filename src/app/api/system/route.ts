import { NextResponse } from 'next/server'
import os from 'os'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`)
  return parts.join(' ')
}

async function getIntegrationStatus() {
  const integrations = []

  // WhatsApp via Evolution API
  const evolutionUrl = process.env.EVOLUTION_API_URL
  integrations.push({
    id: 'whatsapp',
    name: 'WhatsApp (Evolution API)',
    status: evolutionUrl ? 'connected' : 'not_configured',
    icon: 'MessageCircle',
    lastActivity: null,
    detail: evolutionUrl ? 'Evolution API configurada' : null,
  })

  // n8n
  const n8nUrl = process.env.N8N_URL
  integrations.push({
    id: 'n8n',
    name: 'n8n Automação',
    status: n8nUrl ? 'connected' : 'not_configured',
    icon: 'Workflow',
    lastActivity: null,
    detail: n8nUrl ?? null,
  })

  // Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  integrations.push({
    id: 'supabase',
    name: 'Supabase',
    status: supabaseUrl ? 'connected' : 'not_configured',
    icon: 'Database',
    lastActivity: null,
    detail: supabaseUrl ? 'Realtime ativo' : null,
  })

  return integrations
}

export async function GET() {
  const uptime = process.uptime()
  const nodeVersion = process.version

  // Count agents
  const { count: agentCount } = await supabaseServer
    .from('agents')
    .select('*', { count: 'exact', head: true })

  const { count: activeCount } = await supabaseServer
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'busy')

  const systemInfo = {
    agent: {
      name: process.env.NEXT_PUBLIC_AGENT_NAME || 'INTELLBUSINESS',
      creature: 'AI Agents Platform',
      emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || '🏢',
    },
    system: {
      uptime: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      nodeVersion,
      model: 'claude-sonnet-4-6',
      platform: os.platform(),
      hostname: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      agents: {
        total: agentCount ?? 0,
        active: activeCount ?? 0,
      },
    },
    integrations: await getIntegrationStatus(),
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(systemInfo)
}

export async function POST() {
  return NextResponse.json({ success: true })
}
