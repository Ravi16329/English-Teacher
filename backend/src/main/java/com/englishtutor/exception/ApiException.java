package com.englishtutor.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown for any expected failure (bad config, upstream LLM error, etc.)
 * that should be reported to the client as a clean JSON error instead of a stack trace.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
