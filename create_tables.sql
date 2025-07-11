USE FallDetection;
-- 创建用户表
CREATE TABLE `user` (
    `user_id` bigint NOT NULL AUTO_INCREMENT,
    `username` varchar(255) DEFAULT NULL,
    `password` varchar(255) DEFAULT NULL,
    `email` varchar(255) DEFAULT NULL,
    `phone_number` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- 创建跌倒事件表
CREATE TABLE `fall_events` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint DEFAULT NULL,
    `timestamp` datetime DEFAULT NULL,
    `event_type` int DEFAULT NULL COMMENT '事件类型（0:confirm, 1:false_alarm, 2:emergency）',
    `dialog` text COMMENT '记录用户和ai针对此次事件的问答记录',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_timestamp` (`timestamp`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;