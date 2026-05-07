# 🧪 Guide de Test des Routes API

## 📁 Fichiers disponibles

Ce dossier contient plusieurs fichiers pour tester l'API ELI Business Center:

### 1. **API_DOCUMENTATION.md** 📖
Documentation complète et détaillée de tous les endpoints.
- Inclut les descriptions, paramètres, et exemples de réponse
- Format: Markdown
- **Utilisation:** Lisez avec n'importe quel éditeur de texte ou visualiseur Markdown

### 2. **POSTMAN_COLLECTION.json** 📮
Collection Postman prête à l'emploi avec tous les endpoints organisés par catégorie.
- Inclut les configurations de requête préalablement définies
- Format: JSON (format Postman v2.1)
- **Utilisation:** 
  1. Ouvrez Postman
  2. Cliquez sur "Import"
  3. Sélectionnez `POSTMAN_COLLECTION.json`
  4. Vous pouvez maintenant tester tous les endpoints directement

### 3. **POSTMAN_ENVIRONMENT.json** 🔧
Fichier d'environnement Postman avec les variables d'environnement.
- Contient: BASE_URL, TOKEN, credentials
- Format: JSON (format Postman v2.1)
- **Utilisation:**
  1. Ouvrez Postman
  2. Cliquez sur "Import"
  3. Sélectionnez `POSTMAN_ENVIRONMENT.json`
  4. Sélectionnez cet environnement dans le dropdown "Environments"

### 4. **CURL_EXAMPLES.sh** 🐚
Script Bash avec 35+ exemples de commandes cURL pour tester les routes.
- Format: Bash script
- **Utilisation:**
  1. Sur Linux/Mac: `bash CURL_EXAMPLES.sh`
  2. Sur Windows PowerShell: Copiez-collez les commandes individuellement
  3. Ou copiez-collez les commandes une par une dans votre terminal

---

## 🚀 Démarrage rapide

### Option 1: Utiliser Postman (Recommandé) ⭐
C'est la méthode la plus facile et la plus visuelle.

1. **Téléchargez Postman** si vous ne l'avez pas: https://www.postman.com/downloads/

2. **Importez la collection et l'environnement:**
   - Cliquez sur "Import" → Sélectionnez `POSTMAN_COLLECTION.json`
   - Cliquez sur "Import" → Sélectionnez `POSTMAN_ENVIRONMENT.json`

3. **Configurez l'environnement:**
   - Sélectionnez "ELI Business Center - Local Dev" dans le dropdown Environments
   - Modifiez les variables si nécessaire (BASE_URL, credentials)

4. **Testez un endpoint:**
   - Allez dans Authentication → Admin Login
   - Cliquez sur "Send"
   - Copiez le token reçu
   - Collez-le dans la variable `TOKEN` de l'environnement

5. **Explorez les routes:**
   - Cliquez sur n'importe quel endpoint dans la collection
   - Modifiez les paramètres si nécessaire
   - Cliquez sur "Send"

---

### Option 2: Utiliser cURL en terminal 💻

#### Sur Windows PowerShell:
```powershell
# Health Check
curl -X GET "http://localhost:4001/api/health"

# Admin Login
curl -X POST "http://localhost:4001/api/admin/login" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@elis.com",
    "password": "admin123"
  }'
```

#### Sur Linux/Mac/Git Bash:
```bash
# Health Check
curl -X GET "http://localhost:4001/api/health"

# Admin Login
curl -X POST "http://localhost:4001/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elis.com",
    "password": "admin123"
  }'
```

---

### Option 3: Lire la documentation Markdown 📖

1. Ouvrez `API_DOCUMENTATION.md` avec votre éditeur préféré
2. Lisez la structure et les exemples
3. Testez les routes avec votre outil préféré (Postman, cURL, Insomnia, etc.)

---

## 🎯 Endpoints rapides pour débuter

### 1️⃣ Vérifier que l'API fonctionne
```bash
GET http://localhost:4001/api/health
```

### 2️⃣ Se connecter (Admin)
```bash
POST http://localhost:4001/api/admin/login
Body: { "email": "admin@elis.com", "password": "admin123" }
```

### 3️⃣ Obtenir tous les produits
```bash
GET http://localhost:4001/api/products
```

