import type { Topic } from '../types';

interface Props {
  topics: Topic[];
  selectedTopicId: string;
  disabled: boolean;
  onSelect: (topicId: string) => void;
}

export function TopicSelector({ topics, selectedTopicId, disabled, onSelect }: Props) {
  return (
    <nav className="topic-list" aria-label="Conversation topics">
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          className={`topic-item ${topic.id === selectedTopicId ? 'topic-item--active' : ''}`}
          disabled={disabled}
          onClick={() => onSelect(topic.id)}
        >
          {topic.label}
        </button>
      ))}
    </nav>
  );
}
