package com.falldetection.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventDTO {
    private Long id;
    private Long userId;
    private LocalDateTime timestamp;

    // 事件类型（0:confirm, 1:false_alarm, 2:emergency）
    private Integer eventType;
    private List<ChatDialog> dialog;
}
