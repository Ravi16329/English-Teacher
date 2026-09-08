package com.englishtutor.service;

import com.englishtutor.dto.ChatRequest;
import com.englishtutor.dto.ChatResponse;
import com.englishtutor.dto.TopicDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TutorService {

    private static final List<TopicDto> TOPICS = List.of(
            new TopicDto("daily-life", "Daily Life", "Hello! Let's talk about daily life. How was your day today?"),
            new TopicDto("work", "Work", "Hi there! Let's discuss work and business. What do you do for a living?"),
            new TopicDto("travel", "Travel", "Greetings! Ready to talk about travel? What's the most interesting place you've visited?"),
            new TopicDto("food", "Food", "Hello! Let's chat about food. What's your favorite cuisine?"),
            new TopicDto("hobbies", "Hobbies", "Hi! What are your hobbies? I'd love to hear what you enjoy doing in your free time."),
            new TopicDto("random", "Free Chat", "Hey! Let's have a casual chat. What's on your mind today?")
    );

    private final LlmClient llmClient;

    public TutorService(LlmClient llmClient) {
        this.llmClient = llmClient;
    }

    public List<TopicDto> getTopics() {
        return TOPICS;
    }

    public ChatResponse chat(ChatRequest request) {
        return llmClient.getTutorReply(request);
    }
}
