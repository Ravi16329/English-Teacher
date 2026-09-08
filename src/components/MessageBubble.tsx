import type { Message } from '../types';

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--tutor'}`}>
      <div className="bubble">
        <p className="bubble-text">{message.text}</p>
        <span className="bubble-time">{time}</span>
      </div>

      {isUser && message.correction && (
        <div className="callout callout--correction">
          <strong>Try this instead:</strong> {message.correction}
          {message.correctionExplanation && <p>{message.correctionExplanation}</p>}
        </div>
      )}

      {isUser && message.pronunciationTip && (
        <div className="callout callout--tip">
          <strong>Fluency tip:</strong> {message.pronunciationTip}
        </div>
      )}
    </div>
  );
}
