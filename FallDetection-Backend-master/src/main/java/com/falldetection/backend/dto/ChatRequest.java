package com.falldetection.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatRequest {
    /** 会话ID，用于标识不同的对话会话 */
    private String sessionId;

    /** 用户输入的消息内容 */
    private String message;

    /** 额外的元数据，可用于扩展功能 */
//    private Map<String, Object> metadata = new HashMap<>();
}