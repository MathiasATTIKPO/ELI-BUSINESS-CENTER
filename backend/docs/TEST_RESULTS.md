# 📋 Feuille de test et de résultats

Utilisez ce fichier pour documenter vos tests et sauvegarder les IDs importants.

---

## 🔐 Authentification

### Admin Login
- **Endpoint:** `POST /api/admin/login`
- **Email:** admin@elis.com
- **Mot de passe:** admin123
- **Statut testé:** ___
- **Token reçu:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```
- **Date/Heure du test:** _______________

---

### Technician Login
- **Endpoint:** `POST /api/technician/login`
- **Email:** tech@elis.com
- **Mot de passe:** tech123
- **Statut testé:** ___
- **Token reçu:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```
- **Date/Heure du test:** _______________

---

## 🛍️ Products (Produits)

### Créer un produit
- **Endpoint:** `POST /api/admin/products`
- **Statut testé:** ___
- **Produit ID créé:** ___________________
- **Nom:** iPhone 15
- **Prix:** 1299
- **Stock:** 50
- **Date/Heure du test:** _______________

### Lister les produits
- **Endpoint:** `GET /api/products`
- **Statut testé:** ___
- **Nombre de produits:** ___
- **Date/Heure du test:** _______________

### Obtenir un produit
- **Endpoint:** `GET /api/products/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

### Mettre à jour un produit
- **Endpoint:** `PUT /api/admin/products/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Changements appliqués:** _______________
- **Date/Heure du test:** _______________

### Supprimer un produit
- **Endpoint:** `DELETE /api/admin/products/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

---

## 🔧 Repairs (Réparations)

### Créer une réparation
- **Endpoint:** `POST /api/repair`
- **Statut testé:** ___
- **Repair ID créé:** ___________________
- **Nom du client:** ___________________
- **Téléphone:** ___________________
- **Email:** ___________________
- **Description:** ___________________
- **Date/Heure du test:** _______________

### Obtenir une réparation
- **Endpoint:** `GET /api/repair/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Statut de la réparation:** ___________________
- **Date/Heure du test:** _______________

### Lister les réparations (Admin)
- **Endpoint:** `GET /api/admin/repairs`
- **Statut testé:** ___
- **Nombre de réparations:** ___
- **Date/Heure du test:** _______________

### Mettre à jour le prix
- **Endpoint:** `PUT /api/admin/repair/{ID}/price`
- **ID utilisé:** ___________________
- **Prix défini:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

### Mettre à jour le statut
- **Endpoint:** `PUT /api/admin/repair/{ID}/status`
- **ID utilisé:** ___________________
- **Ancien statut:** ___________________
- **Nouveau statut:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

### Assigner à un technicien
- **Endpoint:** `PUT /api/admin/repair/{ID}/assign`
- **Repair ID:** ___________________
- **Technician ID:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

### Mes réparations (Technician)
- **Endpoint:** `GET /api/technician/repairs`
- **Statut testé:** ___
- **Nombre de réparations:** ___
- **Date/Heure du test:** _______________

### Historique (Technician)
- **Endpoint:** `GET /api/technician/history`
- **Statut testé:** ___
- **Nombre de réparations complétées:** ___
- **Date/Heure du test:** _______________

---

## 🔄 Trade-Ins (Échanges)

### Créer un échange
- **Endpoint:** `POST /api/tradein`
- **Statut testé:** ___
- **Trade-in ID créé:** ___________________
- **Nom du client:** ___________________
- **Description de l'appareil:** ___________________
- **Date/Heure du test:** _______________

### Obtenir un échange
- **Endpoint:** `GET /api/tradein/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

### Lister les échanges (Admin)
- **Endpoint:** `GET /api/admin/tradeins`
- **Statut testé:** ___
- **Nombre d'échanges:** ___
- **Date/Heure du test:** _______________

### Mettre à jour la valeur (Admin)
- **Endpoint:** `PUT /api/admin/tradein/{ID}/value`
- **ID utilisé:** ___________________
- **Valeur définie:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

### Accepter un échange (Admin)
- **Endpoint:** `PUT /api/admin/tradein/{ID}/accept`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

---

## 📦 Inventory (Inventaire)

### Lister l'inventaire (Admin)
- **Endpoint:** `GET /api/admin/inventory`
- **Statut testé:** ___
- **Nombre d'articles:** ___
- **Date/Heure du test:** _______________

### Créer un article (Admin)
- **Endpoint:** `POST /api/admin/inventory`
- **Statut testé:** ___
- **Item ID créé:** ___________________
- **Nom:** ___________________
- **Quantité:** ___________________
- **Prix:** ___________________
- **Date/Heure du test:** _______________

### Mettre à jour un article (Admin)
- **Endpoint:** `PUT /api/admin/inventory/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Changements:** ___________________
- **Date/Heure du test:** _______________

