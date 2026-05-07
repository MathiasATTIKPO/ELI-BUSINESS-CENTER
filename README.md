# ELI Business Center

Plateforme complète de gestion pour centre d'affaires - site vitrine, administration, et API backend.

## 🏗️ Architecture

- **Client** (`/client`) : Site vitrine React/Vite pour les clients
- **Admin** (`/admin`) : Interface d'administration React/Vite
- **Backend** (`/backend`) : API Node.js/Express avec MongoDB

## 🚀 Démarrage rapide

### 1. Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

### 2. Installation

```bash
# Cloner le repo
git clone <repository-url>
cd eli-business-center

# Installer les dépendances pour tous les modules
npm run install:all
```

### 3. Configuration

#### Backend
```bash
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres MongoDB
```

#### Variables d'environnement principales
```env
# Backend
MONGO_URI=mongodb://localhost:27017/eli_business_center
JWT_SECRET=votre_secret_jwt
ADMIN_USER=admin@elibusiness.com
ADMIN_PASS=password123

# Frontend (optionnel pour déploiement)
VITE_API_BASE_URL=http://localhost:4001
```

### 4. Démarrage en développement

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Admin
cd admin
npm run dev

# Terminal 3: Client
cd client
npm run dev
```

## 🌐 Déploiement en ligne

### Tunnel Local (recommandé pour développement)

Le tunnel local permet de tester facilement les requêtes entre le frontend et le backend sur votre machine.

```bash
# Dans le dossier backend
cd backend
npm run tunnel
```

Utilisez `http://localhost:8080` comme URL API lors du développement.

### Ngrok (pour production sur Internet)

Ngrok permet d'exposer votre serveur local sur Internet via une URL HTTPS.

```bash
# Dans le dossier backend
cd backend
npm run tunnel:ngrok
```

Copiez l'URL générée et mettez-la à jour dans `.env`.

### Configuration pour le déploiement

1. **Après avoir lancé le tunnel**, copiez l'URL générée

2. **Mettez à jour les variables d'environnement** :

   ```bash
   # Dans .env (racine du projet)
   VITE_API_BASE_URL=https://xxxxx.ngrok-free.app
   # ou pour tunnel local:
   VITE_API_BASE_URL=http://localhost:8080

   # Dans backend/.env
   NGROK_URL=https://xxxxx.ngrok-free.app
   ```

3. **Redémarrez les applications frontend** pour qu'elles utilisent la nouvelle URL API

### Alternatives à Ngrok

- **LocalTunnel** : `npx localtunnel --port 4001` (Linux/Mac seulement)
- **Cloudflare Tunnel** : `cloudflared tunnel --url http://localhost:4001`
- **Serveo** : `ssh -R 80:localhost:4001 serveo.net`

## 📱 Accès aux interfaces

- **Site client** : http://localhost:5173 (ou URL tunnel)
- **Administration** : http://localhost:5174/admin/login (ou URL tunnel + /admin/login)
- **API Documentation** : http://localhost:4001/api-docs (ou URL tunnel + /api-docs)

### Comptes de test

- **Admin** : admin@elibusiness.com / password123
- **Technicien** : tech@elis.com / tech123

## 🛠️ Scripts disponibles

```bash
# Installation globale
npm run install:all    # Installe toutes les dépendances

# Développement
npm run dev           # Démarre tous les services en mode dev
npm run build         # Build tous les frontends

# Backend uniquement
cd backend
npm run dev           # Serveur avec nodemon
npm run tunnel        # Exposition via localtunnel

# Frontend
cd admin && npm run dev
cd client && npm run dev
```

## 📁 Structure du projet

```
eli-business-center/
├── client/           # Site vitrine React
├── admin/            # Interface admin React
├── backend/          # API Node.js/Express
│   ├── controllers/  # Logique métier
│   ├── models/       # Modèles MongoDB
│   ├── routes/       # Routes API
│   ├── middleware/   # Auth, upload, etc.
│   └── uploads/      # Fichiers uploadés
└── techno/           # (Réservé)
```

## 🔧 Technologies utilisées

- **Backend** : Node.js, Express, MongoDB, JWT, Multer
- **Frontend** : React, Vite, Tailwind CSS
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT avec rôles (admin, technicien, caissier)
- **Déploiement** : LocalTunnel pour exposition HTTPS

## 📚 API Endpoints

### Produits
- `GET /api/products` - Liste des produits
- `POST /api/products` - Créer un produit (admin)

### Réparations
- `POST /api/repair` - Demande de réparation
- `GET /api/repair/:id` - Suivi de réparation

### Échange
- `POST /api/tradein` - Demande d'échange
- `GET /api/tradein/:id` - Suivi d'échange

### Administration
- `POST /api/admin/login` - Connexion admin
- `GET /api/admin/products` - Gestion produits
- `GET /api/admin/repairs` - Gestion réparations

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.