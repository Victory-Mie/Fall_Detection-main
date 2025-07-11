import cv2
import numpy as np
from ultralytics import YOLO
from datetime import datetime
import os

class FallDetector:
    def __init__(self):
        self.model = YOLO("yolov8n-pose.pt")
        self.cap = cv2.VideoCapture(0)
        self.save_dir = "fall_screenshots"
        os.makedirs(self.save_dir, exist_ok=True)
        self.fall_logs = []

    def is_fallen(self, keypoints):
        try:
            if keypoints.shape[0] < 13:
                return False
            nose_y = keypoints[0][1]
            left_hip_y = keypoints[11][1]
            right_hip_y = keypoints[12][1]
            avg_hip_y = (left_hip_y + right_hip_y) / 2
            return nose_y > avg_hip_y - 20
        except:
            return False

    def get_current_time(self):
        """获取当前时间"""
        return datetime.now()

    def save_fall_screenshot(self, frame, timestamp):
        """保存摔倒截图"""
        path = os.path.join(self.save_dir, f"fall_{timestamp}.jpg")
        cv2.imwrite(path, frame)
        return path

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
                        path = os.path.join(self.save_dir, f"fall_{timestamp}.jpg")
                        cv2.imwrite(path, frame)
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
