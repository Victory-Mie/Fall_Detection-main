package com.falldetection.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AudioStreamDTO {
    private String sessionId;
    private byte[] audioData;
    private boolean last;

    @Override
    public String toString() {
        return "AudioStreamDTO{" +
                "sessionId='" + sessionId + '\'' +
                ", audioData=" + audioData +
                ", last=" + last +
                "}\n";
    }
}