package com.falldetection.backend.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.falldetection.backend.dto.EventDTO;
import com.falldetection.backend.dto.Result;
import com.falldetection.backend.dto.UserDTO;
import com.falldetection.backend.entity.Event;
import com.falldetection.backend.mapper.EventMapper;
import com.falldetection.backend.service.IEventService;
import com.falldetection.backend.utils.SystemConstant;
import com.falldetection.backend.utils.UserHolder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventServiceImpl extends ServiceImpl<EventMapper, Event> implements IEventService {

    @Autowired
    private ChatService chatService;

    @Override
    public Result getEventList(Integer page, Integer size) {
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("用户未登录");
        }

        // 参数校验
        if (page == null || page < 1) {
            page = 1;
        }
        if (size == null || size < 1 || size > SystemConstant.MAX_PAGE_SIZE) {
            size = SystemConstant.DEFAULT_PAGE_SIZE;
        }

        // 分页查询
        Page<Event> pageInfo = new Page<>(page, size);
        QueryWrapper<Event> wrapper = new QueryWrapper<>();

        wrapper.eq("user_id", user.getId())
                .orderByDesc("timestamp");

        Page<Event> eventPage = page(pageInfo, wrapper);

        // 转换为DTO
        List<EventDTO> eventDTOs = eventPage.getRecords().stream()
                .map(event -> {
                    EventDTO dto = BeanUtil.copyProperties(event, EventDTO.class);
                    return dto;
                })
                .collect(Collectors.toList());

        return Result.ok(eventDTOs, eventPage.getTotal());
    }

    @Override
    public Result saveEvent(String sessionId, Integer eventType) {
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("用户未登录");
        }

        Event event = new Event();
        event.setUserId(user.getId());
        event.setTimestamp(LocalDateTime.now());
        event.setEventType(eventType);
        event.setDialog(chatService.getDialogs(sessionId));

        save(event);
        return Result.ok();
    }
}
