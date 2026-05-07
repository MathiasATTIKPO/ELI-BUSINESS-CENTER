# 📚 Documentation API - ELI Business Center

## 🚀 Introduction

Cette documentation présente tous les endpoints de l'API ELI Business Center. L'API est construite avec Express.js et MongoDB.

**URL de base (local):** `http://localhost:4001`  
**URL de base (production):** À configurer

---

## 🔐 Authentification

### Admin Login
Obtenir un token JWT pour l'administrateur.

- **Endpoint:** `POST /api/admin/login`
- **Authentification:** Aucune
- **Body:**
```json
{
  "email": "admin@elis.com",
  "password": "admin123"
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "admin@elis.com",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

### Technician Login
Obtenir un token JWT pour un technicien.

- **Endpoint:** `POST /api/technician/login`
- **Authentification:** Aucune
- **Body:**
```json
{
  "email": "tech@elis.com",
  "password": "tech123"
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "technician": {
      "id": "technician_id",
      "email": "tech@elis.com",
      "name": "Technicien Par Défaut"
    }
  },
  "message": "Login successful"
}
```

---

## 📋 Health Check

### API Health Status
Vérifier que l'API est opérationnelle.

- **Endpoint:** `GET /api/health`
- **Authentification:** Aucune
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": null,
  "message": "API is running"
}
```

---

## 🛍️ Products (Produits)

### Lister tous les produits
Récupérer la liste de tous les produits disponibles.

- **Endpoint:** `GET /api/products`
- **Authentification:** Aucune
- **Query Parameters:** Aucun
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "iPhone 15",
      "price": 1299,
      "description": "Latest iPhone model",
      "stock": 50,
      "photo": "url_to_photo",
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "message": "Products fetched successfully"
}
```

### Obtenir un produit par ID
Récupérer les détails d'un produit spécifique.

- **Endpoint:** `GET /api/products/:id`
- **Authentification:** Aucune
- **URL Parameters:** `id` (string) - ID du produit
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "iPhone 15",
    "price": 1299,
    "description": "Latest iPhone model",
    "stock": 50,
    "photo": "url_to_photo",
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Product fetched successfully"
}
```

### Créer un produit (Admin)
Ajouter un nouveau produit (réservé à l'admin).

- **Endpoint:** `POST /api/admin/products`
- **Authentification:** JWT Token (Bearer)
- **Headers:** 
```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```
- **Body (form-data):**
```
name: iPhone 15
price: 1299
description: Latest iPhone model
stock: 50
photo: [fichier]
```
- **Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "_id": "new_product_id",
    "name": "iPhone 15",
    "price": 1299,
    "description": "Latest iPhone model",
    "stock": 50,
    "photo": "url_to_photo",
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Product created successfully"
}
```

### Mettre à jour un produit (Admin)
Modifier les informations d'un produit.

- **Endpoint:** `PUT /api/admin/products/:id`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID du produit
- **Body:**
```json
{
  "name": "iPhone 15 Pro",
  "price": 1399,
  "stock": 45
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "iPhone 15 Pro",
    "price": 1399,
    "stock": 45
  },
  "message": "Product updated successfully"
}
```

### Supprimer un produit (Admin)
Supprimer un produit de la base de données.

- **Endpoint:** `DELETE /api/admin/products/:id`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **URL Parameters:** `id` (string) - ID du produit
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Product deleted successfully"
}
```

---

## 🔧 Repairs (Réparations)

### Créer une demande de réparation
Soumettre une nouvelle demande de réparation.

- **Endpoint:** `POST /api/repair`
- **Authentification:** Aucune
- **Headers:**
```
Content-Type: multipart/form-data
```
- **Body (form-data):**
```
name: John Doe
phone: +22800000001
email: john@example.com
description: Screen is broken
photos: [fichiers - max 5]
```
- **Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "name": "John Doe",
    "phone": "+22800000001",
    "email": "john@example.com",
    "description": "Screen is broken",
    "status": "pending",
    "photos": ["url1", "url2"],
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Repair request created successfully"
}
```

### Obtenir une réparation par ID
Récupérer les détails d'une demande de réparation.

- **Endpoint:** `GET /api/repair/:id`
- **Authentification:** Aucune
- **URL Parameters:** `id` (string) - ID de la réparation
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "name": "John Doe",
    "phone": "+22800000001",
    "email": "john@example.com",
    "description": "Screen is broken",
    "status": "pending",
    "price": null,
    "photos": ["url1", "url2"],
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Repair fetched successfully"
}
```

