package com.falldetection.backend.controller;

import com.falldetection.backend.dto.AudioStreamDTO;
import com.falldetection.backend.dto.TranscriptionResultDTO;
import com.falldetection.backend.service.IAudioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

/**
 * 音频流 WebSocket 控制器，处理 /ws/audio 端点
 */
@Controller
@Slf4j
public class AudioController {
    @Autowired
    private IAudioService audioService;

    /**
     * 处理前端通过 WebSocket 发送的音频流消息
     * 
     * @param audioStreamDTO 音频流片段
     * @return Flux<TranscriptionResultDTO> 实时转写结果
     */
    @MessageMapping("/audio")
    @SendTo("/topic/audio-result")
    public Flux<TranscriptionResultDTO> handleAudioStream(@Payload AudioStreamDTO audioStreamDTO) {
        // 调用音频转写服务，返回流式转写结果
        log.info("调用音频转写服务. [audioStreamDTO={}]", audioStreamDTO.toString());

        return audioService.streamTranscribe(
                audioStreamDTO.getSessionId(),
                audioStreamDTO.getAudioData(),
                audioStreamDTO.isLast());
    }
}