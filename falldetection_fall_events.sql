DROP TABLE IF EXISTS `fall_events`;

CREATE TABLE `fall_events` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint DEFAULT NULL,
    `timestamp` datetime DEFAULT NULL,
    `event_type` int DEFAULT NULL COMMENT '事件类型（0:confirm, 1:false_alarm, 2:emergency）',
    `dialog` text COLLATE utf8mb4_unicode_ci COMMENT '记录用户和ai针对此次事件的问答记录',
    `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_timestamp` (`timestamp`)
) ENGINE = InnoDB AUTO_INCREMENT = 132 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;