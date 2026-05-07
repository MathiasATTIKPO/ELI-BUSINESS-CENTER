@echo off
REM Script de démarrage pour ELI Business Center sur Windows

echo.
echo ====================================================================
echo   ELI BUSINESS CENTER - Script de Demarrage
echo ====================================================================
echo.

echo [IMPORTANT] Ce script affiche les instructions.
echo Vous devez ouvrir 4 terminaux PowerShell MANUELLEMENT et executer:
echo.

echo.
echo ======== TERMINAL 1 - BACKEND API ========
echo Commande:
echo   cd backend ^&^& npm run dev
echo.
echo Resultat attendu:
echo   Server running on port 4001
echo.
pause

echo.
echo ======== TERMINAL 2 - TUNNEL LOCAL (Optionnel) ========
echo Commande:
echo   cd backend ^&^& npm run tunnel
echo.
echo Resultat attendu:
echo   ✅ Tunnel Server running!
echo   🔗 Tunnel URL: http://localhost:8080
echo.
pause

echo.
echo ======== TERMINAL 3 - ADMIN INTERFACE ========
echo Commande:
echo   cd admin ^&^& npm run dev
echo.
echo Resultat attendu:
echo   VITE v5.x.x  built in Xs
echo   Local:   http://localhost:5174/admin/login
echo.
pause

echo.
echo ======== TERMINAL 4 - CLIENT WEBSITE ========
echo Commande:
echo   cd client ^&^& npm run dev
echo.
echo Resultat attendu:
echo   VITE v5.x.x  built in Xs
echo   Local:   http://localhost:5173
echo.
pause

echo.
echo ====================================================================
echo CONFIGURATION DES URLS
echo ====================================================================
echo.

echo Dans admin/.env et client/.env, mettez:
echo   VITE_API_BASE_URL=http://localhost:8080
echo.
echo OU pour tester sans tunnel:
echo   VITE_API_BASE_URL=http://localhost:4001
echo.

echo ====================================================================
echo ACCES AUX INTERFACES
echo ====================================================================
echo.

echo Admin:         http://localhost:5174/admin/login
echo  - Email:     admin@elibusiness.com
echo  - Password:  password123
echo.

echo Client:        http://localhost:5173
echo.

echo API Docs:      http://localhost:4001/api-docs
echo.

echo Tunnel Health: http://localhost:8080/api/health
echo.

echo ====================================================================
echo COMMANDES UTILES
echo ====================================================================
echo.

echo Kill port 4001:
echo   npx kill-port 4001
echo.

echo Kill port 8080:
echo   npx kill-port 8080
echo.

echo Install all dependencies:
echo   npm run install:all
echo.

echo ====================================================================
echo DOCUMENTATION
echo ====================================================================
echo.

echo - QUICK_START.md        : Demarrage rapide
echo - TUNNELING_GUIDE.md    : Guide complet du tunneling
echo - README.md             : Vue d'ensemble du projet
echo - backend/README.md     : Documentation backend
echo.

pause
