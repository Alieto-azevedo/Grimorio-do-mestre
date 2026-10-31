@echo off
chcp 65001 >nul
title Grimório do Mestre
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale a versao LTS em https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules\electron call npm install
call npm start
