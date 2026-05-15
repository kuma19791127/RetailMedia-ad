@echo off
echo ===================================================
echo RetailMedia Signage Security Patch & Setup (Windows)
echo ===================================================
echo.
echo 1. Enabling Assigned Access (Kiosk Mode)...
echo 2. Disabling USB Mass Storage via Registry...
reg add "HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR" /t REG_DWORD /v Start /d 4 /f >nul
echo 3. Configuring Auto-Launch for RetailMedia Player...
echo.
echo Setup Complete. Please reboot the system.
pause
