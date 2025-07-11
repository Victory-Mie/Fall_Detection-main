package com.falldetection.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatResponse {
    /** 会话ID */
    private String sessionId;

    /** 响应内容（token片段或错误信息） */
    private String content;

    /** 响应类型：token(文本片段) | complete(完成) | error(错误) */
    private String type;

    /** 额外的元数据 */
    private Map<String, Object> metadata = new HashMap<>();

    /**
     * 创建token类型的响应
     * @param sessionId 会话ID
     * @param content 文本片段内容
     * @return ChatResponse实例
     */
    public static ChatResponse token(String sessionId, String content) {
        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setContent(content);
        response.setType("token");
        return response;
    }

    /**
     * 创建完成类型的响应
     * @param sessionId 会话ID
     * @return ChatResponse实例
     */
    public static ChatResponse complete(String sessionId) {
        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setType("complete");
        return response;
    }

    /**
     * 创建错误类型的响应
     * @param sessionId 会话ID
     * @param error 错误信息
     * @return ChatResponse实例
     */
    public static ChatResponse error(String sessionId, String error) {
        ChatResponse response = new ChatResponse();
        response.setSessionId(sessionId);
        response.setContent(error);
        response.setType("error");
        return response;
    }
}