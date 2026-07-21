const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const protect = require('../middleware/auth'); // votre middleware d'authentification
const authorize = require('../middleware/authorize'); // à créer si pas déjà fait

// Toutes les routes de paramètres sont protégées et réservées aux admins
router.use(protect);
router.use(authorize('super_admin', 'admin'));

// Paramètres généraux
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Gestion des compétences
router.get('/skills', settingsController.getSkills);
router.post('/skills', settingsController.createSkill);
router.put('/skills/:id', settingsController.updateSkill);
router.delete('/skills/:id', settingsController.deleteSkill);

module.exports = router;