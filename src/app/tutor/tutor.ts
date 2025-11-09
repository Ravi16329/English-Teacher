import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare const window: any;

@Component({
  selector: 'app-tutor',
  imports: [ NgClass , CommonModule, FormsModule, DatePipe],
  templateUrl: './tutor.html',
  styleUrls: ['./tutor.css']
})

export class Tutor implements OnInit, OnDestroy {
  // UI / state
  currentMode: 'conversation' | 'history' = 'conversation';
  isListening = false;
  isSpeaking = false;
  isConversationActive = false;
  conversationStatus = 'idle';

  currentConversation: any = null;
  conversationHistory: any[] = [];
  filteredHistory: any[] = [];
  selectedHistoryConversation: any = null;

  searchQuery = '';
  selectedTopic = 'daily-life';
  errorMessage = '';
  successMessage = '';

  // speech APIs
  private recognition: any = null;
  private synthesis = window.speechSynthesis;
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];

  constructor(private zone: NgZone, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadHistory();
    this.initSpeechRecognition();
    this.startNewConversation();
  }

  ngOnDestroy(): void {
    try {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
      }
      if (this.synthesis && this.isSpeaking) {
        this.synthesis.cancel();
      }
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    } catch (err) {
      console.error('Cleanup error', err);
    }
  }

  /* -------------------- Initialization -------------------- */
  initSpeechRecognition(): void {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.showError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.zone.run(() => {
          this.isListening = true;
          this.updateStatus();
        });
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript.trim()) {
          this.zone.run(() => this.processUserSpeech(finalTranscript.trim()));
        }
      };

      this.recognition.onerror = (ev: any) => {
        console.error('Recognition error', ev);
        this.zone.run(() => {
          this.showError('Speech recognition error: ' + (ev?.error || 'unknown'));
          this.stopListening();
        });
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          this.isListening = false;
          this.updateStatus();
        });
      };

      console.log('Speech recognition initialized');
    } catch (error: any) {
      console.error('Error initializing speech recognition', error);
      this.showError('Failed to initialize speech recognition: ' + (error?.message || error));
    }
  }

  /* -------------------- Conversation lifecycle -------------------- */
  startNewConversation(): void {
    try {
      this.currentConversation = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        endTime: null,
        topic: this.selectedTopic,
        difficulty: 'beginner',
        messages: [],
        audioRecordings: []
      };
      this.isConversationActive = true;
      this.selectedHistoryConversation = null;
      const greeting = this.generateGreeting();
      this.addAIMessage(greeting);
      this.showSuccess('New conversation started! Topic: ' + this.selectedTopic);
    } catch (err : any ) {
      console.error('startNewConversation error', err);
      this.showError('Failed to start new conversation: ' + (err?.message || err));
    }
  }

  endConversation(): void {
    try {
      if (this.currentConversation && this.currentConversation.messages.length > 0) {
        this.currentConversation.endTime = new Date().toISOString();
        this.saveConversation(this.currentConversation);
      }
      this.isConversationActive = false;
      this.stopListening();
      this.currentConversation = null;
      this.showSuccess('Conversation ended and saved to history');
    } catch (err : any ) {
      console.error('endConversation error', err);
      this.showError('Failed to end conversation: ' + (err?.message || err));
    }
  }

  pauseConversation(): void {
    this.isConversationActive = false;
    this.stopListening();
    this.showSuccess('Conversation paused');
  }

  /* -------------------- Speech control -------------------- */
  async startListening(): Promise<void> {
    try {
      if (!this.recognition) {
        this.showError('Speech recognition not available');
        return;
      }
      if (!this.isConversationActive) this.startNewConversation();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // MediaRecorder for audio capture
      if ((window as any).MediaRecorder) {
        this.mediaRecorder = new ((window as any).MediaRecorder)(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (ev: any) => {
          if (ev.data && ev.data.size > 0) this.audioChunks.push(ev.data);
        };

        this.mediaRecorder.onstop = () => {
          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            // attach to last user message if exists
            const msgs = this.currentConversation?.messages || [];
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              if (last && last.type === 'user') {
                last.audioUrl = audioUrl;
                // keep also recordings list
                this.currentConversation.audioRecordings.push({ url: audioUrl, blob: audioBlob });
                this.saveCurrentConversation();
              } else {
                // store as orphan recording
                this.currentConversation.audioRecordings.push({ url: audioUrl, blob: audioBlob });
              }
            }
            // stop tracks
            stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          } catch (err) {
            console.error('mediaRecorder.onstop error', err);
          }
        };

        this.mediaRecorder.start();
      }

      this.recognition.start();
    } catch (err: any) {
      console.error('startListening error', err);
      this.showError('Microphone access denied or error: ' + (err?.message || err));
    }
  }

  stopListening(): void {
    try {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
      }
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      this.isListening = false;
      this.updateStatus();
    } catch (err) {
      console.error('stopListening error', err);
    }
  }

  /* -------------------- Message handling -------------------- */
  processUserSpeech(transcript: string): void {
    try {
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        text: transcript,
        timestamp: new Date().toISOString(),
        correction: this.generateCorrection(transcript),
        pronunciationScore: this.assessPronunciation(transcript),
        pronunciationFeedback: this.generatePronunciationFeedback(transcript),
        audioUrl: null
      };
      this.currentConversation.messages.push(userMessage);
      this.saveCurrentConversation();
      // stop listening while AI responds
      this.stopListening();

      setTimeout(() => {
        const aiResponse = this.generateAIResponse(transcript);
        this.addAIMessage(aiResponse);
      }, 800);
    } catch (err : any ) {
      console.error('processUserSpeech error', err);
      this.showError('Failed to process your speech: ' + (err?.message || err));
    }
  }

  addAIMessage(text: string): void {
    try {
      const aiMessage = {
        id: Date.now().toString(),
        type: 'ai',
        text,
        timestamp: new Date().toISOString(),
        audioUrl: null
      };
      this.currentConversation.messages.push(aiMessage);
      this.saveCurrentConversation();
      this.speakResponse(text);
      // scroll handled by UI or outside
    } catch (err : any ) {
      console.error('addAIMessage error', err);
      this.showError('Failed to generate AI response: ' + (err?.message || err));
    }
  }

  speakResponse(text: string): void {
    try {
      if (!this.synthesis) return;
      if (this.synthesis.speaking) this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.zone.run(() => {
          this.isSpeaking = true;
          this.updateStatus();
        });
      };

      utterance.onend = () => {
        this.zone.run(() => {
          this.isSpeaking = false;
          this.updateStatus();
          // resume listening shortly if conversation is active
          setTimeout(() => {
            if (this.isConversationActive) this.startListening();
          }, 500);
        });
      };

      utterance.onerror = (ev: any) => {
        console.error('synthesis error', ev);
        this.zone.run(() => {
          this.isSpeaking = false;
          this.updateStatus();
        });
      };

      this.synthesis.speak(utterance);
    } catch (err) {
      console.error('speakResponse error', err);
      this.isSpeaking = false;
      this.updateStatus();
    }
  }

  /* -------------------- AI/corrections/assessments -------------------- */
  generateGreeting(): string {
    const greetings: any = {
      'daily-life': "Hello! Let's talk about daily life. How was your day today?",
      'work': "Hi there! Let's discuss work and business. What do you do for a living?",
      'travel': "Greetings! Ready to talk about travel? What's the most interesting place you've visited?",
      'food': "Hello! Let's chat about food. What's your favorite cuisine?",
      'hobbies': "Hi! What are your hobbies? I'd love to hear about what you enjoy doing in your free time.",
      'random': "Hey! Let's have a casual chat. What's on your mind today?"
    };
    return greetings[this.selectedTopic] || "Hello! Let's practice English. What would you like to talk about?";
  }

  generateAIResponse(userText: string): string {
    try {
      const responses: any = {
        'daily-life': [
          "That's interesting! Tell me more about your daily routine.",
          "How do you usually spend your evenings?",
          "What do you like to do on weekends?",
          "That sounds like a busy day! Do you get enough time to relax?"
        ],
        'work': [
          "That sounds fascinating! What do you enjoy most about your job?",
          "How long have you been working in this field?",
          "What skills are most important for your profession?",
          "That's impressive! What challenges do you face at work?"
        ],
        'travel': [
          "Wow, that must have been an amazing experience! What did you like most?",
          "Would you like to visit there again? Why?",
          "What other places are on your travel wishlist?",
          "How did you plan your trip? Any tips for others?"
        ],
        'food': [
          "That sounds delicious! How often do you eat that?",
          "Can you cook it yourself? What's the recipe?",
          "What other dishes do you enjoy from that cuisine?",
          "Have you tried making it at home? How did it turn out?"
        ],
        'hobbies': [
          "That's a great hobby! How did you get started?",
          "How much time do you spend on it?",
          "What equipment or tools do you need?",
          "Have you met others who share this interest?"
        ],
        'random': [
          "Tell me more!",
          "That's interesting — why do you think that happened?",
          "Could you expand on that?"
        ]
      };

      const topicResponses = responses[this.selectedTopic] || responses['random'];
      const randomResponse = topicResponses[Math.floor(Math.random() * topicResponses.length)];

      if (userText.includes('?')) return "That's a good question! " + randomResponse;
      if (userText.split(' ').length < 5) return "I see. Could you tell me more? " + randomResponse;
      return randomResponse;
    } catch (err) {
      console.error('generateAIResponse error', err);
      return "That's interesting! Tell me more.";
    }
  }

  generateCorrection(text: string): string | null {
    try {
      const corrections: any = {
        'i am go': 'I am going',
        'i have went': 'I have gone',
        'she go': 'she goes',
        'he go': 'he goes',
        'they goes': 'they go',
        "i doesn't": "I don't",
        "he don't": "he doesn't",
        "she don't": "she doesn't",
        'yesterday i go': 'yesterday I went',
        'tomorrow i go': 'tomorrow I will go',
        "i didn't went": "I didn't go"
      };

      const lower = text.toLowerCase();
      for (const [bad, good] of Object.entries(corrections)) {
        if (lower.includes(bad)) return `Did you mean: '${good}'?`;
      }

      if (/\b(i|you|we|they)\s+goes\b/i.test(lower)) {
        return "Remember: Use 'go' with I, you, we, they. Use 'goes' with he, she, it.";
      }
      if (/\b(he|she|it)\s+go\b/i.test(lower)) {
        return "Remember: Use 'goes' with he, she, it. Use 'go' with I, you, we, they.";
      }
      return null;
    } catch (err) {
      console.error('generateCorrection error', err);
      return null;
    }
  }

  assessPronunciation(text: string): number {
    try {
      let score = 70;
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount > 5) score += 10;
      if (wordCount > 10) score += 10;
      const complexWords = text.match(/\b\w{8,}\b/g);
      if (complexWords) score += Math.min(complexWords.length * 2, 10);
      if (text.includes(',')) score += 5;
      if (text.includes('.')) score += 5;
      if (wordCount < 3) score -= 20;
      const challengingSounds = ['th', 'r', 'l', 'v', 'w'];
      const found = challengingSounds.filter(s => text.toLowerCase().includes(s));
      if (found.length >= 2) score += 5;
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (err) {
      console.error('assessPronunciation error', err);
      return 70;
    }
  }

  generatePronunciationFeedback(text: string): string {
    const score = this.assessPronunciation(text);
    if (score >= 90) return "Excellent pronunciation! Your speech is very clear and natural.";
    if (score >= 80) return "Great job! Your pronunciation is good with minor improvements possible.";
    if (score >= 70) return "Good effort! Focus on clarity and word stress.";
    if (score >= 60) return "Keep practicing! Try to speak more slowly and clearly.";
    return "Don't worry! Practice basic sounds and short phrases first.";
  }

  /* -------------------- History / localStorage -------------------- */
  saveCurrentConversation(): void {
    try {
      if (this.currentConversation) {
        localStorage.setItem('currentConversation', JSON.stringify(this.currentConversation));
      }
    } catch (err) {
      console.error('saveCurrentConversation error', err);
    }
  }

  loadHistory(): void {
    try {
      const saved = localStorage.getItem('conversationHistory');
      this.conversationHistory = saved ? JSON.parse(saved) : [];
      const current = localStorage.getItem('currentConversation');
      if (current) {
        this.currentConversation = JSON.parse(current);
        this.isConversationActive = true;
      }
      this.filteredHistory = [...this.conversationHistory];
    } catch (err) {
      console.error('loadHistory error', err);
      this.conversationHistory = [];
      this.filteredHistory = [];
    }
  }

  saveConversation(conversation: any): void {
    try {
      conversation.endTime = conversation.endTime || new Date().toISOString();
      this.conversationHistory.unshift(conversation);
      if (this.conversationHistory.length > 50) this.conversationHistory = this.conversationHistory.slice(0, 50);
      localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
      localStorage.removeItem('currentConversation');
      this.filteredHistory = [...this.conversationHistory];
    } catch (err : any ) {
      console.error('saveConversation error', err);
      this.showError('Failed to save conversation: ' + (err?.message || err));
    }
  }

  selectHistoryConversation(conversation: any): void {
    this.selectedHistoryConversation = conversation;
  }

  filterHistory(): void {
    try {
      if (!this.searchQuery) {
        this.filteredHistory = [...this.conversationHistory];
        return;
      }
      const q = this.searchQuery.toLowerCase();
      this.filteredHistory = this.conversationHistory.filter(conv => {
        const topicMatch = conv.topic?.toLowerCase()?.includes(q);
        const preview = this.getConversationPreview(conv).toLowerCase();
        return topicMatch || preview.includes(q);
      });
    } catch (err) {
      console.error('filterHistory error', err);
      this.filteredHistory = [...this.conversationHistory];
    }
  }

  getConversationPreview(conversation: any): string {
    try {
      const userMessages = (conversation.messages || []).filter((m: any) => m.type === 'user');
      if (!userMessages.length) return 'No messages';
      const first = userMessages[0].text || '';
      return first.length > 50 ? first.substring(0, 50) + '...' : first;
    } catch (err) {
      console.error('getConversationPreview error', err);
      return 'Error loading preview';
    }
  }

  calculateSessionDuration(conversation: any): string {
    try {
      if (!conversation || !conversation.startTime) return '0 min';
      const start = new Date(conversation.startTime);
      const end = conversation.endTime ? new Date(conversation.endTime) : new Date();
      const minutes = Math.floor((+end - +start) / 1000 / 60);
      return minutes + ' min';
    } catch (err) {
      console.error('calculateSessionDuration error', err);
      return '0 min';
    }
  }

  getAveragePronunciationScore(conversation: any): number {
    try {
      const users = (conversation.messages || []).filter((m: any) => m.type === 'user');
      if (!users.length) return 0;
      const total = users.reduce((s: number, m: any) => s + (m.pronunciationScore || 0), 0);
      return Math.round(total / users.length);
    } catch (err) {
      console.error('getAveragePronunciationScore error', err);
      return 0;
    }
  }

  getCorrectionCount(conversation: any): number {
    try {
      return (conversation.messages || []).filter((m: any) => m.type === 'user' && m.correction).length;
    } catch (err) {
      console.error('getCorrectionCount error', err);
      return 0;
    }
  }

  clearHistory(): void {
    if (!confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) return;
    try {
      this.conversationHistory = [];
      this.filteredHistory = [];
      this.selectedHistoryConversation = null;
      localStorage.removeItem('conversationHistory');
      localStorage.removeItem('currentConversation');
      this.showSuccess('Conversation history cleared');
    } catch (err : any ) {
      console.error('clearHistory error', err);
      this.showError('Failed to clear history: ' + (err?.message || err));
    }
  }

  /* -------------------- UI helpers -------------------- */
  switchMode(mode: 'conversation' | 'history'): void {
    this.currentMode = mode;
    if (mode === 'history' && this.conversationHistory.length && !this.selectedHistoryConversation) {
      this.selectedHistoryConversation = this.conversationHistory[0];
    }
  }

  updateStatus(): void {
    if (this.isListening) this.conversationStatus = 'listening';
    else if (this.isSpeaking) this.conversationStatus = 'speaking';
    else this.conversationStatus = 'idle';
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = ''), 5000);
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  // Safe url helper for template if needed
  safeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url || '');
  }
}
