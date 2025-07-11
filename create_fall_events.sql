USE falldetection;
CREATE TABLE fall_events (
    id bigint NOT NULL AUTO_INCREMENT,
    user_id bigint DEFAULT NULL,
    timestamp datetime DEFAULT NULL,
    event_type int DEFAULT NULL,
    description text,
    response text,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_timestamp (timestamp)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;