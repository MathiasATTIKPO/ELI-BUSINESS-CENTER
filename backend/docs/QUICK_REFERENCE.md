# 🎯 Quick Reference - Commandes essentielles

## Configuration rapide

```bash
# Variables d'environnement
BASE_URL="http://localhost:4001"
ADMIN_TOKEN=""      # À remplir après login
TECH_TOKEN=""       # À remplir après login
PRODUCT_ID=""       # À remplir après création
REPAIR_ID=""        # À remplir après création
TRADEIN_ID=""       # À remplir après création
EMPLOYEE_ID=""      # À remplir après création
INVENTORY_ID=""     # À remplir après création
INVOICE_ID=""       # À remplir après création
```

---

## 🔓 Authentification (Commencer par ici!)

### 1. Login Admin
```bash
curl -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elis.com","password":"admin123"}'
```
**→ Copiez le token dans $ADMIN_TOKEN**

### 2. Login Technician
```bash
curl -X POST "$BASE_URL/api/technician/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tech@elis.com","password":"tech123"}'
```
**→ Copiez le token dans $TECH_TOKEN**

---

## 📋 Endpoints rapides

### Health
```bash
curl "$BASE_URL/api/health"
```

### Products
```bash
# Lister
curl "$BASE_URL/api/products"

# Créer (Admin)
curl -X POST "$BASE_URL/api/admin/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "name=iPhone 15" -F "price=1299" -F "stock=50" \
  -F "description=Latest model" -F "photo=@image.jpg"

# Obtenir
curl "$BASE_URL/api/products/$PRODUCT_ID"

# Mettre à jour (Admin)
curl -X PUT "$BASE_URL/api/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":1399}'

# Supprimer (Admin)
curl -X DELETE "$BASE_URL/api/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Repairs
```bash
# Créer (Public)
curl -X POST "$BASE_URL/api/repair" \
  -F "name=John Doe" -F "phone=+22800000001" \
  -F "email=john@example.com" -F "description=Screen broken" \
  -F "photos=@photo1.jpg"

# Obtenir (Public)
curl "$BASE_URL/api/repair/$REPAIR_ID"

# Lister (Admin)
curl "$BASE_URL/api/admin/repairs" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Prix (Admin)
curl -X PUT "$BASE_URL/api/admin/repair/$REPAIR_ID/price" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":150}'

# Statut (Admin)
curl -X PUT "$BASE_URL/api/admin/repair/$REPAIR_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

# Assigner (Admin)
curl -X PUT "$BASE_URL/api/admin/repair/$REPAIR_ID/assign" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technicianId":"TECH_ID"}'

# Mes réparations (Tech)
curl "$BASE_URL/api/technician/repairs" \
  -H "Authorization: Bearer $TECH_TOKEN"

# Historique (Tech)
curl "$BASE_URL/api/technician/history" \
  -H "Authorization: Bearer $TECH_TOKEN"
```

### Trade-Ins
```bash
# Créer (Public)
curl -X POST "$BASE_URL/api/tradein" \
  -F "name=Jane Doe" -F "phone=+22800000002" \
  -F "email=jane@example.com" -F "deviceDescription=iPhone 12" \
  -F "photos=@photo1.jpg"

# Obtenir (Public)
curl "$BASE_URL/api/tradein/$TRADEIN_ID"

# Lister (Admin)
curl "$BASE_URL/api/admin/tradeins" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Valeur (Admin)
curl -X PUT "$BASE_URL/api/admin/tradein/$TRADEIN_ID/value" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":400}'

# Accepter (Admin)
curl -X PUT "$BASE_URL/api/admin/tradein/$TRADEIN_ID/accept" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

### Inventory
```bash
# Lister (Admin)
curl "$BASE_URL/api/admin/inventory" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Créer (Admin)
curl -X POST "$BASE_URL/api/admin/inventory" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "name=Screen Protector" -F "quantity=100" -F "price=5.99" \
  -F "photo=@image.jpg"

# Mettre à jour (Admin)
curl -X PUT "$BASE_URL/api/admin/inventory/$INVENTORY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":95}'

# Supprimer (Admin)
curl -X DELETE "$BASE_URL/api/admin/inventory/$INVENTORY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Employees
```bash
# Lister (Admin)
curl "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Créer (Admin)
curl -X POST "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Alice Johnson",
    "email":"alice@elis.com",
    "phone":"+22800000003",
    "role":"technician",
    "password":"password123",
    "skills":["écran","batterie"]
  }'

# Mettre à jour (Admin)
curl -X PUT "$BASE_URL/api/admin/employees/$EMPLOYEE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+22800000004"}'

# Clock In (Admin)
curl -X POST "$BASE_URL/api/admin/work/clockin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{}'

# Clock Out (Admin)
curl -X POST "$BASE_URL/api/admin/work/clockout" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{}'

# Supprimer (Admin)
curl -X DELETE "$BASE_URL/api/admin/employees/$EMPLOYEE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Upload
```bash
curl -X POST "$BASE_URL/api/upload" \
  -F "files=@file1.jpg" -F "files=@file2.jpg"
```

### Invoice
```bash
# Générer
curl -X POST "$BASE_URL/api/invoice/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "repairId":"'$REPAIR_ID'",
    "items":[{"description":"Screen","quantity":1,"price":150}],
    "totalAmount":150
  }'

# Envoyer WhatsApp
curl -X POST "$BASE_URL/api/invoice/send-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"'$INVOICE_ID'","phone":"+22800000001"}'
```

---

## 📝 Checklist rapide

- [ ] Health check: `GET /api/health`
- [ ] Login admin et copier token
- [ ] Login tech et copier token
- [ ] Tester CRUD produits
- [ ] Tester workflow réparation
- [ ] Tester workflow échange
- [ ] Tester gestion inventaire
- [ ] Tester gestion employés
- [ ] Tester upload
- [ ] Tester facture

---

## 🔗 Liens utiles

- **Swagger:** http://localhost:4001/api-docs
- **Base URL:** http://localhost:4001
- **Documentation complète:** Voir `API_DOCUMENTATION.md`
- **Plan de test:** Voir `TESTING_PLAN.md`

---

## 💡 Conseil Pro

**Utilisez Postman!** C'est plus facile que cURL, surtout pour:
- Les uploads (form-data)
- Les variables d'environnement
- L'historique des requêtes
- Les tests en interface graphique

1. Importez `POSTMAN_COLLECTION.json`
2. Importez `POSTMAN_ENVIRONMENT.json`
3. Sélectionnez l'environnement
4. Testez les endpoints graphiquement

---

**Bon test! 🚀**
