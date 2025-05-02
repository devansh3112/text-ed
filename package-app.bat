@echo off
echo === Creating Stealth Text Editor ===
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

echo Step 5: Creating minimal release...
mkdir release 2>nul
mkdir release\resources 2>nul

echo Step 6: Copying only essential files...
xcopy /s /e /y dist release\resources\app\dist\
xcopy /s /e /y electron\*.js release\resources\app\electron\
copy package.json release\resources\app\
copy node_modules\electron\dist\electron.exe release\CollaborativeEditor.exe
copy node_modules\electron\dist\ffmpeg.dll release\
copy node_modules\electron\dist\resources.pak release\resources\
copy node_modules\electron\dist\icudtl.dat release\
copy node_modules\electron\dist\v8_context_snapshot.bin release\
mkdir release\resources\app\node_modules

echo Step 7: Creating startup script...
(
echo @echo off
echo cd /d "%%~dp0"
echo start /b CollaborativeEditor.exe --no-sandbox
) > release\start.bat

echo.
echo === Package Complete ===
echo The stealth app is in the 'release' folder.
echo Just copy the entire 'release' folder to use it on any Windows PC!
echo Run 'start.bat' to launch the invisible app.
echo.
echo Remember:
echo - Press Ctrl+B to make the window visible
echo - Press Ctrl+Arrow keys to move the window
echo - Press Ctrl+[ and Ctrl+] to adjust opacity
echo - Press Ctrl+Q to quit
echo.
pause 