### Lister toutes les réparations (Admin)
Récupérer la liste de toutes les demandes de réparation.

- **Endpoint:** `GET /api/admin/repairs`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "repair_id",
      "name": "John Doe",
      "status": "pending",
      "price": null,
      "assignedTechnician": null,
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "message": "Repairs fetched successfully"
}
```

### Mettre à jour le prix d'une réparation (Admin)
Définir le prix de réparation.

- **Endpoint:** `PUT /api/admin/repair/:id/price`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de la réparation
- **Body:**
```json
{
  "price": 150
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "price": 150
  },
  "message": "Repair price updated"
}
```

### Mettre à jour le statut d'une réparation (Admin)
Changer le statut d'une réparation (pending, in_progress, completed, rejected).

- **Endpoint:** `PUT /api/admin/repair/:id/status`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de la réparation
- **Body:**
```json
{
  "status": "in_progress"
}
```
- **Statuts valides:** `pending`, `in_progress`, `completed`, `rejected`
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "status": "in_progress"
  },
  "message": "Repair status updated"
}
```

### Assigner une réparation à un technicien (Admin)
Assigner une réparation à un technicien spécifique.

- **Endpoint:** `PUT /api/admin/repair/:id/assign`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de la réparation
- **Body:**
```json
{
  "technicianId": "technician_id"
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "assignedTechnician": "technician_id"
  },
  "message": "Repair assigned to technician"
}
```

### Lister mes réparations (Technician)
Récupérer les réparations assignées au technicien connecté.

- **Endpoint:** `GET /api/technician/repairs`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "repair_id",
      "name": "John Doe",
      "description": "Screen is broken",
      "status": "in_progress",
      "price": 150
    }
  ],
  "message": "My repairs fetched successfully"
}
```

### Mettre à jour le statut d'une réparation (Technician)
Mettre à jour le statut d'une réparation (by technician).

- **Endpoint:** `PUT /api/technician/repair/:id/status`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de la réparation
- **Body:**
```json
{
  "status": "completed"
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "status": "completed"
  },
  "message": "Repair status updated"
}
```

### Obtenir l'historique des réparations (Technician)
Récupérer l'historique des réparations complétées par le technicien.

- **Endpoint:** `GET /api/technician/history`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "repair_id",
      "name": "John Doe",
      "description": "Screen is broken",
      "status": "completed",
      "price": 150,
      "completedAt": "2026-04-28T15:00:00Z"
    }
  ],
  "message": "Repair history fetched successfully"
}
```

---

## 🔄 Trade-Ins (Échanges)

### Créer une demande d'échange
Soumettre une nouvelle demande d'échange.

- **Endpoint:** `POST /api/tradein`
- **Authentification:** Aucune
- **Headers:**
```
Content-Type: multipart/form-data
```
- **Body (form-data):**
```
name: Jane Doe
phone: +22800000002
email: jane@example.com
deviceDescription: iPhone 12, good condition
photos: [fichiers - max 5]
```
- **Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "_id": "tradein_id",
    "name": "Jane Doe",
    "phone": "+22800000002",
    "email": "jane@example.com",
    "deviceDescription": "iPhone 12, good condition",
    "status": "pending",
    "value": null,
    "photos": ["url1", "url2"],
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Trade-in request created successfully"
}
```

### Obtenir un échange par ID
Récupérer les détails d'une demande d'échange.

- **Endpoint:** `GET /api/tradein/:id`
- **Authentification:** Aucune
- **URL Parameters:** `id` (string) - ID de l'échange
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "tradein_id",
    "name": "Jane Doe",
    "deviceDescription": "iPhone 12, good condition",
    "status": "pending",
    "value": null,
    "photos": ["url1", "url2"],
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Trade-in fetched successfully"
}
```

### Lister tous les échanges (Admin)
Récupérer la liste de toutes les demandes d'échange.

