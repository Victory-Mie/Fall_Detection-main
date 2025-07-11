package com.falldetection.backend.dto;

import lombok.Data;

@Data
public class AudioRequestDTO {
    private String audioData; // Base64编码的音频数据
    private String audioFormat; // 音频格式，如 "wav", "mp3"
}