### Supprimer un article (Admin)
- **Endpoint:** `DELETE /api/admin/inventory/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

---

## 👥 Employees (Employés)

### Lister les employés (Admin)
- **Endpoint:** `GET /api/admin/employees`
- **Statut testé:** ___
- **Nombre d'employés:** ___
- **Date/Heure du test:** _______________

### Créer un employé (Admin)
- **Endpoint:** `POST /api/admin/employees`
- **Statut testé:** ___
- **Employee ID créé:** ___________________
- **Nom:** ___________________
- **Email:** ___________________
- **Rôle:** ___________________
- **Compétences:** ___________________
- **Date/Heure du test:** _______________

### Mettre à jour un employé (Admin)
- **Endpoint:** `PUT /api/admin/employees/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Changements:** ___________________
- **Date/Heure du test:** _______________

### Clock In (Pointage d'arrivée)
- **Endpoint:** `POST /api/admin/work/clockin`
- **Statut testé:** ___
- **Heure d'arrivée:** ___________________
- **Date/Heure du test:** _______________

### Clock Out (Pointage de départ)
- **Endpoint:** `POST /api/admin/work/clockout`
- **Statut testé:** ___
- **Heure de départ:** ___________________
- **Date/Heure du test:** _______________

### Supprimer un employé (Admin)
- **Endpoint:** `DELETE /api/admin/employees/{ID}`
- **ID utilisé:** ___________________
- **Statut testé:** ___
- **Date/Heure du test:** _______________

---

## 📁 Upload

### Télécharger des fichiers
- **Endpoint:** `POST /api/upload`
- **Statut testé:** ___
- **Nombre de fichiers:** ___
- **Noms des fichiers:** 
  1. ___________________
  2. ___________________
  3. ___________________
- **URLs retournées:**
  1. ___________________
  2. ___________________
  3. ___________________
- **Date/Heure du test:** _______________

---

## 📄 Invoice (Factures)

### Générer une facture
- **Endpoint:** `POST /api/invoice/generate`
- **Statut testé:** ___
- **Invoice ID créé:** ___________________
- **Repair ID utilisé:** ___________________
- **Montant total:** ___________________
- **Date/Heure du test:** _______________

### Envoyer via WhatsApp
- **Endpoint:** `POST /api/invoice/send-whatsapp`
- **Statut testé:** ___
- **Invoice ID utilisé:** ___________________
- **Numéro de téléphone:** ___________________
- **Date/Heure du test:** _______________

---

## 📊 Résumé des résultats

| Module | Endpoints testés | Statut | Notes |
|--------|-----------------|--------|-------|
| Health | 1 | ___ | ___ |
| Auth | 2 | ___ | ___ |
| Products | 5 | ___ | ___ |
| Repairs | 8 | ___ | ___ |
| Trade-Ins | 5 | ___ | ___ |
| Inventory | 4 | ___ | ___ |
| Employees | 6 | ___ | ___ |
| Upload | 1 | ___ | ___ |
| Invoice | 2 | ___ | ___ |
| **TOTAL** | **34** | **___** | **___** |

---

## ✅ Checklist finale

- [ ] Health check: OK
- [ ] Login Admin: OK
- [ ] Login Technician: OK
- [ ] Tous les endpoints testés: OK
- [ ] Aucune erreur critique: OK
- [ ] Tous les IDs documentés: OK
- [ ] Rapport de test complété: OK

---

## 📝 Observations générales

Problèmes rencontrés:
```
__________________________________________________________
__________________________________________________________
__________________________________________________________
```

Améliorations suggérées:
```
__________________________________________________________
__________________________________________________________
__________________________________________________________
```

---

**Date du test:** _______________
**Testeur:** ___________________
**Environnement:** LOCAL / PRODUCTION
**Statut global:** ✅ RÉUSSI / ⚠️ AVERTISSEMENTS / ❌ ERREURS

---

*Fin du rapport de test*
