const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: products, message: 'Liste des produits actifs.' });
  } catch (error) {
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
