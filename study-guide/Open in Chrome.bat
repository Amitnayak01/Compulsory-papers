@echo off
rem Opens the study guide in Google Chrome.
rem If Chrome is not found, it opens in your default browser instead.
set "PAGE=%~dp0index.html"
set "URL=file:///%PAGE:\=/%"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run
set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run
set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run

start "" "%PAGE%"
goto end

:run
start "" "%CHROME%" "%URL%"

:end
