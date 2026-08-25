@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 22 LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo Enabling pnpm...
  call corepack enable
  call corepack prepare pnpm@latest --activate
)

if not exist "node_modules\" (
  echo Installing Wooly. This can take a few minutes.
  call pnpm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo Starting Wooly Launcher...
call pnpm dev
if errorlevel 1 pause
