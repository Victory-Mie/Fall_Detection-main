package com.falldetection.backend.service;

import com.falldetection.backend.dto.ChatDialog;
import reactor.core.publisher.Flux;
import java.util.List;

public interface IChatService {
    Flux<String> streamChat(String sessionId, String message);
    void clearHistory(String sessionId);
    List<ChatDialog> getDialogs(String sessionId);
}