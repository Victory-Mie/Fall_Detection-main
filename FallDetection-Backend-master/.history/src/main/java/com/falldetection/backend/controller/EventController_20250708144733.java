package com.falldetection.backend.controller;

import com.falldetection.backend.dto.Result;
import com.falldetection.backend.service.IEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/event")
@CrossOrigin
public class EventController {
    @Autowired
    private IEventService eventService;

    /**
     * 获取跌倒事件列表
     */
    @GetMapping("/list")
    public Result getEventList(@RequestParam(defaultValue = "1") Integer page,
                               @RequestParam(defaultValue = "5") Integer size) {
        return eventService.getEventList(page, size);
    }

}
