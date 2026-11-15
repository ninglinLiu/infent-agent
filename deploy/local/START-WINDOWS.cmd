@echo off
cd /d "%~dp0"
"%~dp0runtime\win-x64\node.exe" "%~dp0start.cjs"
pause
