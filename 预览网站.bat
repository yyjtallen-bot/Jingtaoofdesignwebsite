@echo off
chcp 65001 >nul
title 作品集 - 本地预览
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
if not exist node_modules (
  echo 第一次使用，正在安装需要的工具，大约一两分钟……
  call npm install
)
echo.
echo 正在启动本地预览，稍等几秒会自动打开浏览器。
echo  - 预览期间不要关这个黑色窗口；
echo  - 改完文件保存，浏览器会自动刷新；
echo  - 看完了直接关掉这个窗口即可。
echo.
call npm run dev -- --open
pause