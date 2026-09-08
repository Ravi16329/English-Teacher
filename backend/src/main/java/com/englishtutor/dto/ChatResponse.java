package com.englishtutor.dto;

/**
 * What the tutor sends back for each learner turn.
 */
public record ChatResponse(
        String reply,                 // the tutor's spoken/written reply, continuing the conversation
        String correction,            // a corrected version of userText, or null if nothing to fix
        String correctionExplanation, // short, friendly explanation of the fix, or null
        String pronunciationTip       // one short, actionable tip, or null
) {}
