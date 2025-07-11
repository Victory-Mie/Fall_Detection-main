package com.falldetection.backend.service.impl;

import com.falldetection.backend.dto.ChatDialog;
import com.falldetection.backend.model.QwenStreamingChatModel;
import com.falldetection.backend.service.IChatService;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ChatServiceImpl implements IChatService {
    private final QwenStreamingChatModel qwenStreamingChatModel;
    private final Map<String, List<ChatMessage>> sessionHistory = new ConcurrentHashMap<>();
    private final Map<String, List<ChatDialog>> sessionDialogs = new ConcurrentHashMap<>();

    public ChatServiceImpl(QwenStreamingChatModel qwenStreamingChatModel) {
        this.qwenStreamingChatModel = qwenStreamingChatModel;
    }

    @Override
    public Flux<String> streamChat(String sessionId, String message) {
        List<ChatMessage> history = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());
        List<ChatDialog> dialogs = sessionDialogs.computeIfAbsent(sessionId, k -> new ArrayList<>());
        history.add(UserMessage.from(message));
        StringBuilder assistantReply = new StringBuilder();
        return qwenStreamingChatModel.streamChatWithHistory(history)
                .doOnNext(token -> {
                    assistantReply.append(token);
                    log.debug("Received token: {}", token);
                })
                .doOnComplete(() -> {
                    history.add(AiMessage.from(assistantReply.toString()));
                    dialogs.add(new ChatDialog(message, assistantReply.toString()));
                    log.info("Chat completed for session: {}", sessionId);
                })
                .doOnError(error -> {
                    log.error("Error in chat stream for session: {}", sessionId, error);
                });
    }

    @Override
    public void clearHistory(String sessionId) {
        sessionHistory.remove(sessionId);
    }

    @Override
    public List<ChatDialog> getDialogs(String sessionId) {
        return sessionDialogs.getOrDefault(sessionId, new ArrayList<>());
    }
}