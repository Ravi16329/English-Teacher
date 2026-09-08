package com.englishtutor.dto;

/**
 * One turn of the conversation, sent by the frontend as context so the
 * tutor can keep track of what has already been said in this session.
 * The frontend holds the session in memory; nothing is persisted server-side.
 */
public record MessageDto(
        String role,   // "user" or "assistant"
        String text
) {}
