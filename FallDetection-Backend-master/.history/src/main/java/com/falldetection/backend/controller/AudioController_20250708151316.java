package com.falldetection.backend.controller;

import com.falldetection.backend.dto.Result;
import com.falldetection.backend.service.IAudioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audio")
@CrossOrigin
public class AudioController {
    private static final Logger log = LoggerFactory.getLogger(AudioController.class);
    @Autowired
    private IAudioService audioService;

    /**
     * 上传音频并识别
     */
    @PostMapping("/process")
    public Result processAudio(@RequestBody AudioRequestDTO request) {
        log.info("音频处理请求: {}", request);
        return audioService.processAudio(request.getAudioData(), request.getAudioFormat());
    }
}
