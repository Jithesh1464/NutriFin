@echo off
echo.
echo ========================================
echo  Gains Ledger - Backend Server
echo ========================================
echo.
echo Checking Node.js installation...
node --version
echo.
echo Installing dependencies...
npm install
echo.
echo Starting MongoDB and server...
echo Make sure MongoDB is running on localhost:27017
echo.
npm start
echo.
Pause