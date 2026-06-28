export interface AgentThought {
  agent: string;
  thought: string;
  ts: number;
}

export interface AgentEvent {
  type: 'agent.started' | 'agent.thought' | 'agent.done' | 'issue.created' | 'agent.error';
  report_id: string;
  agent?: string;
  thought?: string;
  timestamp?: number;
  error?: string;
  issue_id?: string;
}

export interface AIPreview {
  category: string;
  subcategory: string;
  urgency: string;
  confidence: number;
  ai_summary: string;
  department: string;
  priority_score: number;
  estimated_eta: string;
}
