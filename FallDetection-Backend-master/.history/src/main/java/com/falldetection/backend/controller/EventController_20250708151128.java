package com.falldetection.backend.controller;

import com.falldetection.backend.dto.Result;
import com.falldetection.backend.service.IEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/event")
@CrossOrigin
public class EventController {
    private static final Logger log = LoggerFactory.getLogger(EventController.class);
    @Autowired
    private IEventService eventService;

    /**
     * 获取跌倒事件列表
     */
    @GetMapping("/list")
    public Result getEventList(@RequestParam(defaultValue = "1") Integer page,
                               @RequestParam(defaultValue = "5") Integer size) {
        log.info("获取事件列表请求: page={}, size={}", page, size);
        Result result = eventService.getEventList(page, size);
        log.info("获取事件列表结果: {}", result);
        return result;
    }

}
