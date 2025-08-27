@echo off
cd /d "%~dp0"
echo ✅ .bat started
echo 🔍 Working directory: %cd%
echo 📄 Arg1 (input): %~1
echo 📄 Arg2 (output): %~2

"C:\Users\omgzh\AppData\Local\Programs\Python\Python313\python.exe" "..\llm_scripts\generate_action_plan.py" "%~1" "%~2"

echo ✅ Python finished
pause
