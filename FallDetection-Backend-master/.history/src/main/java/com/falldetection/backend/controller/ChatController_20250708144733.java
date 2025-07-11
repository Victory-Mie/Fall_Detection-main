package com.falldetection.backend.controller;

import com.falldetection.backend.dto.ChatMessageDTO;
import com.falldetection.backend.entity.ChatRequest;
import com.falldetection.backend.entity.ChatResponse;
import dev.langchain4j.data.message.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {

    /** 注入聊天服务 */
    private final ChatService chatService;

    /**
     * 构造函数注入依赖
     * @param chatService 聊天服务实例
     */
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * 流式聊天接口（Server-Sent Events格式）
     * 使用SSE协议向前端推送流式数据
     *
     * @param request 聊天请求对象
     * @return Flux<ServerSentEvent<ChatResponse>> SSE流式响应
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<ChatResponse>> streamChat(@RequestBody ChatRequest request) {
        // 获取或生成会话ID
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = UUID.randomUUID().toString(); // 生成随机会话ID
        }

        log.info("Starting stream chat for session: {} with message: {}", sessionId, request.getMessage());

        final String finalSessionId = sessionId; // final变量用于lambda表达式

        // 调用聊天服务获取流式响应
        return chatService.streamChat(sessionId, request.getMessage())
                // 将每个token包装成SSE事件
                .map(token -> ServerSentEvent.builder(ChatResponse.token(finalSessionId, token))
                        .id(UUID.randomUUID().toString())    // 设置事件ID
                        .event("message")                    // 设置事件类型
                        .build())
                // 在流结束时添加完成事件
                .concatWith(Mono.just(ServerSentEvent.builder(ChatResponse.complete(finalSessionId))
                        .id(UUID.randomUUID().toString())
                        .event("complete")
                        .build()))
                // 错误处理：将错误转换为SSE错误事件
                .onErrorResume(error -> {
                    log.error("Error in stream chat", error);
                    return Flux.just(ServerSentEvent.builder(ChatResponse.error(finalSessionId, error.getMessage()))
                            .id(UUID.randomUUID().toString())
                            .event("error")
                            .build());
                });
    }

    /**
     * 流式聊天接口（NDJSON格式）
     * 返回换行符分隔的JSON流，适合某些前端框架
     *
     * @param request 聊天请求对象
     * @return Flux<ChatResponse> JSON流式响应
     */
    @PostMapping(value = "/stream-json", produces = MediaType.APPLICATION_NDJSON_VALUE)
    public Flux<ChatResponse> streamChatJson(@RequestBody ChatRequest request) {
        // 获取或生成会话ID
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = UUID.randomUUID().toString();
        }

        final String finalSessionId = sessionId;

        // 调用聊天服务获取流式响应，并包装成ChatResponse对象
        return chatService.streamChat(sessionId, request.getMessage())
                .map(token -> ChatResponse.token(finalSessionId, token))
                .concatWith(Mono.just(ChatResponse.complete(finalSessionId)))
                .onErrorResume(error -> Flux.just(ChatResponse.error(finalSessionId, error.getMessage())));
    }

    /**
     * 清空会话历史记录
     * @param sessionId 会话ID
     * @return Mono<ResponseEntity<Void>> 响应结果
     */
    @DeleteMapping("/history/{sessionId}")
    public Mono<ResponseEntity<Void>> clearHistory(@PathVariable String sessionId) {
        // 调用服务清空历史记录
        chatService.clearHistory(sessionId);
        // 返回200 OK响应
        return Mono.just(ResponseEntity.ok().build());
    }

    /**
     * 获取会话历史记录
     * @param sessionId 会话ID
     * @return Mono<ResponseEntity<List<ChatMessage>>> 包含历史消息的响应
     */
    @GetMapping("/history/{sessionId}")
    public Mono<ResponseEntity<List<ChatMessageDTO>>> getHistory(@PathVariable("sessionId") String sessionId) {
        // 获取历史记录
        List<ChatMessage> history = chatService.getHistory(sessionId);
        // 返回包含历史记录的响应
        List<ChatMessageDTO> dtoList = history.stream()
                .map(msg -> new ChatMessageDTO(msg.getClass().getSimpleName(), msg.text()))
                .collect(Collectors.toList());
        return Mono.just(ResponseEntity.ok(dtoList));
    }
}
