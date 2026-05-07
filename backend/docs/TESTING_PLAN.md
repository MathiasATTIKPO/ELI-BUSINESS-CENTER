# 🧪 Plan de Test Étape par Étape

## Objectif
Tester systématiquement tous les endpoints de l'API ELI Business Center de manière logique et cohérente.

---

## ✅ Phase 1: Vérification de base (2-3 min)

### 1.1 Health Check
**Endpoint:** `GET /api/health`
**Statut attendu:** 200
**Objectif:** Vérifier que l'API fonctionne

```bash
curl -X GET "http://localhost:4001/api/health"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": null,
  "message": "API is running"
}
```

---

## ✅ Phase 2: Authentification (5-10 min)

### 2.1 Login Admin
**Endpoint:** `POST /api/admin/login`
**Statut attendu:** 200
**Objectif:** Obtenir un token JWT pour les requêtes admin

```bash
curl -X POST "http://localhost:4001/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elis.com",
    "password": "admin123"
  }'
```

**Réponse attendue:**
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

**Action:** Copiez le token dans la variable `ADMIN_TOKEN`

---

### 2.2 Login Technician
**Endpoint:** `POST /api/technician/login`
**Statut attendu:** 200
**Objectif:** Obtenir un token JWT pour les requêtes technicien

```bash
curl -X POST "http://localhost:4001/api/technician/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@elis.com",
    "password": "tech123"
  }'
```

**Réponse attendue:**
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

**Action:** Copiez le token dans la variable `TECH_TOKEN`

---

## ✅ Phase 3: Products (Produits) (10-15 min)

### 3.1 Lister tous les produits
**Endpoint:** `GET /api/products`
**Authentification:** Non
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/products"
```

**Résultat:** Devrait lister tous les produits (peut être vide initialement)

---

### 3.2 Créer un produit (Admin)
**Endpoint:** `POST /api/admin/products`
**Authentification:** Oui (Bearer token)
**Statut attendu:** 201

**Préparation:**
1. Créez ou trouvez une image `.jpg` sur votre ordinateur

**Exécution:**
```bash
curl -X POST "http://localhost:4001/api/admin/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "name=iPhone 15" \
  -F "price=1299" \
  -F "description=Latest iPhone 15 model with A17 Pro chip" \
  -F "stock=50" \
  -F "photo=@/path/to/your/image.jpg"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "iPhone 15",
    "price": 1299,
    ...
  },
  "message": "Product created successfully"
}
```

**Action:** Copiez l'`_id` du produit créé dans `PRODUCT_ID`

---

### 3.3 Obtenir un produit par ID
**Endpoint:** `GET /api/products/{PRODUCT_ID}`
**Authentification:** Non
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/products/$PRODUCT_ID"
```

**Résultat:** Devrait afficher le produit créé à l'étape 3.2

---

### 3.4 Mettre à jour un produit (Admin)
**Endpoint:** `PUT /api/admin/products/{PRODUCT_ID}`
**Authentification:** Oui (Bearer token)
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1399,
    "stock": 40
  }'
```

**Résultat:** Le produit devrait être mis à jour

---

## ✅ Phase 4: Repairs (Réparations) (15-20 min)

### 4.1 Créer une demande de réparation (Public)
**Endpoint:** `POST /api/repair`
**Authentification:** Non
**Statut attendu:** 201

**Exécution:**
```bash
curl -X POST "http://localhost:4001/api/repair" \
  -F "name=John Doe" \
  -F "phone=+22800000001" \
  -F "email=john.doe@example.com" \
  -F "description=Screen is completely broken and needs replacement" \
  -F "photos=@/path/to/photo1.jpg"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "_id": "repair_id",
    "name": "John Doe",
    "status": "pending",
    ...
  },
  "message": "Repair request created successfully"
}
```

**Action:** Copiez l'`_id` de la réparation dans `REPAIR_ID`

---

### 4.2 Obtenir une réparation par ID (Public)
**Endpoint:** `GET /api/repair/{REPAIR_ID}`
**Authentification:** Non
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/repair/$REPAIR_ID"
```

**Résultat:** Devrait afficher la réparation créée à l'étape 4.1

---

