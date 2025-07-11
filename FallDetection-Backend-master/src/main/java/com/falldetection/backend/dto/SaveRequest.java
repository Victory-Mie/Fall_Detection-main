package com.falldetection.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/*
 * 只用于执行saveEvent方法的请求体
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SaveRequest {
    private String sessionId;
    private Integer eventType;
}