- **Endpoint:** `GET /api/admin/tradeins`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "tradein_id",
      "name": "Jane Doe",
      "status": "pending",
      "value": null,
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "message": "Trade-ins fetched successfully"
}
```

### Mettre à jour la valeur d'un échange (Admin)
Définir la valeur d'un appareil en échange.

- **Endpoint:** `PUT /api/admin/tradein/:id/value`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de l'échange
- **Body:**
```json
{
  "value": 400
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "tradein_id",
    "value": 400
  },
  "message": "Trade-in value updated"
}
```

### Accepter un échange (Admin)
Accepter une demande d'échange.

- **Endpoint:** `PUT /api/admin/tradein/:id/accept`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de l'échange
- **Body:**
```json
{
  "status": "accepted"
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "tradein_id",
    "status": "accepted"
  },
  "message": "Trade-in accepted"
}
```

---

## 📦 Inventory (Inventaire)

### Lister l'inventaire (Admin)
Récupérer tous les articles de l'inventaire.

- **Endpoint:** `GET /api/admin/inventory`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "item_id",
      "name": "Screen Protector",
      "quantity": 100,
      "price": 5,
      "photo": "url_to_photo",
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "message": "Inventory fetched successfully"
}
```

### Créer un article d'inventaire (Admin)
Ajouter un nouvel article à l'inventaire.

- **Endpoint:** `POST /api/admin/inventory`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```
- **Body (form-data):**
```
name: Screen Protector
quantity: 100
price: 5
photo: [fichier]
```
- **Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "_id": "item_id",
    "name": "Screen Protector",
    "quantity": 100,
    "price": 5,
    "photo": "url_to_photo",
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Inventory item created successfully"
}
```

### Mettre à jour un article d'inventaire (Admin)
Modifier un article de l'inventaire.

- **Endpoint:** `PUT /api/admin/inventory/:id`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de l'article
- **Body:**
```json
{
  "quantity": 95,
  "price": 5.5
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "item_id",
    "quantity": 95,
    "price": 5.5
  },
  "message": "Inventory item updated successfully"
}
```

### Supprimer un article d'inventaire (Admin)
Supprimer un article de l'inventaire.

- **Endpoint:** `DELETE /api/admin/inventory/:id`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **URL Parameters:** `id` (string) - ID de l'article
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Inventory item deleted successfully"
}
```

---

## 👥 Employees (Employés)

### Lister tous les employés (Admin)
Récupérer la liste de tous les employés.

- **Endpoint:** `GET /api/admin/employees`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "employee_id",
      "name": "Alice Smith",
      "email": "alice@elis.com",
      "phone": "+22800000003",
      "role": "technician",
      "skills": ["écran", "batterie"],
      "isActive": true,
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "message": "Employees fetched successfully"
}
```

### Créer un employé (Admin)
Ajouter un nouvel employé.

- **Endpoint:** `POST /api/admin/employees`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **Body:**
```json
{
  "name": "Alice Smith",
  "email": "alice@elis.com",
  "phone": "+22800000003",
  "role": "technician",
  "password": "password123",
  "skills": ["écran", "batterie"]
}
```
- **Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "_id": "employee_id",
    "name": "Alice Smith",
    "email": "alice@elis.com",
    "phone": "+22800000003",
    "role": "technician",
    "skills": ["écran", "batterie"],
    "isActive": true,
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Employee created successfully"
}
```

### Mettre à jour un employé (Admin)
Modifier les informations d'un employé.

- **Endpoint:** `PUT /api/admin/employees/:id`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **URL Parameters:** `id` (string) - ID de l'employé
- **Body:**
```json
{
  "name": "Alice Johnson",
  "phone": "+22800000004",
  "skills": ["écran", "batterie", "carte mère"]
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "_id": "employee_id",
    "name": "Alice Johnson",
    "phone": "+22800000004",
    "skills": ["écran", "batterie", "carte mère"]
  },
  "message": "Employee updated successfully"
}
```

### Supprimer un employé (Admin)
Supprimer un employé.

- **Endpoint:** `DELETE /api/admin/employees/:id`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
```
- **URL Parameters:** `id` (string) - ID de l'employé
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Employee deleted successfully"
}
```

### Clock In (Pointage d'arrivée)
Enregistrer l'arrivée d'un employé.

- **Endpoint:** `POST /api/admin/work/clockin`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **Body:**
```json
{}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "employeeId": "employee_id",
    "clockIn": "2026-04-28T08:00:00Z"
  },
  "message": "Clocked in successfully"
}
```

### Clock Out (Pointage de départ)
Enregistrer le départ d'un employé.

- **Endpoint:** `POST /api/admin/work/clockout`
- **Authentification:** JWT Token (Bearer)
- **Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```
- **Body:**
```json
{}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "employeeId": "employee_id",
    "clockOut": "2026-04-28T17:00:00Z"
  },
  "message": "Clocked out successfully"
}
```

