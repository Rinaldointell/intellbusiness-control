/**
 * Office 3D — Agent Configuration INTELLBUSINESS
 *
 * 6 agentes em 2 squads:
 *   Squad "whatsapp-agents": isabella, sarah-lynn, samantha
 *   Squad "branding-design": brand-strategist, visual-designer, ux-architect
 */

export interface AgentConfig {
  id: string
  name: string
  emoji: string
  position: [number, number, number] // x, y, z
  color: string
  role: string
  squad: string
}

export const AGENTS: AgentConfig[] = [
  // ── Squad: WhatsApp Agents ────────────────────────────────
  {
    id: 'isabella',
    name: 'Isabella',
    emoji: '💬',
    position: [-5, 0, -3],
    color: '#7c3aed',
    role: 'Agente WhatsApp',
    squad: 'whatsapp-agents',
  },
  {
    id: 'sarah-lynn',
    name: 'Sarah Lynn',
    emoji: '🤝',
    position: [0, 0, -3],
    color: '#a855f7',
    role: 'Atendimento',
    squad: 'whatsapp-agents',
  },
  {
    id: 'samantha',
    name: 'Samantha',
    emoji: '📋',
    position: [5, 0, -3],
    color: '#c084fc',
    role: 'Coordenadora',
    squad: 'whatsapp-agents',
  },

  // ── Squad: Branding & Design ──────────────────────────────
  {
    id: 'brand-strategist',
    name: 'Brand Strategist',
    emoji: '🎯',
    position: [-5, 0, 3],
    color: '#f59e0b',
    role: 'Estratégia de Marca',
    squad: 'branding-design',
  },
  {
    id: 'visual-designer',
    name: 'Visual Designer',
    emoji: '🎨',
    position: [0, 0, 3],
    color: '#10b981',
    role: 'Design Visual',
    squad: 'branding-design',
  },
  {
    id: 'ux-architect',
    name: 'UX Architect',
    emoji: '🏗️',
    position: [5, 0, 3],
    color: '#3b82f6',
    role: 'Arquitetura UX',
    squad: 'branding-design',
  },
]

// Legacy statuses kept for 3D component compatibility
// 'working' = agent is processing, 'thinking' = agent is reasoning, 'error' = error state
// New Supabase statuses: 'idle', 'busy', 'offline' (mapped to legacy on client side)
export type AgentStatus = 'idle' | 'busy' | 'offline' | 'working' | 'thinking' | 'error'

export interface AgentState {
  id: string
  status: AgentStatus
  currentTask?: string
  model?: string
  tokensPerHour?: number
  tasksInQueue?: number
  uptime?: number
}
