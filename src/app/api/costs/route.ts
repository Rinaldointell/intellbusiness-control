import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const DEFAULT_BUDGET = 100.0

export async function GET() {
  try {
    // Get execution counts from agents table for cost approximation
    const { data: agents } = await supabaseServer
      .from('agents')
      .select('id, executions_today, squad')

    // Approximate cost per execution (Claude Sonnet 4.6 ~$0.01 avg)
    const COST_PER_EXEC = 0.01
    const byAgent = (agents ?? []).map((a) => ({
      agent: a.id,
      cost: (a.executions_today ?? 0) * COST_PER_EXEC,
      tokens: (a.executions_today ?? 0) * 1000,
      inputTokens: (a.executions_today ?? 0) * 700,
      outputTokens: (a.executions_today ?? 0) * 300,
      percentOfTotal: 0,
    }))

    const today = byAgent.reduce((s, a) => s + a.cost, 0)
    const totalTokens = byAgent.reduce((s, a) => s + a.tokens, 0)

    // Compute percentages
    if (today > 0) {
      for (const a of byAgent) {
        a.percentOfTotal = Math.round((a.cost / today) * 100)
      }
    }

    return NextResponse.json({
      today,
      yesterday: 0,
      thisMonth: today,
      lastMonth: 0,
      projected: today * 30,
      budget: DEFAULT_BUDGET,
      byAgent,
      byModel: [
        {
          model: 'claude-sonnet-4-6',
          cost: today,
          tokens: totalTokens,
          inputTokens: Math.round(totalTokens * 0.7),
          outputTokens: Math.round(totalTokens * 0.3),
          percentOfTotal: 100,
        },
      ],
      daily: [],
      hourly: [],
    })
  } catch (error) {
    console.error('Error fetching cost data:', error)
    return NextResponse.json({
      today: 0,
      yesterday: 0,
      thisMonth: 0,
      lastMonth: 0,
      projected: 0,
      budget: DEFAULT_BUDGET,
      byAgent: [],
      byModel: [],
      daily: [],
      hourly: [],
    })
  }
}

export async function POST() {
  return NextResponse.json({ success: true })
}
