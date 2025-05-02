@echo off
echo === Creating Portable Text Editor ===
echo.

echo Step 1: Killing any running instances...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM CollaborativeEditor.exe 2>nul

echo Step 2: Cleaning previous builds...
rmdir /s /q dist dist-electron release 2>nul
del /q .env 2>nul

echo Step 3: Installing dependencies...
call npm install

echo Step 4: Building application...
call npm run build

echo Step 5: Creating portable executable...
call electron-builder --win portable

echo.
echo === Build Complete ===
echo The portable executable can be found in the 'release' folder.
echo Just copy CollaborativeEditor.exe to use it on any Windows PC!
echo.
echo Remember:
echo - Press Ctrl+B to make the window visible
echo - Press Ctrl+Arrow keys to move the window
echo - Press Ctrl+[ and Ctrl+] to adjust opacity
echo - Press Ctrl+Q to quit
echo.
pause 