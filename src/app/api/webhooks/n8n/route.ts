import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET

/**
 * Webhook receptor para eventos do n8n
 * POST /api/webhooks/n8n
 * Headers: Authorization: Bearer <N8N_WEBHOOK_SECRET>
 * Body:
 * {
 *   event:    'agent_started' | 'agent_completed' | 'agent_error',
 *   agent_id: string,
 *   squad:    string,
 *   task:     string,
 *   message:  string,
 *   type:     string,
 *   icon:     string,
 *   status:   'busy' | 'idle' | 'offline'
 * }
 */
export async function POST(req: Request) {
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    event,
    agent_id,
    squad,
    task,
    message,
    type = 'task_completed',
    icon = '⚙️',
    status,
  } = body as Record<string, string>

  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id é obrigatório' }, { status: 400 })
  }

  const ops: PromiseLike<unknown>[] = []

  const agentUpdate: Record<string, unknown> = {
    id: agent_id,
    updated_at: new Date().toISOString(),
  }

  if (squad) agentUpdate.squad = squad

  if (event === 'agent_started') {
    agentUpdate.status = 'busy'
    agentUpdate.current_task = task ?? null
  } else if (event === 'agent_completed') {
    agentUpdate.status = 'idle'
    agentUpdate.current_task = null
  } else if (event === 'agent_error') {
    agentUpdate.status = 'idle'
    agentUpdate.current_task = null
  } else if (status) {
    agentUpdate.status = status
    if (task !== undefined) agentUpdate.current_task = task
  }

  ops.push(
    supabaseServer
      .from('agents')
      .upsert(agentUpdate, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('[n8n webhook] agents upsert error:', error)
      })
  )

  if (event === 'agent_completed') {
    ops.push(
      supabaseServer
        .rpc('increment_executions_today', { agent_id_param: agent_id })
        .then(({ error }) => {
          if (error && !error.message.includes('does not exist')) {
            console.error('[n8n webhook] increment_executions_today error:', error)
          }
        })
    )
  }

  if (message) {
    ops.push(
      supabaseServer
        .from('activities')
        .insert({
          agent: agent_id,
          squad: squad ?? null,
          type,
          message,
          icon,
          timestamp: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error('[n8n webhook] activities insert error:', error)
        })
    )
  }

  await Promise.all(ops.map((op) => Promise.resolve(op)))

  return NextResponse.json({ ok: true, event, agent_id })
}
