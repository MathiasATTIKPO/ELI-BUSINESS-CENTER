# ELI'S BUSINESS CENTER

Site vitrine React + Vite pour une petite entreprise spécialisée dans la vente, la réparation et l’échange de téléphones Apple.

## Structure du projet

- `src/App.jsx` : configuration des routes et composantes globales
- `src/main.jsx` : point d’entrée React
- `src/components` : composants réutilisables (`Navbar`, `Footer`, `WhatsAppButton`, `ProductCard`, `ServiceCard`)
- `src/pages` : pages du site (`Home`, `Products`, `Repair`, `TradeIn`, `Tracking`, `Contact`)
- `index.html` : page HTML de base
- `tailwind.config.js` : configuration Tailwind CSS
- `postcss.config.js` : configuration PostCSS

## Installation

```bash
cd eli-business-center
npm install
```

## Exécution en développement

```bash
npm run dev
```

## Compilation pour la production

```bash
npm run build
```

## Notes

- Le site est entièrement statique, sans backend.
- Toutes les conversations client se font via WhatsApp.
- Les données produits et tarifs sont intégrées en dur dans le code.
