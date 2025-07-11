package com.falldetection.backend.model;

import com.falldetection.backend.config.QwenConfig;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.model.output.Response;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Component
public class QwenStreamingChatModel {

    /** Qwen配置对象 */
    private final QwenConfig qwenConfig;

    /** LangChain4j的流式聊天模型实例 */
    private final OpenAiStreamingChatModel streamingChatModel;

    /**
     * 构造函数，初始化流式聊天模型
     * @param qwenConfig Qwen配置
     */
    public QwenStreamingChatModel(QwenConfig qwenConfig) {
        this.qwenConfig = qwenConfig;
        // 使用Builder模式构建OpenAI兼容的流式聊天模型
        this.streamingChatModel = OpenAiStreamingChatModel.builder()
                .apiKey(qwenConfig.getApiKey())              // 设置API密钥
                .baseUrl(qwenConfig.getBaseUrl())            // 设置API基础URL
                .modelName(qwenConfig.getModelName())        // 设置模型名称
                .temperature(qwenConfig.getTemperature())    // 设置温度参数
                .maxTokens(qwenConfig.getMaxTokens())        // 设置最大token数// 启用响应日志
                .build();
    }

    /**
     * 单轮对话流式生成
     * @param message 用户输入的消息
     * @return Flux<String> 流式返回的文本流
     */
    public Flux<String> streamChat(String message) {
        // 创建Flux流，用于处理异步流式数据
        return Flux.create(sink -> {
            try {
                // 调用LangChain4j的流式生成方法，使用单个消息
                streamingChatModel.generate(
                        message,
                        // 流式响应处理器，定义如何处理流式数据
                        new StreamingResponseHandler<AiMessage>() {
                            /**
                             * 每接收到一个token时调用
                             * @param token 接收到的文本片段
                             */
                            @Override
                            public void onNext(String token) {
                                sink.next(token); // 向下游发送token
                            }

                            /**
                             * 流式生成完成时调用
                             * @param response 完整的响应对象
                             */
                            @Override
                            public void onComplete(Response<AiMessage> response) {
                                sink.complete(); // 完成流
                            }

                            /**
                             * 发生错误时调用
                             * @param error 错误对象
                             */
                            @Override
                            public void onError(Throwable error) {
                                sink.error(error); // 向下游传递错误
                            }
                        }
                );
            } catch (Exception e) {
                // 捕获同步异常并传递给下游
                sink.error(e);
            }
        });
    }

    /**
     * 多轮对话流式生成（带历史消息）
     * @param messages 包含历史消息的列表
     * @return Flux<String> 流式返回的文本流
     */
    public Flux<String> streamChatWithHistory(List<ChatMessage> messages) {
        return Flux.create(sink -> {
            try {
                // 使用消息列表进行多轮对话生成
                streamingChatModel.generate(
                        messages,
                        new StreamingResponseHandler<AiMessage>() {
                            /**
                             * 每接收到一个token时调用
                             * @param token 接收到的文本片段
                             */
                            @Override
                            public void onNext(String token) {
                                sink.next(token);
                            }

                            /**
                             * 流式生成完成时调用
                             * @param response 完整的响应对象
                             */
                            @Override
                            public void onComplete(Response<AiMessage> response) {
                                sink.complete();
                            }

                            /**
                             * 发生错误时调用
                             * @param error 错误对象
                             */
                            @Override
                            public void onError(Throwable error) {
                                sink.error(error);
                            }
                        }
                );
            } catch (Exception e) {
                sink.error(e);
            }
        });
    }
}