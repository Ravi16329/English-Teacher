import type { ConversationStatus } from '../types';

const LABELS: Record<ConversationStatus, string> = {
  idle: 'Ready when you are',
  listening: 'Listening…',
  thinking: 'Ravi is thinking…',
  speaking: 'Ravi is speaking…'
};

export function StatusBar({ status, error }: { status: ConversationStatus; error: string | null }) {
  return (
    <div className="status-bar">
      <span className={`status-dot status-dot--${status}`} aria-hidden="true" />
      <span>{error ?? LABELS[status]}</span>
    </div>
  );
}
