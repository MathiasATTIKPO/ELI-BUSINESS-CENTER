# Deploiement Vercel

Ce projet se deploie proprement sur Vercel avec 3 projets separes:

1. backend API (`backend`)
2. admin app (`admin`)
3. site client (`client`)

## 1) Deploy backend

- Cree un projet Vercel avec `Root Directory = backend`.
- Framework preset: `Other`.
- Build command: laisser vide.
- Output directory: laisser vide.

### Variables d'environnement backend (obligatoires)

- `MONGO_URI` : URI MongoDB Atlas
- `JWT_SECRET` : secret JWT fort
- `ADMIN_USER` : compte admin initial
- `ADMIN_PASS` : mot de passe admin initial

### Stockage des images recommandé

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Les fichiers image, factures PDF, contrats revendeur et reçus VIP ne doivent pas rester dans `backend/uploads` sur Vercel, car ce répertoire est éphémère.

En production, le backend envoie désormais ces fichiers vers Cloudinary. En local, il garde un fallback sur `backend/uploads` si les variables Cloudinary ne sont pas définies.

### Variables backend recommandees

- `BASE_URL` : URL publique backend (ex: `https://eli-backend.vercel.app`)
- `API_URL` : URL publique backend
- `FRONTEND_URLS` : liste des frontends autorises par CORS, separes par virgules

Exemple:

`FRONTEND_URLS=https://eli-admin.vercel.app,https://eli-client.vercel.app`

## 2) Deploy admin

- Cree un projet Vercel avec `Root Directory = admin`.
- Framework preset: `Vite`.

### Variable admin (obligatoire)

- `VITE_API_BASE_URL` : URL du backend Vercel

Exemple:

`VITE_API_BASE_URL=https://eli-backend.vercel.app`

## 3) Deploy client

- Cree un projet Vercel avec `Root Directory = client`.
- Framework preset: `Vite`.

### Variable client (obligatoire)

- `VITE_API_BASE_URL` : URL du backend Vercel

Exemple:

`VITE_API_BASE_URL=https://eli-backend.vercel.app`

## 4) Verification post-deploiement

1. Backend health: `https://<backend>.vercel.app/api/health`
2. Backend docs: `https://<backend>.vercel.app/api-docs`
3. Admin login charge sans erreur API
4. Client charge les produits sans erreur CORS

## Notes importantes

- Les cron jobs backend ne tournent pas en mode Vercel serverless (normal).
- Le stockage local `backend/uploads` n'est pas persistant sur Vercel. Pour la production, il faut deplacer les fichiers vers un stockage externe (Cloudinary, S3, GCS, etc.).

## MongoDB Atlas: diagnostic rapide

Si l'API ne se connecte pas a Atlas, verifie dans cet ordre:

1. `MONGO_URI` doit utiliser `mongodb+srv://...` ou une URI Atlas valide, pas `mongodb://localhost...`.
2. Dans Atlas, `Network Access` doit autoriser l'environnement qui appelle la base.
	- Pour Vercel, la solution la plus simple est `0.0.0.0/0` pendant les tests.
	- Si tu utilises une restriction IP plus stricte, Vercel peut etre bloque car ses IP sortantes sont dynamiques.
3. Le user MongoDB Atlas doit exister et avoir au moins les droits `readWrite` sur la base cible.
4. Si le mot de passe contient des caracteres speciaux (`@`, `:`, `/`, `#`, `?`), il doit etre encode dans l'URI.
5. Teste ensuite `GET /api/db-status`:
	- `200` = connexion MongoDB OK
	- `503` = backend lance mais pas de connexion Atlas

Exemple d'URI Atlas:

`mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/eli_business_center?retryWrites=true&w=majority&appName=Cluster0`
