export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentId?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  status: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SafetyFlag {
  rule_id: string;
  severity: string;
  matched?: string;
}

export interface SafetyEvent {
  flags: SafetyFlag[];
  crisis_response?: string;
}
