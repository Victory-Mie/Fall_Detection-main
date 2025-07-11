package com.falldetection.backend.dto;

import lombok.Data;

/*
 * 只用于执行saveEvent方法的请求体
 */
@Data
public class SaveRequest {
    private String sessionId;
    private Integer eventType;
}