### 4.3 Lister toutes les réparations (Admin)
**Endpoint:** `GET /api/admin/repairs`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/admin/repairs" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Résultat:** Devrait afficher la réparation de l'étape 4.1

---

### 4.4 Mettre à jour le prix (Admin)
**Endpoint:** `PUT /api/admin/repair/{REPAIR_ID}/price`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/repair/$REPAIR_ID/price" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 150
  }'
```

---

### 4.5 Mettre à jour le statut (Admin)
**Endpoint:** `PUT /api/admin/repair/{REPAIR_ID}/status`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/repair/$REPAIR_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

**Statuts:** pending → in_progress → completed/rejected

---

### 4.6 Assigner à un technicien (Admin)
**Endpoint:** `PUT /api/admin/repair/{REPAIR_ID}/assign`
**Authentification:** Oui
**Statut attendu:** 200

```bash
# Note: Récupérez l'ID du technicien par défaut depuis la base de données
TECHNICIAN_ID="default_tech_id"

curl -X PUT "http://localhost:4001/api/admin/repair/$REPAIR_ID/assign" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"technicianId\": \"$TECHNICIAN_ID\"
  }"
```

---

### 4.7 Obtenir mes réparations (Technician)
**Endpoint:** `GET /api/technician/repairs`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/technician/repairs" \
  -H "Authorization: Bearer $TECH_TOKEN"
```

**Résultat:** Devrait afficher la réparation assignée

---

### 4.8 Mettre à jour le statut (Technician)
**Endpoint:** `PUT /api/technician/repair/{REPAIR_ID}/status`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/technician/repair/$REPAIR_ID/status" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

### 4.9 Historique des réparations (Technician)
**Endpoint:** `GET /api/technician/history`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/technician/history" \
  -H "Authorization: Bearer $TECH_TOKEN"
```

---

## ✅ Phase 5: Trade-Ins (Échanges) (10-15 min)

### 5.1 Créer une demande d'échange (Public)
**Endpoint:** `POST /api/tradein`
**Authentification:** Non
**Statut attendu:** 201

```bash
curl -X POST "http://localhost:4001/api/tradein" \
  -F "name=Jane Smith" \
  -F "phone=+22800000002" \
  -F "email=jane.smith@example.com" \
  -F "deviceDescription=iPhone 12 Pro, excellent condition, no scratches" \
  -F "photos=@/path/to/photo1.jpg"
```

**Action:** Copiez l'`_id` dans `TRADEIN_ID`

---

### 5.2 Obtenir un échange par ID (Public)
**Endpoint:** `GET /api/tradein/{TRADEIN_ID}`
**Authentification:** Non
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/tradein/$TRADEIN_ID"
```

---

### 5.3 Lister tous les échanges (Admin)
**Endpoint:** `GET /api/admin/tradeins`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/admin/tradeins" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 5.4 Mettre à jour la valeur (Admin)
**Endpoint:** `PUT /api/admin/tradein/{TRADEIN_ID}/value`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/tradein/$TRADEIN_ID/value" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 600
  }'
```

---

### 5.5 Accepter un échange (Admin)
**Endpoint:** `PUT /api/admin/tradein/{TRADEIN_ID}/accept`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/tradein/$TRADEIN_ID/accept" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

---

## ✅ Phase 6: Inventory (Inventaire) (10-15 min)

### 6.1 Lister l'inventaire (Admin)
**Endpoint:** `GET /api/admin/inventory`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/admin/inventory" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 6.2 Créer un article d'inventaire (Admin)
**Endpoint:** `POST /api/admin/inventory`
**Authentification:** Oui
**Statut attendu:** 201

```bash
curl -X POST "http://localhost:4001/api/admin/inventory" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "name=Screen Protector" \
  -F "quantity=100" \
  -F "price=5.99" \
  -F "photo=@/path/to/image.jpg"
```

**Action:** Copiez l'`_id` dans `INVENTORY_ID`

---

### 6.3 Mettre à jour un article (Admin)
**Endpoint:** `PUT /api/admin/inventory/{INVENTORY_ID}`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/inventory/$INVENTORY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 85,
    "price": 5.50
  }'
```

---

