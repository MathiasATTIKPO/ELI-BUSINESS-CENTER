# 🔗 Guide de Tunneling

Solutions pour exposer votre API locale sur Internet.

## 1️⃣ Tunnel Local (Recommandé pour développement)

**Le plus simple, aucune configuration externe nécessaire !**

### Démarrage

```bash
cd backend
npm run tunnel
```

### Résultat
```
✅ Tunnel Server running!
📍 Local API: http://localhost:4001
🔗 Tunnel URL: http://localhost:8080
```

### Utilisation
```env
# Dans .env (racine du projet)
VITE_API_BASE_URL=http://localhost:8080
```

### Avantages
- ✅ Fonctionne sur Windows, Mac, Linux
- ✅ Aucun outil externe à installer
- ✅ HTTPS automatique sur localtunnel
- ✅ Parfait pour les tests locaux

### Inconvénients
- ❌ URL locale uniquement (pas accessible de l'extérieur)
- ❌ À redémarrer à chaque session

---

## 2️⃣ Ngrok (Recommandé pour production)

**Expose votre API publiquement sur Internet !**

### Installation

1. Téléchargez depuis [ngrok.com/download](https://ngrok.com/download)
2. Extrayez et ajoutez au PATH de votre système

### Démarrage

```bash
cd backend
npm run tunnel:ngrok
```

### Résultat
```
Session Status                online
Version                       3.x.x
Region                        eu (Europe)
Forwarding                    https://xxxxx.ngrok-free.app -> http://localhost:4001
Web Interface                 http://127.0.0.1:4040
```

### Utilisation
```env
# Dans backend/.env
NGROK_URL=https://xxxxx.ngrok-free.app

# Dans .env (racine du projet)
VITE_API_BASE_URL=https://xxxxx.ngrok-free.app
```

### Dashboard
Consultez les requêtes en temps réel : `http://127.0.0.1:4040`

### Avantages
- ✅ Accessible de partout sur Internet
- ✅ HTTPS automatique
- ✅ Dashboard intégré
- ✅ URL stable (gratuit, 2h de session)

### Inconvénients
- ❌ Nécessite une installation externe
- ❌ Limite 40 connexions/minute (gratuit)
- ❌ Session limitée à 2 heures

---

## 3️⃣ LocalTunnel (Alternatif)

**Simple mais avec des limitations.**

```bash
npx localtunnel --port 4001
```

### ⚠️ Note
- Fonctionne mieux sur Linux/Mac que sur Windows
- Peut avoir des problèmes de stabilité
- URL : `https://xxxxx.loca.lt`

---

## 4️⃣ Cloudflare Tunnel (Alternatif avancé)

**Solution professionelle de Cloudflare.**

```bash
# Installer cloudflared
# Puis:
cloudflared tunnel --url http://localhost:4001
```

### Avantages
- ✅ Infrastructure Cloudflare (très fiable)
- ✅ Gratuit et sans limites
- ✅ Personnalisation avancée

### Inconvénients
- ❌ Dépendance externe à installer

---

## 5️⃣ Serveo (SSH-basé)

**Solution SSH ultra-simple.**

```bash
ssh -R 80:localhost:4001 serveo.net
```

### Avantages
- ✅ Très simple (une ligne !)
- ✅ Fonctionne partout
- ✅ SSH natif

### Inconvénients
- ❌ Pas d'HTTPS
- ❌ Moins de contrôle

---

## 📊 Comparaison

| Solution | Facilité | Installation | HTTPS | Internet | Limites |
|----------|----------|--------------|-------|----------|---------|
| **Tunnel Local** | ⭐⭐⭐⭐⭐ | Aucune | ❌ | ❌ | Local seulement |
| **Ngrok** | ⭐⭐⭐ | Requise | ✅ | ✅ | 40 conn/min, 2h session |
| **LocalTunnel** | ⭐⭐⭐ | npm | ✅ | ✅ | Instabilité W indows |
| **Cloudflare** | ⭐⭐ | Requise | ✅ | ✅ | Configuration complexe |
| **Serveo** | ⭐⭐⭐⭐⭐ | Aucune | ❌ | ✅ | Pas HTTPS |

---

## 🎯 Recommandations

### Pour développement local
👉 **Utilisez le Tunnel Local** (`npm run tunnel`)
- Simple, zéro configuration, aucun outil externe

### Pour tests avec équipe
👉 **Utilisez Ngrok** (`npm run tunnel:ngrok`)
- HTTPS sécurisé, URL stable, dashboard intégré

### Pour production
👉 **Utilisez Cloudflare Tunnel** ou un serveur dédié
- Fiabilité maximale, infrastructure professionnelle

---

## 🔧 Dépannage

### "Le port 8080 est déjà utilisé"
```bash
npx kill-port 8080
npm run tunnel
```

### "Ngrok : command not found"
- Installez ngrok depuis [ngrok.com](https://ngrok.com/download)
- Ajoutez-le au PATH de votre système

### "Connexion timeout"
- Vérifiez que le backend est bien lancé (`npm run dev`)
- Vérifiez les pare-feu/antivirus
- Essayez un autre service de tunneling

### "CORS error"
- Assurez-vous que `VITE_API_BASE_URL` est correctement configurée
- Redémarrez les frontends après changer l'URL
- Vérifiez que les origines sont acceptées dans le backend

---

## 📚 Resources

- Ngrok Docs: https://ngrok.com/docs
- LocalTunnel Docs: https://theboroer.github.io/localTunnel/
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
