package com.falldetection.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.falldetection.backend.dto.LoginFormDTO;
import com.falldetection.backend.dto.RegisterDTO;
import com.falldetection.backend.dto.Result;
import com.falldetection.backend.entity.User;

public interface IUserService extends IService <User> {
    Result register(RegisterDTO registerDTO);

    Result login(LoginFormDTO loginForm);

    Result me();
}
