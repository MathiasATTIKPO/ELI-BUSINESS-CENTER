# Admin Dashboard - ELI BUSINESS CENTER

Interface d'administration complète pour gérer les produits, réparations et échanges.

## 🚀 Démarrage rapide

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Créer un fichier .env.local
cp .env.example .env.local

# 3. Configurer l'API
# Dans .env.local, ajouter :
VITE_API_BASE_URL=http://localhost:4000
```

### Lancer l'application

```bash
# Mode développement
npm run dev

# L'interface sera disponible sur http://localhost:5174
```

## 📋 Authentification

**Email :** admin@elibusiness.com  
**Mot de passe :** password123

> ⚠️ À modifier dans le backend pour la production

## 🧩 Organisation du code

- L'interface admin est codée en React avec Vite et Tailwind.
- Les pages de réparations et d'échanges partagent des composants et des helpers pour garantir une UI cohérente.
- Le fichier `admin/src/utils/formatReference.js` formate les références de demande en `REF-xxxxxx` afin d'éviter l'affichage direct des `_id` MongoDB.

## 📑 Pages disponibles

### 1. **Login** (`/admin/login`)
- Connexion sécurisée avec JWT
- Stockage du token en localStorage
- Redirection automatique après connexion

### 2. **Dashboard** (`/admin/dashboard`)
- Statistiques en temps réel
- Cartes récapitulatives :
  - Produits actifs
  - Réparations en attente
  - Échanges en attente
  - Chiffre d'affaires (optionnel)
- Liens rapides vers les sections

### 3. **Produits** (`/admin/products`)
- Liste de tous les produits avec tableau
- Recherche par nom
- Tri par colonne
- Boutons d'action :
  - ✎ Modifier
  - ✓/✕ Activer/Désactiver
  - 🗑 Supprimer

#### Ajouter/Modifier produit (`/admin/products/new`, `/admin/products/:id`)
- Formulaire complet :
  - Nom du produit
  - Prix en FCFA
  - Stock disponible
  - Photo (upload avec aperçu)
  - Statut (actif/inactif)
- Validation des données
- Confirmation avant suppression

### 4. **Réparations** (`/admin/repairs`)
- Liste de toutes les demandes
- Filtres par statut :
  - pending (en attente)
  - quoted (devis envoyé)
  - accepted (accepté)
  - repairing (en réparation)
  - ready (prêt)
  - completed (terminé)
  - cancelled (annulé)
- Recherche par client

#### Détail réparation (`/admin/repairs/:id`)
- Infos client avec lien WhatsApp
- Galerie photos (téléphones uploadés)
- Description de la panne
- **Prix du devis** - Saisir et enregistrer
- **Statut** - Menu déroulant pour changer
- Bouton "Générer facture" (préparé)

### 5. **Échanges** (`/admin/tradeins`)
- Liste des demandes d'échange
- Filtres par statut :
  - pending (en attente)
  - accepted (accepté)
  - refused (refusé)
  - completed (terminé)
- Recherche par client

#### Détail échange (`/admin/tradeins/:id`)
- Infos client avec lien WhatsApp
- Galerie photos du téléphone
- État déclaré par le client
- **Valeur de reprise** - Proposer une valeur
- Boutons :
  - ✓ Accepter
  - ✕ Refuser

## 🔧 Structure des dossiers

```
admin/
├── src/
│   ├── pages/           # Pages principales
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── ProductForm.jsx
│   │   ├── Repairs.jsx
│   │   ├── RepairDetail.jsx
│   │   ├── TradeIns.jsx
│   │   └── TradeInDetail.jsx
│   ├── components/      # Composants réutilisables
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── Table.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── ImageGallery.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/         # Contexte d'authentification
│   │   └── AuthContext.jsx
│   ├── services/        # Services API
│   │   └── api.js
│   ├── App.jsx          # Routes principales
│   ├── main.jsx         # Point d'entrée
│   └── index.css        # Styles Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🔐 Sécurité

### Authentification JWT
- Token stocké en localStorage
- Vérifié dans les headers : `Authorization: Bearer <token>`
- Redirection automatique si token expiré (401)

### Routes protégées
- Toutes les routes `/admin/*` sont protégées
- Redirection vers `/admin/login` si non authentifié

### Intercepteurs Axios
- Ajout automatique du token à chaque requête
- Gestion des erreurs 401 (logout automatique)

## 🎨 Design et Couleurs

| Élément | Couleur | Classe |
|---------|---------|--------|
| Primaire (Bleu nuit) | `#1e2a5e` | `primary` |
| Accent (Orange) | `#f39c12` | `accent` |
| Succès | `#22c55e` | `bg-green-500` |
| Erreur | `#ef4444` | `bg-red-500` |
| Warning | `#eab308` | `bg-yellow-500` |

## 📦 Dépendances

| Package | Version | Raison |
|---------|---------|--------|
| react | ^18.2.0 | Framework UI |
| react-dom | ^18.2.0 | Rendu React |
| react-router-dom | ^6.16.0 | Routage |
| axios | ^1.5.0 | Client HTTP |
| react-hook-form | ^7.47.0 | Gestion formulaires |
| tailwindcss | ^3.3.0 | CSS utilitaire |

## 🚀 Déploiement

### Build production
```bash
npm run build
```

Le dossier `dist/` sera généré avec les fichiers optimisés.

### Variables d'environnement
```env
VITE_API_BASE_URL=https://api.votredomaine.com
```

## 🐛 Dépannage

### Erreur 401 (non autorisé)
- Vérifier que le backend est en cours d'exécution
- Vérifier l'email/mot de passe
- Vérifier la variable `VITE_API_BASE_URL`

### Formulaires non soumis
- Vérifier la connexion Internet
- Vérifier les logs dans la console
- S'assurer que tous les champs requis sont remplis

### Galerie photos vide
- Vérifier que les photos ont été uploadées lors de la demande
- Vérifier que les URLs sont correctes

## 📝 À faire (Bonus)

- [ ] Filtres avancés par date
- [ ] Export Excel des demandes
- [ ] Pagination avancée
- [ ] Graphiques Chart.js
- [ ] Historique des modifications
- [ ] Gestion des utilisateurs admin
- [ ] Barre de recherche globale
- [ ] Notifications en temps réel

## 📞 Support

Pour toute question ou problème, contacter :
- Email : support@elibusiness.com
- WhatsApp : [À définir]

---

**Version :** 1.0.0  
**Dernière mise à jour :** Avril 2026  
**Auteur :** Équipe ELI BUSINESS CENTER
