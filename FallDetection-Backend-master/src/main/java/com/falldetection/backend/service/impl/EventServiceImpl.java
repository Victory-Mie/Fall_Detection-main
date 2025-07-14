package com.falldetection.backend.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.json.JSONUtil;
import com.falldetection.backend.service.IChatService;
import lombok.extern.slf4j.Slf4j;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.falldetection.backend.dto.ChatDialog;
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
import java.util.HashMap;

@Service
@Slf4j
public class EventServiceImpl extends ServiceImpl<EventMapper, Event> implements IEventService {

    @Autowired
    private IChatService chatService;

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
                    EventDTO dto = new EventDTO();
                    dto.setId(event.getId());
                    dto.setUserId(event.getUserId());
                    dto.setTimestamp(event.getTimestamp());
                    dto.setEventType(event.getEventType());

                    // 手动转换dialog字段：从JSON字符串转换为List<ChatDialog>
                    if (event.getDialog() != null && !event.getDialog().isEmpty()) {
                        try {
                            List<ChatDialog> dialogs = JSONUtil.toList(event.getDialog(), ChatDialog.class);
                            dto.setDialog(dialogs);
                        } catch (Exception e) {
                            log.warn("解析dialog JSON失败: {}", event.getDialog(), e);
                            dto.setDialog(null);
                        }
                    } else {
                        dto.setDialog(null);
                    }

                    return dto;
                })
                .collect(Collectors.toList());

        // 返回Map，包含records和total
        HashMap<String, Object> resultMap = new HashMap<>();
        resultMap.put("records", eventDTOs);
        resultMap.put("total", eventPage.getTotal());
        return Result.ok(resultMap);
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
        if (sessionId == null) {
            log.warn("sessionId 为空. [event:{}]", event);
            event.setDialog(null);
        } else {
            List<ChatDialog> dialogs = chatService.getDialogs(sessionId);
            if (dialogs != null && !dialogs.isEmpty()) {
                event.setDialog(JSONUtil.toJsonStr(dialogs));
            } else {
                event.setDialog(null);
            }
        }

        boolean success = save(event);
        if (success) {
            if (sessionId != null) {
                // 清空会话历史，降低sessionId碰撞概率
                chatService.clearHistory(sessionId);
            }
            return Result.ok();
        } else {
            log.error("保存事件失败. [event:{}]", event);
            return Result.fail("保存事件失败");
        }
    }

    @Override
    public Result deleteEvent(Long id) {
        log.info("[deleteEvent] 请求删除事件id={}", id);
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            log.warn("[deleteEvent] 用户未登录");
            return Result.fail("用户未登录");
        }
        log.info("[deleteEvent] 当前用户id={}", user.getId());
        Event event = getById(id);
        if (event == null) {
            log.warn("[deleteEvent] 事件id={} 不存在", id);
            return Result.fail("事件不存在");
        }
        log.info("[deleteEvent] 事件userId={}, 当前用户id={}", event.getUserId(), user.getId());
        if (!event.getUserId().equals(user.getId())) {
            log.warn("[deleteEvent] 用户无权删除该事件: 事件userId={}, 当前用户id={}", event.getUserId(), user.getId());
            return Result.fail("无权删除该事件");
        }
        boolean success = removeById(id);
        log.info("[deleteEvent] 删除结果: {}", success);
        if (success) {
            return Result.ok();
        } else {
            return Result.fail("删除失败");
        }
    }

    @Override
    public Result getEventStats() {
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("用户未登录");
        }
        QueryWrapper<Event> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", user.getId());
        List<Event> events = list(wrapper);

        long total = events.size();
        long confirmed = events.stream().filter(e -> e.getEventType() == 0).count();
        long falseAlarm = events.stream().filter(e -> e.getEventType() == 1).count();
        long emergency = events.stream().filter(e -> e.getEventType() == 2).count();

        HashMap<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("confirmed", confirmed);
        stats.put("falseAlarm", falseAlarm);
        stats.put("emergency", emergency);

        return Result.ok(stats);
    }
}
