package com.falldetection.backend.controller;

import com.falldetection.backend.dto.LoginFormDTO;
import com.falldetection.backend.dto.RegisterDTO;
import com.falldetection.backend.dto.Result;
import com.falldetection.backend.service.IUserService;

import lombok.extern.slf4j.Slf4j;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
@Slf4j
public class UserController {

    @Autowired
    private IUserService userService;

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public Result register(@RequestBody RegisterDTO registerDTO) {
        log.info("用户注册请求: {}", registerDTO);
        return userService.register(registerDTO);
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result login(@RequestBody LoginFormDTO loginForm) {
        log.info("用户登录请求: {}", loginForm);
        return userService.login(loginForm);
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public Result me() {
        log.info("获取当前用户信息请求");
        return userService.me();
    }
}
