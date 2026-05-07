# 🚀 Quick Start Guide

Démarrer rapidement l'application ELI Business Center.

## Terminal 1: Backend API

```bash
cd backend
npm run dev
```

✅ L'API démarre sur `http://localhost:4001`
📚 Docs disponibles sur `http://localhost:4001/api-docs`

## Terminal 2: Tunnel Local (optionnel)

Pour tester les requêtes frontend → backend sur votre machine :

```bash
cd backend
npm run tunnel
```

✅ Tunnel disponible sur `http://localhost:8080`

Mettez à jour `.env` (racine du projet) :
```env
VITE_API_BASE_URL=http://localhost:8080
```

## Terminal 3: Admin Interface

```bash
cd admin
npm run dev
```

✅ Admin démarrage sur `http://localhost:5174`
🔗 Login: `admin@elibusiness.com` / `password123`

## Terminal 4: Client Website

```bash
cd client
npm run dev
```

✅ Client démarrage sur `http://localhost:5173`

## 📚 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@elibusiness.com | password123 |
| Technicien | tech@elis.com | tech123 |

## 🌐 Déploiement en ligne

### Tunnel Local (développement)
```bash
cd backend
npm run tunnel
# Utilisez http://localhost:8080 comme API_BASE_URL
```

### Ngrok (production)
```bash
cd backend
npm run tunnel:ngrok
# Copier l'URL générée et l'utiliser dans .env
```

## 🔧 Scripts utiles

```bash
# Installer toutes les dépendances
npm run install:all

# Builder les frontends
npm run build

# Tuer le port 4001
npx kill-port 4001
```

## 📱 Accès rapide

- **API Health** : `curl http://localhost:4001/api/health`
- **Admin** : http://localhost:5174/admin/login
- **Client** : http://localhost:5173
- **Docs API** : http://localhost:4001/api-docs
