@echo off
echo ============================================
echo   FridgeChef Step 3 - Complete System
echo ============================================
echo.
echo Starting Step 3 application...
echo Please wait for the browser to open...
echo.
echo URL: http://localhost:8503
echo.
echo Demo Account:
echo   Email: demo@fridgechef.com
echo   Password: demo123
echo.
echo Press Ctrl+C to stop the application
echo ============================================
echo.

py -m streamlit run app_step3.py --server.port 8503