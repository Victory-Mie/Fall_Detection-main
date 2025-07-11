package com.falldetection.backend.service;

import com.falldetection.backend.model.QwenStreamingChatModel;
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
public class ChatService {

    /** Qwen流式聊天模型实例 */
    private final QwenStreamingChatModel qwenStreamingChatModel;

    /** 会话历史记录存储，key为sessionId，value为消息列表 */
    /** 使用ConcurrentHashMap保证线程安全 */
    private final Map<String, List<ChatMessage>> sessionHistory = new ConcurrentHashMap<>();

    /**
     * 构造函数注入依赖
     * @param qwenStreamingChatModel Qwen流式聊天模型
     */
    public ChatService(QwenStreamingChatModel qwenStreamingChatModel) {
        this.qwenStreamingChatModel = qwenStreamingChatModel;
    }

    /**
     * 流式聊天方法
     * @param sessionId 会话ID，用于区分不同的对话会话
     * @param message 用户输入的消息
     * @return Flux<String> 流式返回AI回复的文本片段
     */
    public Flux<String> streamChat(String sessionId, String message) {
        // 获取或创建会话历史记录
        // computeIfAbsent：如果key不存在则创建新的ArrayList，存在则返回现有值
        List<ChatMessage> history = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());

        // 添加用户消息到历史记录 - 使用正确的构造方式
        history.add(UserMessage.from(message));

        // 用于拼接完整的助手回复
        StringBuilder assistantReply = new StringBuilder();

        // 调用流式聊天模型生成回复
        return qwenStreamingChatModel.streamChatWithHistory(history)
                .doOnNext(token -> {
                    // 每接收到一个token时，拼接到完整回复中
                    assistantReply.append(token);
                    log.debug("Received token: {}", token);
                })
                .doOnComplete(() -> {
                    // 流式生成完成后，将完整的助手回复添加到历史记录
                    // 使用正确的AiMessage构造方式
                    history.add(AiMessage.from(assistantReply.toString()));
                    log.info("Chat completed for session: {}", sessionId);
                })
                .doOnError(error -> {
                    // 发生错误时记录日志
                    log.error("Error in chat stream for session: {}", sessionId, error);
                });
    }

    /**
     * 清空指定会话的历史记录
     * @param sessionId 会话ID
     */
    public void clearHistory(String sessionId) {
        sessionHistory.remove(sessionId);
    }

    /**
     * 获取指定会话的历史记录
     * @param sessionId 会话ID
     * @return 消息历史列表，如果会话不存在则返回空列表
     */
    public List<ChatMessage> getHistory(String sessionId) {
        return sessionHistory.getOrDefault(sessionId, new ArrayList<>());
    }
}
