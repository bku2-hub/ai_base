@echo off
cd /d "%~dp0"
echo.
echo ==============================================
echo 백엔드 서버를 시작합니다!
echo 브라우저를 열고 http://localhost:8000 주소로 접속해 주세요.
echo ==============================================
C:\Users\PC\AppData\Local\Python\pythoncore-3.14-64\python.exe -m uvicorn main:app --reload
pause
