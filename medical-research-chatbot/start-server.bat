@echo off
echo ========================================
echo Medical Research Chatbot Server
echo ========================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo.

echo Checking if dependencies are installed...
if not exist "node_modules\express\package.json" (
    echo Dependencies not found. Installing...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed.
)
echo.

echo ========================================
echo Starting server...
echo ========================================
echo Server will be available at:
echo   - Epic Mockup: http://localhost:3000/epic-mockup.html
echo   - Standalone UI: http://localhost:3000/index.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js
if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    echo Check the error messages above
    pause
)

