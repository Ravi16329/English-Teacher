import { useCallback, useEffect, useRef, useState } from 'react';
import { tutorApi, ApiError } from '../api/tutorApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import type { ConversationStatus, Message, Topic } from '../types';
import { TopicSelector } from './TopicSelector';
import { ConversationView } from './ConversationView';
import { StatusBar } from './StatusBar';
import './Tutor.css';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Tutor() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('daily-life');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('beginner');
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  // Keep a ref mirror of messages so the speech-recognition callback (created
  // once) always sees the latest conversation without re-subscribing.
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    tutorApi
      .getTopics()
      .then((data) => {
        setTopics(data);
        setTopicsLoaded(true);
      })
      .catch(() => {
        setError('Could not load topics from the server. Is the backend running?');
      });
  }, []);

  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeechSynthesis({
    onEnd: () => setStatus('idle')
  });

  const sendToTutor = useCallback(
    async (userText: string) => {
      const userMessage: Message = {
        id: newId(),
        role: 'user',
        text: userText,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMessage]);
      setStatus('thinking');
      setError(null);

      try {
        const history = messagesRef.current.map((m) => ({ role: m.role, text: m.text }));
        const response = await tutorApi.chat({
          userText,
          topic: selectedTopicId,
          level,
          history
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id
              ? {
                  ...m,
                  correction: response.correction,
                  correctionExplanation: response.correctionExplanation,
                  pronunciationTip: response.pronunciationTip
                }
              : m
          )
        );

        const tutorMessage: Message = {
          id: newId(),
          role: 'assistant',
          text: response.reply,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, tutorMessage]);
        setStatus('speaking');
        speak(response.reply);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
        setError(message);
        setStatus('idle');
      }
    },
    [level, selectedTopicId, speak]
  );

  const { isListening, isSupported: recognitionSupported, start, stop } = useSpeechRecognition({
    onFinalResult: (transcript) => {
      setStatus('idle');
      sendToTutor(transcript);
    },
    onError: (message) => setError(`Microphone error: ${message}`)
  });

  useEffect(() => {
    if (isListening) setStatus('listening');
  }, [isListening]);

  const startConversation = useCallback(
    (topicId: string) => {
      cancelSpeech();
      stop();
      const topic = topics.find((t) => t.id === topicId);
      setSelectedTopicId(topicId);
      setError(null);
      const greeting: Message = {
        id: newId(),
        role: 'assistant',
        text: topic?.greeting ?? "Hello! Let's practice English. What would you like to talk about?",
        timestamp: new Date().toISOString()
      };
      setMessages([greeting]);
      setStatus('speaking');
      speak(greeting.text);
    },
    [cancelSpeech, stop, speak, topics]
  );

  // Kick off the first conversation once topics have loaded.
  useEffect(() => {
    if (topicsLoaded && messages.length === 0) {
      startConversation(selectedTopicId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsLoaded]);

  const handleMicClick = () => {
    if (isListening) {
      stop();
      return;
    }
    if (isSpeaking) cancelSpeech();
    setError(null);
    start();
  };

  const endConversation = () => {
    cancelSpeech();
    stop();
    setMessages([]);
    setStatus('idle');
  };

  return (
    <div className="tutor-layout">
      <aside className="tutor-sidebar">
        <h2 className="sidebar-heading">Topics</h2>
        <TopicSelector
          topics={topics}
          selectedTopicId={selectedTopicId}
          disabled={status !== 'idle'}
          onSelect={startConversation}
        />

        <h2 className="sidebar-heading">Level</h2>
        <div className="level-toggle" role="radiogroup" aria-label="Difficulty level">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              role="radio"
              aria-checked={level === lvl}
              className={`level-pill ${level === lvl ? 'level-pill--active' : ''}`}
              onClick={() => setLevel(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn--ghost end-btn" onClick={endConversation}>
          New conversation
        </button>

        <p className="sidebar-note">
          This session isn't saved — refreshing the page starts a fresh conversation.
        </p>
      </aside>

      <section className="tutor-main">
        {!recognitionSupported && (
          <div className="banner banner--warning">
            Speech recognition isn't supported in this browser. Try Chrome or Edge on desktop.
          </div>
        )}

        <ConversationView messages={messages} />

        <div className="tutor-controls">
          <StatusBar status={status} error={error} />
          <button
            type="button"
            className={`mic-button ${isListening ? 'mic-button--active' : ''}`}
            onClick={handleMicClick}
            disabled={!recognitionSupported || status === 'thinking'}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          >
            <MicIcon />
          </button>
        </div>
      </section>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
