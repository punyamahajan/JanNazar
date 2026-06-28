export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
export type IssueUrgency = 'low' | 'medium' | 'high' | 'critical';
export type IssueCategory = 'potholes' | 'garbage' | 'streetlight' | 'water' | 'flood' | 'tree' | 'animal' | 'construction' | 'other';

export interface Issue {
  id: string;
  reporter_id: string | null;
  title: string;
  description_raw: string | null;
  description_en: string | null;
  category: IssueCategory | null;
  subcategory: string | null;
  status: IssueStatus;
  urgency: IssueUrgency;
  priority_score: number;
  confidence: number | null;
  lat: number;
  lng: number;
  address: string | null;
  department: string | null;
  assigned_to: string | null;
  duplicate_of: string | null;
  ai_summary: string | null;
  estimated_eta: string | null;
  upvotes: number;
  verified_count: number;
  media_urls: string[] | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface IssueEvent {
  id: string;
  issue_id: string;
  actor_id: string | null;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string | null;
  body: string;
  is_official: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  trust_score: number;
  role: 'citizen' | 'authority' | 'admin';
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  contact_email: string | null;
  avg_resolution_days: number | null;
  resolution_rate: number | null;
}

export interface AgentLog {
  id: string;
  issue_id: string | null;
  agent_name: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  thoughts: string[] | null;
  duration_ms: number | null;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  awarded_at: string;
}
