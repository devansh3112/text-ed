@echo off
echo === Creating Portable Stealth Editor ===
echo.

echo Step 1: Killing any running instances...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM CollaborativeEditor.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo Step 2: Cleaning previous builds...
rmdir /s /q dist dist-electron release portable 2>nul
del /q .env 2>nul

echo Step 3: Installing dependencies...
call npm install

echo Step 4: Building application...
call npm run build

echo Step 5: Creating portable directory...
mkdir portable
mkdir portable\app
mkdir portable\server

echo Step 6: Copying application files...
xcopy /s /e /y dist portable\app\dist\
xcopy /s /e /y electron\*.js portable\app\electron\
copy package.json portable\app\
copy server.cjs portable\server\
xcopy /s /e /y node_modules portable\server\node_modules\

echo Step 7: Copying Electron files...
xcopy /s /e /y node_modules\electron\dist\*.* portable\app\
ren "portable\app\electron.exe" "CollaborativeEditor.exe"

echo Step 8: Creating launcher script...
(
echo @echo off
echo cd /d "%%~dp0"
echo echo Starting Stealth Editor...
echo echo.
echo echo Use these shortcuts:
echo echo - Ctrl+B: Toggle visibility
echo echo - Ctrl+Arrow keys: Move window
echo echo - Ctrl+[ and Ctrl+]: Adjust opacity
echo echo - Ctrl+Q: Quit
echo echo.
echo start /b app\CollaborativeEditor.exe --no-sandbox
) > portable\Run_Stealth_Editor.bat

echo.
echo === Package Complete ===
echo The portable app is in the 'portable' folder.
echo Just copy the entire 'portable' folder anywhere and run 'Run_Stealth_Editor.bat'
echo.
echo Remember:
echo - Press Ctrl+B to make the window visible
echo - Press Ctrl+Arrow keys to move the window
echo - Press Ctrl+[ and Ctrl+] to adjust opacity
echo - Press Ctrl+Q to quit
echo.
pause 