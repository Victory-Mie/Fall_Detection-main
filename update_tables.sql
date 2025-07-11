USE FallDetection;
-- 删除不需要的字段
ALTER TABLE `fall_events` DROP COLUMN IF EXISTS `description`;
ALTER TABLE `fall_events` DROP COLUMN IF EXISTS `response`;
-- 修改dialog字段类型为text
ALTER TABLE `fall_events`
MODIFY COLUMN `dialog` text COMMENT '记录用户和ai针对此次事件的问答记录';
-- 如果dialog字段不存在，则添加
ALTER TABLE `fall_events`
ADD COLUMN IF NOT EXISTS `dialog` text COMMENT '记录用户和ai针对此次事件的问答记录';