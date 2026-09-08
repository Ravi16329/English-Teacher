package com.englishtutor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient llmWebClient(LlmProperties llmProperties) {
        return WebClient.builder()
                .baseUrl(llmProperties.getBaseUrl())
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
