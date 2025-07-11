package com.falldetection.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "qwen")
@Data
public class QwenConfig {
    /** API密钥，用于认证访问Qwen服务 */
    private String apiKey;

    /** API基础URL，通义千问的OpenAI兼容模式端点 */
    private String baseUrl;

    /** 使用的模型名称，qwen-max是最强的模型 */
    private String modelName;

    /** 生成文本的随机性控制，0-1之间，值越大越随机 */
    private Double temperature;

    /** 单次生成的最大token数量 */
    private Integer maxTokens;
}