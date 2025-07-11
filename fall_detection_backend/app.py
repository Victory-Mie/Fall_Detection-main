from flask import Flask, Response, jsonify
from flask_socketio import SocketIO, emit
from fall_detection import FallDetector
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")
detector = FallDetector()

# 全局变量用于控制检测状态
detection_active = False
fall_detection_thread = None

@app.route('/video_feed')
def video_feed():
    return Response(detector.generate(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/fall_logs')
def get_fall_logs():
    return jsonify(detector.fall_logs)

@app.route('/start_detection')
def start_detection():
    global detection_active, fall_detection_thread
    if not detection_active:
        detection_active = True
        fall_detection_thread = threading.Thread(target=run_fall_detection)
        fall_detection_thread.daemon = True
        fall_detection_thread.start()
        return jsonify({"status": "success", "message": "Detection started"})
    return jsonify({"status": "error", "message": "Detection already running"})

@app.route('/stop_detection')
def stop_detection():
    global detection_active
    detection_active = False
    return jsonify({"status": "success", "message": "Detection stopped"})

def run_fall_detection():
    """在独立线程中运行摔倒检测"""
    global detection_active
    last_fall_time = 0
    fall_cooldown = 3  # 减少到3秒冷却时间，减少遗漏
    consecutive_falls = 0  # 连续摔倒计数
    has_notified = False  # 是否已经发送过通知
    
    while detection_active:
        try:
            ret, frame = detector.cap.read()
            if not ret:
                continue

            results = detector.model(frame)
            fallen_detected = False

            if results and results[0].keypoints is not None:
                kps_batch = results[0].keypoints.xy.cpu().numpy()
                for person_kp in kps_batch:
                    if person_kp.shape[0] < 13:
                        continue
                    fallen = detector.is_fallen(person_kp)
                    if fallen:
                        fallen_detected = True
                        current_time = time.time()
                        consecutive_falls += 1
                        
                        # 只在第一次检测到摔倒时发送通知
                        if not has_notified:
                            last_fall_time = current_time
                            has_notified = True
                            
                            # 保存截图
                            now = detector.get_current_time()
                            timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
                            path = detector.save_fall_screenshot(frame, timestamp)
                            
                            # 记录日志
                            detector.fall_logs.append({
                                "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                                "image": path
                            })
                            
                            # 通过WebSocket通知前端
                            fall_data = {
                                "type": "fall_detected",
                                "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                                "image_path": path,
                                "fall_id": f"fall_{timestamp}",
                                "confidence": min(0.85 + (consecutive_falls * 0.05), 0.95),  # 连续检测提高置信度
                                "consecutive_falls": consecutive_falls
                            }
                            socketio.emit('fall_detection', fall_data)
                            print(f"Fall detected and notified (consecutive: {consecutive_falls}): {fall_data}")
                        else:
                            # 记录持续摔倒但不发送通知
                            print(f"Continuous fall detected (consecutive: {consecutive_falls}), no additional notification")
                else:
                    # 如果没有检测到摔倒，重置连续计数和通知状态
                    if consecutive_falls > 0:
                        print(f"Fall detection stopped, resetting consecutive count from {consecutive_falls}")
                        consecutive_falls = 0
                        has_notified = False  # 重置通知状态，允许下次摔倒时重新通知
            
            time.sleep(0.1)  # 100ms间隔，避免过度占用CPU
            
        except Exception as e:
            print(f"Error in fall detection thread: {e}")
            time.sleep(1)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('status', {'message': 'Connected to fall detection service'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('start_detection')
def handle_start_detection():
    global detection_active, fall_detection_thread
    print('Start detection requested')
    if not detection_active:
        detection_active = True
        fall_detection_thread = threading.Thread(target=run_fall_detection)
        fall_detection_thread.daemon = True
        fall_detection_thread.start()
        emit('status', {'message': 'Detection started successfully'})
        print('Detection started')
    else:
        emit('status', {'message': 'Detection already running'})
        print('Detection already running')

@socketio.on('stop_detection')
def handle_stop_detection():
    global detection_active
    print('Stop detection requested')
    detection_active = False
    emit('status', {'message': 'Detection stopped'})
    print('Detection stopped')

@socketio.on('emergency_alert')
def handle_emergency_alert(data):
    print(f"Emergency alert received: {data}")
    # 这里可以添加紧急联系人通知逻辑
    emit('emergency_confirmed', {'status': 'alert_sent'})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