### 4️⃣ Créer une demande de réparation
```bash
POST http://localhost:4001/api/repair
Body (form-data):
  - name: "John Doe"
  - phone: "+22800000001"
  - email: "john@example.com"
  - description: "Screen is broken"
  - photos: [fichier1, fichier2]
```

### 5️⃣ Créer un produit (Admin - Nécessite token)
```bash
POST http://localhost:4001/api/admin/products
Headers: Authorization: Bearer YOUR_TOKEN
Body (form-data):
  - name: "iPhone 15"
  - price: "1299"
  - description: "Latest model"
  - stock: "50"
  - photo: [fichier]
```

---

## 📊 Organisation des routes

### Publics (Sans authentification)
- `GET /api/health` - Vérifier l'API
- `GET /api/products` - Lister les produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/repair` - Créer une réparation
- `GET /api/repair/:id` - Détails d'une réparation
- `POST /api/tradein` - Créer un échange
- `GET /api/tradein/:id` - Détails d'un échange
- `POST /api/upload` - Télécharger des fichiers
- `POST /api/invoice/generate` - Générer une facture
- `POST /api/invoice/send-whatsapp` - Envoyer via WhatsApp

### Protégés Admin (`/api/admin/*`)
- Gestion des produits (CRUD)
- Gestion des réparations
- Gestion des échanges
- Gestion de l'inventaire
- Gestion des employés
- Pointage (clock in/out)

### Protégés Technician (`/api/technician/*`)
- Voir mes réparations
- Mettre à jour le statut d'une réparation
- Voir l'historique

---

## 🔑 Identifiants par défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@elis.com | admin123 |
| Technician | tech@elis.com | tech123 |

---

## 💡 Conseils de test

### 1. Sauvegardez les IDs
Après chaque création, copiez l'ID pour le réutiliser dans les tests suivants.

### 2. Utilisez les variables Postman
Les variables facilitent le passage d'une requête à l'autre:
```
{{BASE_URL}}/api/products/{{PRODUCT_ID}}
```

### 3. Testez l'ordre logique
1. Vérifiez l'API (health check)
2. Connectez-vous (login)
3. Créez des ressources (create)
4. Listez les ressources (read)
5. Modifiez les ressources (update)
6. Supprimez les ressources (delete)

### 4. Validez les réponses
Vérifiez toujours:
- Le code de statut HTTP (200, 201, 400, 401, etc.)
- Le champ `success`
- Le champ `message`
- Les données retournées

### 5. Pour les uploads de fichiers
- Utilisez Postman (plus facile avec form-data)
- Ou utilisez cURL avec `-F` et `@path/to/file`

---

## 🐛 Troubleshooting

### "Connection refused"
- Vérifiez que le serveur est en cours d'exécution: `npm run dev`
- Vérifiez le port: 4001

### "Authorization error"
- Vérifiez que le token est correct
- Vérifiez que le token n'a pas expiré
- Reconnectez-vous pour obtenir un nouveau token

### "Not found" (404)
- Vérifiez l'URL et l'ID
- Vérifiez que la ressource existe

### "Invalid request" (400)
- Vérifiez les paramètres
- Vérifiez le format JSON
- Vérifiez les champs requis

---

## 📚 Ressources supplémentaires

- **Swagger UI:** http://localhost:4001/api-docs
- **MongoDB:** Assurez-vous que MongoDB est en cours d'exécution
- **Variables d'environnement:** Configurez `.env`

---

## 🎓 Flux de travail complet

1. **Health Check**: Vérifiez que l'API répond
2. **Login**: Obtenez un token
3. **Products**: Testez les endpoints produits
4. **Repair**: Créez une demande de réparation
5. **Admin**: Gérez la réparation en tant qu'admin
6. **Technician**: Mettez à jour la réparation en tant que technicien

---

## 📞 Support

Si vous avez des questions sur les routes, consultez:
1. La documentation Markdown (API_DOCUMENTATION.md)
2. Les exemples Postman
3. Les exemples cURL
4. La documentation Swagger: http://localhost:4001/api-docs

---

**Dernière mise à jour:** 28 avril 2026

Bon test! 🚀
