const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// ---------- Fonctions existantes ----------
exports.getProducts = async (req, res) => {
  try {
    console.log('📦 Récupération des produits...');
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    console.log(`✅ ${products.length} produits trouvés`);
    res.json({ success: true, data: products, message: 'Liste des produits actifs.' });
  } catch (error) {
    console.error('❌ Erreur getProducts :', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: 'Produit introuvable.' });
    }
    res.json({ success: true, data: product, message: 'Détail du produit.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// ---------- NOUVELLES FONCTIONS ----------
// Créer un produit avec plusieurs photos
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, price, stock, active } = req.body;

    // Récupération des URLs des fichiers uploadés (champ "photos")
    const photoUrls = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    const newProduct = new Product({
      name,
      brand,
      price,
      stock: stock || 1,
      active: active !== undefined ? active : true,
      photos: photoUrls
    });

    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct, message: 'Produit créé avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Mettre à jour un produit (ajout/suppression de photos)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: 'Produit introuvable.' });
    }

    // Mise à jour des champs texte
    const { name, brand, price, stock, active } = req.body;
    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (price) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (active !== undefined) product.active = active;

    // --- Gestion des photos ---

    // 1. Ajout de nouvelles photos (si des fichiers ont été uploadés)
    if (req.files && req.files.length > 0) {
      const newUrls = req.files.map(file => `/uploads/products/${file.filename}`);
      product.photos = [...product.photos, ...newUrls];
    }

    // 2. Suppression de photos existantes (si fourni via "removePhotos")
    if (req.body.removePhotos) {
      try {
        const indicesToRemove = JSON.parse(req.body.removePhotos); // ex: [0, 2]
        // Récupérer les URLs à supprimer
        const urlsToRemove = indicesToRemove.map(index => product.photos[index]).filter(Boolean);
        // Supprimer les fichiers physiques
        urlsToRemove.forEach(url => {
          const filePath = path.join(__dirname, '..', url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        // Filtrer le tableau des photos
        product.photos = product.photos.filter((_, index) => !indicesToRemove.includes(index));
      } catch (e) {
        return res.status(400).json({ success: false, data: null, message: 'Format invalide pour removePhotos' });
      }
    }

    await product.save();
    res.json({ success: true, data: product, message: 'Produit mis à jour avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Supprimer un produit (supprime également les fichiers physiques)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: 'Produit introuvable.' });
    }

    // Supprimer les fichiers photos associés
    if (product.photos && product.photos.length > 0) {
      product.photos.forEach(url => {
        const filePath = path.join(__dirname, '..', url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: 'Produit supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};