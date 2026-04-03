@echo off
echo ========================================
echo   亚马逊作品集网站 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查 Node.js 版本...
node --version
echo.

echo [2/3] 安装依赖 (如果需要)...
if not exist "node_modules" (
    echo 正在安装依赖，请稍候...
    npm install
) else (
    echo 依赖已安装
)
echo.

echo [3/3] 启动开发服务器...
echo.
echo 访问 http://localhost:3000
echo 当前管理密码: hybzan5432
echo.
npm run dev

pause