### 6.4 Supprimer un article (Admin)
**Endpoint:** `DELETE /api/admin/inventory/{INVENTORY_ID}`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X DELETE "http://localhost:4001/api/admin/inventory/$INVENTORY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ✅ Phase 7: Employees (Employés) (15-20 min)

### 7.1 Lister tous les employés (Admin)
**Endpoint:** `GET /api/admin/employees`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X GET "http://localhost:4001/api/admin/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 7.2 Créer un employé (Admin)
**Endpoint:** `POST /api/admin/employees`
**Authentification:** Oui
**Statut attendu:** 201

```bash
curl -X POST "http://localhost:4001/api/admin/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice.johnson@elis.com",
    "phone": "+22800000003",
    "role": "technician",
    "password": "password123",
    "skills": ["écran", "batterie", "carte mère"]
  }'
```

**Action:** Copiez l'`_id` dans `EMPLOYEE_ID`

---

### 7.3 Mettre à jour un employé (Admin)
**Endpoint:** `PUT /api/admin/employees/{EMPLOYEE_ID}`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X PUT "http://localhost:4001/api/admin/employees/$EMPLOYEE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+22800000004",
    "skills": ["écran", "batterie", "carte mère", "USB"]
  }'
```

---

### 7.4 Clock In (Pointage)
**Endpoint:** `POST /api/admin/work/clockin`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X POST "http://localhost:4001/api/admin/work/clockin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 7.5 Clock Out
**Endpoint:** `POST /api/admin/work/clockout`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X POST "http://localhost:4001/api/admin/work/clockout" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 7.6 Supprimer un employé (Admin)
**Endpoint:** `DELETE /api/admin/employees/{EMPLOYEE_ID}`
**Authentification:** Oui
**Statut attendu:** 200

```bash
curl -X DELETE "http://localhost:4001/api/admin/employees/$EMPLOYEE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ✅ Phase 8: Upload et Invoice (10-15 min)

### 8.1 Télécharger des fichiers
**Endpoint:** `POST /api/upload`
**Authentification:** Non
**Statut attendu:** 200

```bash
curl -X POST "http://localhost:4001/api/upload" \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.jpg"
```

---

### 8.2 Générer une facture
**Endpoint:** `POST /api/invoice/generate`
**Authentification:** Non
**Statut attendu:** 201

```bash
curl -X POST "http://localhost:4001/api/invoice/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"repairId\": \"$REPAIR_ID\",
    \"items\": [
      {
        \"description\": \"Screen Replacement\",
        \"quantity\": 1,
        \"price\": 150
      }
    ],
    \"totalAmount\": 150
  }"
```

**Action:** Copiez l'`_id` dans `INVOICE_ID`

---

### 8.3 Envoyer une facture via WhatsApp
**Endpoint:** `POST /api/invoice/send-whatsapp`
**Authentification:** Non
**Statut attendu:** 200

```bash
curl -X POST "http://localhost:4001/api/invoice/send-whatsapp" \
  -H "Content-Type: application/json" \
  -d "{
    \"invoiceId\": \"$INVOICE_ID\",
    \"phone\": \"+22800000001\"
  }"
```

---

## 📊 Résumé des tests

| Phase | Module | Statuts | Durée |
|-------|--------|---------|-------|
| 1 | Health | ✅ | 2-3 min |
| 2 | Auth | ✅ | 5-10 min |
| 3 | Products | ✅ | 10-15 min |
| 4 | Repairs | ✅ | 15-20 min |
| 5 | Trade-Ins | ✅ | 10-15 min |
| 6 | Inventory | ✅ | 10-15 min |
| 7 | Employees | ✅ | 15-20 min |
| 8 | Upload & Invoice | ✅ | 10-15 min |
| **Total** | **Tous les endpoints** | **✅** | **~90 min** |

---

## 💾 Checklist de test

- [ ] Phase 1: Health Check ✓
- [ ] Phase 2: Authentification ✓
- [ ] Phase 3: Products ✓
- [ ] Phase 4: Repairs ✓
- [ ] Phase 5: Trade-Ins ✓
- [ ] Phase 6: Inventory ✓
- [ ] Phase 7: Employees ✓
- [ ] Phase 8: Upload & Invoice ✓

---

**Durée totale estimée:** ~90 minutes

Bon test! 🚀
