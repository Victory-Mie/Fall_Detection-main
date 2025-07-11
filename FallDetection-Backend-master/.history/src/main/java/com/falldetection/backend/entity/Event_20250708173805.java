package com.falldetection.backend.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.falldetection.backend.dto.ChatDialog;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.sql.Date;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("fall_events")
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
public class Event implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long userId;

    private LocalDateTime timestamp;

    // 事件类型（0:confirm, 1:false_alarm, 2:emergency）
    private Integer eventType;

    // 记录用户和ai针对此次事件的问答记录
    private List<ChatDialog> dialog;

}
