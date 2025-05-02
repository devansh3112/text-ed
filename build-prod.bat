@echo off
echo Cleaning up old builds...
rmdir /s /q dist
rmdir /s /q dist-electron
rmdir /s /q release

echo Installing dependencies...
call npm install

echo Building the application...
call npm run build

echo Creating production build...
call electron-builder build --win portable

echo Build complete! Check the release folder for your executable.
pause 