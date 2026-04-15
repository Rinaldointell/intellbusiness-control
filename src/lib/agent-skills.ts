/**
 * Agent Skills — stub for INTELLBUSINESS
 * Skills are not filesystem-based in this architecture.
 */

export interface AgentSkillMapping {
  agentId: string
  agentName: string
  emoji: string
  skillIds: string[]
}

export function getAgentSkillMappings(): AgentSkillMapping[] {
  return []
}

export function getSkillsForAgent(_agentId: string): string[] {
  return []
}
