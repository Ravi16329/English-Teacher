package com.englishtutor.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * Payload sent from the React app each time the learner finishes speaking.
 */
public record ChatRequest(

        @NotBlank(message = "userText must not be blank")
        String userText,

        @NotBlank(message = "topic must not be blank")
        String topic,

        // Difficulty influences how the tutor phrases replies and corrections
        String level,

        // Prior turns in this session, oldest first, used as conversational context.
        // Optional — an empty/omitted list just means "start of conversation".
        List<MessageDto> history
) {}
