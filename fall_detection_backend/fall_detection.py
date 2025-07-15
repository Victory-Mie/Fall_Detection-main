import cv2
import numpy as np
from ultralytics import YOLO
from datetime import datetime
import os
from collections import deque

class FallDetector:
    def __init__(self):
        self.model = YOLO("yolov8n-pose.pt")
        self.cap = cv2.VideoCapture(0)
        # 修改保存目录为static/fall_images
        self.save_dir = os.path.join("static", "fall_images")
        os.makedirs(self.save_dir, exist_ok=True)
        self.fall_logs = []

        # 用于缓存关键点历史
        self.pose_history = deque(maxlen=5)  # 存5帧

    def is_fallen(self, keypoints):
        try:
            if keypoints.shape[0] < 13:
                return False

            nose = keypoints[0]
            left_hip = keypoints[11]
            right_hip = keypoints[12]
            left_shoulder = keypoints[5]
            right_shoulder = keypoints[6]

            # 当前帧横向 vs 纵向跨度
            hip_center = (left_hip + right_hip) / 2
            shoulder_center = (left_shoulder + right_shoulder) / 2

            vertical_span = abs(nose[1] - hip_center[1])
            horizontal_span = abs(nose[0] - hip_center[0])

            posture_ratio = horizontal_span / (vertical_span + 1e-5)

            # 判断动作突变（姿态变化）
            if len(self.pose_history) >= 5:
                prev_kps = self.pose_history[0]
                prev_nose = prev_kps[0]
                delta_y = abs(nose[1] - prev_nose[1])

                sudden_drop = delta_y > 50  # 突然下坠
            else:
                sudden_drop = False

            # 判定为跌倒的条件：横向展开 + 姿态突变
            is_flat = posture_ratio > 1.5
            return is_flat and sudden_drop
        except:
            return False

    def get_current_time(self):
        return datetime.now()

    def save_fall_screenshot(self, frame, timestamp):
        filename = f"fall_{timestamp}.jpg"
        path = os.path.join(self.save_dir, filename)
        cv2.imwrite(path, frame)
        # 返回前端可访问的URL
        return f"/static/fall_images/{filename}"

    def generate(self):
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break

            results = self.model(frame)
            fallen_detected = False

            if results and results[0].keypoints is not None:
                kps_batch = results[0].keypoints.xy.cpu().numpy()

                for person_kp in kps_batch:
                    if person_kp.shape[0] < 13:
                        continue

                    self.pose_history.append(person_kp)  # 更新历史

                    fallen = self.is_fallen(person_kp)
                    color = (0, 0, 255) if fallen else (0, 255, 0)
                    label = "FALLEN" if fallen else "Normal"

                    nose_x, nose_y = person_kp[0]
                    cv2.putText(frame, label, (int(nose_x), int(nose_y) - 20),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                    if fallen:
                        fallen_detected = True
                        now = datetime.now()
                        timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
                        path = self.save_fall_screenshot(frame, timestamp)
                        self.fall_logs.append({
                            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                            "image": path
                        })

            # 编码图像为JPEG并作为视频流返回
            _, jpeg = cv2.imencode('.jpg', frame)
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    def __del__(self):
        self.cap.release()
        cv2.destroyAllWindows()
