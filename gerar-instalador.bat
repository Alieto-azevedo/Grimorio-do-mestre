@echo off
chcp 65001 >nul
title Grimório do Mestre - gerar instalador
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js nao foi encontrado.
  echo  Instale a versao LTS em https://nodejs.org e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

echo.
echo  [1/2] Baixando o Electron e as ferramentas (so demora na primeira vez)...
call npm install
if errorlevel 1 goto erro

echo.
echo  [2/2] Gerando o instalador...
call npm run dist
if errorlevel 1 goto erro

echo.
echo  Pronto! O instalador esta na pasta "dist".
start "" "%~dp0dist"
pause
exit /b 0

:erro
echo.
echo  Algo deu errado. Copie as mensagens acima e me mande.
pause
exit /b 1
