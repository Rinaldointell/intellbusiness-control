import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseServer
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get recent activities for this agent
    const { data: activities } = await supabaseServer
      .from('activities')
      .select('*')
      .eq('agent', id)
      .order('timestamp', { ascending: false })
      .limit(10)

    return NextResponse.json({
      agent: {
        id: data.id,
        status: data.status ?? 'offline',
        currentTask: data.current_task ?? null,
        executionsToday: data.executions_today ?? 0,
        updatedAt: data.updated_at,
        squad: data.squad ?? null,
      },
      recentActivities: activities ?? [],
    })
  } catch (error) {
    console.error('Error getting agent status:', error)
    return NextResponse.json({ error: 'Failed to get agent status' }, { status: 500 })
  }
}
