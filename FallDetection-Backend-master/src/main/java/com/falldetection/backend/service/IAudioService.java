package com.falldetection.backend.service;

import com.falldetection.backend.dto.TranscriptionResultDTO;
import reactor.core.publisher.Flux;

public interface IAudioService {
    /**
     * 流式语音转写
     * @param sessionId 会话ID
     * @param audioStream 音频流（分片）
     * @param isLast 是否为最后一片
     * @return Flux<TranscriptionResultDTO> 实时转写结果
     */
    Flux<TranscriptionResultDTO> streamTranscribe(String sessionId, byte[] audioStream, boolean isLast);
}
