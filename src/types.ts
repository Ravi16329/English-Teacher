export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
  correction?: string | null;
  correctionExplanation?: string | null;
  pronunciationTip?: string | null;
}

export interface Topic {
  id: string;
  label: string;
  greeting: string;
}

export interface ChatRequestBody {
  userText: string;
  topic: string;
  level: string;
  history: { role: MessageRole; text: string }[];
}

export interface ChatResponseBody {
  reply: string;
  correction: string | null;
  correctionExplanation: string | null;
  pronunciationTip: string | null;
}

export type ConversationStatus = 'idle' | 'listening' | 'thinking' | 'speaking';
