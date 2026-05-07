#!/bin/bash
# Pour Linux/Mac - Démarrage automatisé de tous les services

echo "🚀 ELI Business Center - Démarrage automatisé"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour ouvrir un terminal et lancer une commande
run_in_terminal() {
  local title=$1
  local cmd=$2
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && $cmd\""
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    gnome-terminal -- bash -c "cd $(pwd) && $cmd; exec bash"
  fi
}

echo -e "${YELLOW}📋 Instructions pour Windows PowerShell:${NC}"
echo ""
echo "Ouvrez 4 terminaux PowerShell et exécutez dans chacun :"
echo ""
echo -e "${GREEN}Terminal 1 - Backend:${NC}"
echo "  cd backend && npm run dev"
echo ""
echo -e "${GREEN}Terminal 2 - Tunnel Local (optionnel):${NC}"
echo "  cd backend && npm run tunnel"
echo ""
echo -e "${GREEN}Terminal 3 - Admin Interface:${NC}"
echo "  cd admin && npm run dev"
echo ""
echo -e "${GREEN}Terminal 4 - Client Website:${NC}"
echo "  cd client && npm run dev"
echo ""
echo -e "${YELLOW}🎯 Configuration:${NC}"
echo ""
echo "Dans admin/.env et client/.env, mettez :"
echo "  VITE_API_BASE_URL=http://localhost:8080"
echo ""
echo "Puis accédez à :"
echo "  Admin: http://localhost:5174/admin/login"
echo "  Client: http://localhost:5173"
echo "  Tunnel health: http://localhost:8080/api/health"
echo ""
