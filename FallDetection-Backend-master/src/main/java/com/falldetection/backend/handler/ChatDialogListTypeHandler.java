package com.falldetection.backend.handler;

import com.baomidou.mybatisplus.extension.handlers.AbstractJsonTypeHandler;
import com.falldetection.backend.dto.ChatDialog;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;

public class ChatDialogListTypeHandler extends AbstractJsonTypeHandler<List<ChatDialog>> {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public ChatDialogListTypeHandler() {
        super((Class<List<ChatDialog>>) (Class<?>) List.class);
    }

    @Override
    public List<ChatDialog> parse(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<ChatDialog>>() {});
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public String toJson(List<ChatDialog> obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
