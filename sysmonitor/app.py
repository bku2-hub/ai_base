import time
import psutil
import os
import sys
from flask import Flask, render_template
from flask_socketio import SocketIO

# PyInstaller 환경에서 템플릿과 정적 파일 경로를 찾기 위한 설정
if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

@app.route('/')
def index():
    return render_template('index.html')

def background_thread():
    """백그라운드에서 주기적으로 시스템 정보를 클라이언트에 전송합니다."""
    while True:
        # CPU
        cpu_percent = psutil.cpu_percent(interval=None)
        
        # CPU Temperature (Windows native limitation: returning N/A or default value)
        cpu_temp = "지원안함"
        
        # Memory
        mem = psutil.virtual_memory()
        mem_total_gb = mem.total / (1024 ** 3)
        mem_used_gb = mem.used / (1024 ** 3)
        mem_percent = mem.percent
        
        # Disk (Root)
        try:
            disk = psutil.disk_usage('C:\\')
            disk_percent = disk.percent
        except:
            disk_percent = 0

        # 배터리 정보 (랩탑의 경우)
        battery = psutil.sensors_battery()
        battery_percent = battery.percent if battery else None

        data = {
            'cpu': cpu_percent,
            'cpu_temp': cpu_temp,
            'memory_used_gb': round(mem_used_gb, 2),
            'memory_total_gb': round(mem_total_gb, 2),
            'memory_percent': mem_percent,
            'disk_percent': disk_percent,
            'battery_percent': battery_percent
        }
        socketio.emit('system_update', data)
        socketio.sleep(1)

@socketio.on('connect')
def connect():
    print('Client connected')

if __name__ == '__main__':
    # 백그라운드 태스크 시작
    socketio.start_background_task(target=background_thread)
    print("서버가 시작되었습니다. http://localhost:3000 에 접속하세요.")
    socketio.run(app, host='0.0.0.0', port=3000, allow_unsafe_werkzeug=True)
