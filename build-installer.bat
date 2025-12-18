@echo off
setlocal enabledelayedexpansion
echo ========================================
echo Building Activity Tracker Desktop App
echo ========================================
echo.

:: Clean previous builds
echo [1/6] Cleaning previous build artifacts...
if exist "release\*.blockmap" del /f /q "release\*.blockmap" 2>nul
if exist "release\*.yml" del /f /q "release\*.yml" 2>nul
if exist "release\*.yaml" del /f /q "release\*.yaml" 2>nul
if exist "release\*.7z" del /f /q "release\*.7z" 2>nul
if exist "release\win-unpacked" rd /s /q "release\win-unpacked" 2>nul
echo Done.
echo.

:: Compile TypeScript
echo [2/6] Compiling TypeScript...
call npx tsc
if errorlevel 1 (
    echo TypeScript compilation failed!
    pause
    exit /b 1
)
echo Done.
echo.

:: Build with Vite
echo [3/6] Building with Vite...
call npx vite build
if errorlevel 1 (
    echo Vite build failed!
    pause
    exit /b 1
)
echo Done.
echo.

:: Build NSIS Installer
echo [4/6] Creating NSIS installer...
call npx electron-builder --win nsis --x64
if errorlevel 1 (
    echo NSIS installer build failed!
    pause
    exit /b 1
)
echo Done.
echo.

:: Build ZIP package
echo [5/6] Creating ZIP package...
call npx electron-builder --win zip --x64
if errorlevel 1 (
    echo ZIP package build failed!
    pause
    exit /b 1
)
echo Done.
echo.

:: Clean up artifacts
echo [6/6] Cleaning up build artifacts...
if exist "release\*.blockmap" del /f /q "release\*.blockmap" 2>nul
if exist "release\*.yml" del /f /q "release\*.yml" 2>nul
if exist "release\*.yaml" del /f /q "release\*.yaml" 2>nul
if exist "release\*.7z" del /f /q "release\*.7z" 2>nul
if exist "release\win-unpacked" rd /s /q "release\win-unpacked" 2>nul
echo Done.
echo.

:: Display results
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Generated files in 'release' folder:
echo.
for %%f in (release\*.exe release\*.zip) do (
    if exist "%%f" echo   [OK] %%~nxf
)
echo.
pause
