package com.falldetection.backend.controller;

import com.falldetection.backend.dto.Result;
import com.falldetection.backend.service.IAudioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audio")
@CrossOrigin
public class AudioController {
    @Autowired
    private IAudioService audioService;

    /**
     * 上传音频并识别
     */
    @PostMapping("/process")
    public Result processAudio(@RequestBody AudioRequestDTO request) {
        return audioService.processAudio(request.getAudioData(), request.getAudioFormat());
    }
}
