package com.falldetection.backend.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import cn.hutool.core.lang.UUID;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.falldetection.backend.dto.LoginFormDTO;
import com.falldetection.backend.dto.UserDTO;

import com.falldetection.backend.dto.RegisterDTO;
import com.falldetection.backend.dto.Result;
import com.falldetection.backend.entity.User;
import com.falldetection.backend.mapper.UserMapper;
import com.falldetection.backend.service.IUserService;
import com.falldetection.backend.utils.PasswordEncoder;
import com.falldetection.backend.utils.RedisConstants;
import com.falldetection.backend.utils.RegexUtils;
import com.falldetection.backend.utils.UserHolder;
import jakarta.annotation.Resource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static com.falldetection.backend.utils.RedisConstants.LOGIN_USER_TTL;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public Result register(RegisterDTO registerDTO) {
        // 1. 校验手机号或邮箱
        String phone = registerDTO.getPhoneNumber();
        String email = registerDTO.getEmail();
        String username = registerDTO.getUsername();
        String password = registerDTO.getPassword();

        if (StrUtil.isBlank(username)) {
            return Result.fail("用户名不能为空");
        }
        if (StrUtil.isBlank(password)) {
            return Result.fail("密码不能为空");
        }
        if (StrUtil.isBlank(phone)) {
            return Result.fail("手机号不能为空");
        }

        // 校验手机号
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误！");
        }

        // 校验邮箱（如果提供）
        if (StrUtil.isNotBlank(email) && RegexUtils.isEmailInvalid(email)) {
            return Result.fail("邮箱格式错误！");
        }

        // 2. 判断用户名是否存在
        User user = query().eq("username", username).one();
        if (user != null) {
            return Result.fail("用户名已存在");
        }

        // 3. 判断手机号是否存在
        if (StrUtil.isNotBlank(phone)) {
            user = query().eq("phone_number", phone).one();
            if (user != null) {
                return Result.fail("手机号已被注册");
            }
        }

        // 4. 判断邮箱是否存在（如果提供）
        if (StrUtil.isNotBlank(email)) {
            user = query().eq("email", email).one();
            if (user != null) {
                return Result.fail("邮箱已被注册");
            }
        }

        // 5. 创建新用户
        user = new User();
        user.setUsername(username);
        user.setPassword(PasswordEncoder.encode(password));
        user.setPhoneNumber(phone);
        user.setEmail(email);

        // 6. 保存用户
        save(user);
        return Result.ok();
    }

    @Override
    public Result login(LoginFormDTO loginForm) {
        // 1. 校验用户名和密码
        String username = loginForm.getUsername();
        String password = loginForm.getPassword();
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            return Result.fail("用户名或密码不能为空");
        }

        // 2. 根据用户名查询用户
        User user = query().eq("username", username).one();
        if (user == null) {
            return Result.fail("用户不存在");
        }

        // 3. 校验密码
        if (!PasswordEncoder.matches(user.getPassword(), password)) {
            return Result.fail("密码错误");
        }

        //随机生成token，作为登录令牌
        String token = UUID.randomUUID().toString(true);

        UserDTO userDTO = BeanUtil.copyProperties(user, UserDTO.class);
        //将User对象转为HashMap存储
        Map<String, Object> userMap = BeanUtil.beanToMap(userDTO, new HashMap<>(),
                CopyOptions.create()
                        .setIgnoreNullValue(true)
                        .setFieldValueEditor((fieldName, fieldValue) -> fieldValue.toString()));
        //存储
        String tokenKey = RedisConstants.LOGIN_USER_KEY + token;
        stringRedisTemplate.opsForHash().putAll(tokenKey, userMap);

        //设置token有效期
        stringRedisTemplate.expire(tokenKey, LOGIN_USER_TTL, TimeUnit.HOURS);

        // 返回token
        return Result.ok(token);
    }

    @Override
    public Result me() {
        UserDTO userDTO = UserHolder.getUser();
        if (userDTO == null) {
            return Result.fail("用户未登录");
        }
        Long id = userDTO.getId();
        User user = query().eq("user_id", id).one();
        return Result.ok(user);
    }
}
