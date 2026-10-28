@echo off
rem Opens the study guide in its own app window (no tabs, no address bar).
rem Uses Microsoft Edge, which is already installed on Windows 10 and 11.
start "" msedge --app="file:///%~dp0index.html"
