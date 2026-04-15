/**
 * Usage Collector — stub for INTELLBUSINESS (no OpenClaw CLI)
 * Usage data comes from n8n webhook updating agents.executions_today in Supabase.
 */

export async function collectUsage(): Promise<void> {
  // no-op: usage is tracked by n8n webhooks
}

export async function getCollectedUsage() {
  return { sessions: [], totalCost: 0 }
}
