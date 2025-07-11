package com.falldetection.backend.controller;

import com.falldetection.backend.dto.ChatDialog;
import com.falldetection.backend.dto.ChatMessageDTO;
import com.falldetection.backend.dto.ChatRequest;
import com.falldetection.backend.dto.ChatResponse;
import com.falldetection.backend.dto.Result;
import dev.langchain4j.data.message.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
    @Autowired
    private ChatService chatService;

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
     * 清空当前会话历史记录
     * @param sessionId 会话ID
     * @return Result 响应结果
     */
    @DeleteMapping("/history/{sessionId}")
    public Result clearHistory(@PathVariable("sessionId") String sessionId) {
        try {
            chatService.clearHistory(sessionId);
            return Result.ok();
        } catch (Exception e) {
            log.error("清空历史记录失败", e);
            return Result.fail("清空历史记录失败");
        }
    }

    /**
     * 获取当前会话的对话记录
     * @param sessionId 会话ID
     * @return Result 包含历史消息的响应
     */
    @GetMapping("/dialogs/{sessionId}")
    public Result getDialogs(@PathVariable("sessionId") String sessionId) {
        try {
            List<ChatDialog> dialogs = chatService.getDialogs(sessionId);
            return Result.ok(dialogs);
        } catch (Exception e) {
            log.error("获取历史记录失败", e);
            return Result.fail("获取历史记录失败");
        }
    }
}