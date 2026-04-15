/**
 * Usage Queries — stub for INTELLBUSINESS (no SQLite)
 * Cost tracking is done via executions_today in the agents table.
 */

export interface CostSummary {
  today: number
  yesterday: number
  thisMonth: number
  lastMonth: number
  projected: number
}

export interface AgentCost {
  agent: string
  cost: number
  tokens: number
  inputTokens: number
  outputTokens: number
  percentOfTotal: number
}

export interface ModelCost {
  model: string
  cost: number
  tokens: number
  inputTokens: number
  outputTokens: number
  percentOfTotal: number
}

export interface DailyCost {
  date: string
  cost: number
  input: number
  output: number
}

export interface HourlyCost {
  hour: string
  cost: number
}

// These functions are stubs — actual data comes from /api/costs route via Supabase
export function getDatabase(_path: string) { return null }
export function getCostSummary(_db: null): CostSummary {
  return { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0, projected: 0 }
}
export function getCostByAgent(_db: null, _days: number): AgentCost[] { return [] }
export function getCostByModel(_db: null, _days: number): ModelCost[] { return [] }
export function getDailyCost(_db: null, _days: number): DailyCost[] { return [] }
export function getHourlyCost(_db: null): HourlyCost[] { return [] }
