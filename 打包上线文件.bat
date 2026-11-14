@echo off
chcp 65001 >nul
title 作品集 - 打包上线文件
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
if not exist node_modules (
  echo 第一次使用，正在安装需要的工具，大约一两分钟……
  call npm install
)
echo.
echo 正在打包网站，大约半分钟……
echo.
call npm run build
if errorlevel 1 goto failed
echo.
echo 打包完成！马上打开 dist 文件夹：把整个 dist 文件夹上传到网站托管即可。
start "" "%~dp0dist"
pause
exit /b 0

:failed
echo.
echo 打包没有成功。请把这个窗口里的红字截图发给 Claude，让它帮你看。
pause
exit /b 1