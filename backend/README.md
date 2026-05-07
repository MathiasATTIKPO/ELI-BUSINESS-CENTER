# ELI Business Center Backend

API backend Node.js pour le site vitrine et une future application mobile.

## Installation

1. Copier le fichier d'exemple :

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Installer les dépendances :

   ```bash
   npm install
   ```

3. Configurer MongoDB dans `.env` :

   ```env
   MONGO_URI=mongodb://localhost:27017/eli_business_center
   PORT=4001
   JWT_SECRET=votre_secret_jwt
   ADMIN_USER=admin@elibusiness.com
   ADMIN_PASS=password123
   ```

4. Démarrer le serveur :

   ```bash
   npm run dev
   ```

## 🌐 Déploiement en ligne

### Utilisation du Tunnel Local (recommandé pour développement)

Un script de tunneling Node.js natif qui ne dépend d'aucun outil externe.

```bash
# Depuis le dossier backend
npm run tunnel
```

**Résultat attendu :**
```
✅ Tunnel Server running!
📍 Local API: http://localhost:4001
🔗 Tunnel URL: http://localhost:8080
```

Utilisez l'URL du tunnel dans vos fichiers `.env` pour les tests locaux.

### Configuration pour développement local

1. **Lancez le tunnel** :
   ```bash
   npm run tunnel
   ```

2. **Mettez à jour `.env` (racine du projet)** :
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

3. **Lancez les frontends** : les frontends utilisent maintenant le tunnel local

### Utilisation de Ngrok (pour production sur Internet)

Pour exposer votre API publiquement :

1. **Installez Ngrok** : [ngrok.com/download](https://ngrok.com/download)

2. **Lancez Ngrok** :
   ```bash
   npm run tunnel:ngrok
   ```

3. **Copiez l'URL générée** (ex: `https://xxxxx.ngrok-free.app`)

4. **Mettez à jour `.env`** avec l'URL Ngrok

### Alternatives

Si Ngrok ne fonctionne pas :

- **LocalTunnel** : `npx localtunnel --port 4001` (Linux/Mac seulement)
- **Cloudflare Tunnel** : Téléchargez `cloudflared` puis `cloudflared tunnel --url http://localhost:4001`
- **Serveo** : `ssh -R 80:localhost:4001 serveo.net`

Pour ces alternatives, ajoutez l'URL générée dans le `.env`.

## Structure du projet

- `server.js` : point d'entrée Express
- `routes/` : routes API
- `controllers/` : logique métier
- `models/` : modèles Mongoose
- `middleware/` : authentification JWT et upload de fichiers
- `uploads/` : fichiers photo et PDF générés

## Endpoints principaux

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/repair`
- `GET /api/repair/:id`
- `POST /api/tradein`
- `GET /api/tradein/:id`
- `POST /api/upload`
- `POST /api/admin/login`

> Les endpoints administrateur `admin/*` et `invoice/*` sont préparés pour l'application mobile future.

## Scripts disponibles

```bash
npm run dev      # Serveur avec nodemon (développement)
npm run start    # Serveur production
npm run tunnel   # Exposition via LocalTunnel
```
