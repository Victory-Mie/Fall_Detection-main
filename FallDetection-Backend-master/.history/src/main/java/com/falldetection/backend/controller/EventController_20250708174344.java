package com.falldetection.backend.controller;

import com.falldetection.backend.dto.Result;
import com.falldetection.backend.dto.SaveRequest;
import com.falldetection.backend.service.IEventService;

import lombok.extern.slf4j.Slf4j;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/event")
@CrossOrigin
@Slf4j
public class EventController {

    @Autowired
    private IEventService eventService;

    /**
     * 获取跌倒事件列表
     */
    @GetMapping("/list")
    public Result getEventList(@RequestParam(defaultValue = "1") Integer page,
                               @RequestParam(defaultValue = "5") Integer size) {
        log.info("获取事件列表请求: page={}, size={}", page, size);
        return eventService.getEventList(page, size);
    }


    @PostMapping("/save-event")
    public Result saveEvent(@RequestBody SaveRequest saveRequest) {
        String sessionId = saveRequest.getSessionId();
        Integer eventType = saveRequest.getEventType();
        return eventService.saveEvent(sessionId, eventType);
    }

}