---

## 📁 Upload (Téléchargement)

### Télécharger des fichiers
Télécharger des fichiers (max 5).

- **Endpoint:** `POST /api/upload`
- **Authentification:** Aucune
- **Headers:**
```
Content-Type: multipart/form-data
```
- **Body (form-data):**
```
files: [fichiers - max 5]
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "file1.jpg",
        "path": "/uploads/file1.jpg",
        "size": 102400
      }
    ]
  },
  "message": "Files uploaded successfully"
}
```

---

## 📄 Invoice (Factures)

### Générer une facture
Créer une nouvelle facture.

- **Endpoint:** `POST /api/invoice/generate`
- **Authentification:** Aucune
- **Headers:**
```
Content-Type: application/json
```
- **Body:**
```json
{
  "repairId": "repair_id",
  "items": [
    {
      "description": "Screen Replacement",
      "quantity": 1,
      "price": 150
    }
  ],
  "totalAmount": 150
}
```
- **Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "_id": "invoice_id",
    "repairId": "repair_id",
    "items": [
      {
        "description": "Screen Replacement",
        "quantity": 1,
        "price": 150
      }
    ],
    "totalAmount": 150,
    "createdAt": "2026-04-28T10:00:00Z"
  },
  "message": "Invoice generated successfully"
}
```

### Envoyer une facture via WhatsApp
Envoyer une facture au client via WhatsApp.

- **Endpoint:** `POST /api/invoice/send-whatsapp`
- **Authentification:** Aucune
- **Headers:**
```
Content-Type: application/json
```
- **Body:**
```json
{
  "invoiceId": "invoice_id",
  "phone": "+22800000001"
}
```
- **Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "invoice_id",
    "sentTo": "+22800000001"
  },
  "message": "Invoice sent via WhatsApp successfully"
}
```

---

## 📊 Swagger Documentation

Accédez à la documentation interactive Swagger à l'adresse suivante:

**Local:** `http://localhost:4001/api-docs`

---

## 🔗 Variables d'environnement

Pour utiliser correctement l'API, assurez-vous que les variables d'environnement suivantes sont définies dans votre fichier `.env`:

```env
PORT=4001
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database_name
CLIENT_URL=http://localhost:3001
ADMIN_DEFAULT_EMAIL=admin@elis.com
ADMIN_DEFAULT_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_key
```

---

## 🔍 Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | OK - Requête réussie |
| 201 | Created - Ressource créée |
| 400 | Bad Request - Requête invalide |
| 401 | Unauthorized - Non authentifié |
| 403 | Forbidden - Accès refusé |
| 404 | Not Found - Ressource non trouvée |
| 500 | Server Error - Erreur serveur |

---

## 📝 Notes importantes

1. **Authentification:** Tous les endpoints protégés nécessitent un token JWT valide dans le header `Authorization: Bearer YOUR_TOKEN`
2. **Fichiers:** Les uploads acceptent un maximum de 5 fichiers
3. **CORS:** L'API accepte les requêtes depuis les origines configurées
4. **Statuts:** Les statuts valides dépendent du type de ressource

---

## 🚀 Démarrage rapide

1. **Clonez** le repository
2. **Installez** les dépendances: `npm install`
3. **Configurez** le fichier `.env`
4. **Démarrez** le serveur: `npm run dev`
5. **Testez** les routes avec Postman ou cURL

---

## 📞 Support

Pour toute question ou problème, veuillez contacter l'équipe de développement.

---

**Dernière mise à jour:** 28 avril 2026
