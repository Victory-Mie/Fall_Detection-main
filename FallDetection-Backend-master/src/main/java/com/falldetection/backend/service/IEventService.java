package com.falldetection.backend.service;

import java.util.List;

import com.baomidou.mybatisplus.extension.service.IService;
import com.falldetection.backend.dto.ChatDialog;
import com.falldetection.backend.dto.Result;
import com.falldetection.backend.entity.Event;

public interface IEventService extends IService<Event> {
    Result getEventList(Integer page, Integer size);
    Result saveEvent(String sessionId, Integer eventType);
}
