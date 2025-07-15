package com.falldetection.backend.controller;

import com.falldetection.backend.service.EmergencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/fall")
public class EmergencyController {
    @Autowired
    private EmergencyService emergencyService;

    @PostMapping("/send-emergency-email")
    public Map<String, Object> sendEmergencyEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String eventId = body.get("eventId");
        boolean success = emergencyService.sendEmergencyEmail(email, eventId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", success ? "Email sent" : "Failed to send email");
        return result;
    }
} 