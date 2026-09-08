package com.englishtutor.controller;

import com.englishtutor.dto.ChatRequest;
import com.englishtutor.dto.ChatResponse;
import com.englishtutor.dto.TopicDto;
import com.englishtutor.service.TutorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    private final TutorService tutorService;

    public TutorController(TutorService tutorService) {
        this.tutorService = tutorService;
    }

    @GetMapping("/topics")
    public List<TopicDto> getTopics() {
        return tutorService.getTopics();
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return tutorService.chat(request);
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
