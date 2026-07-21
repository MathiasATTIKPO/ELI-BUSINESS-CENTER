const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

// Import des middlewares
const auth = require('../middleware/auth');          // middleware d'authentification (existant)
const authorize = require('../middleware/authorize'); // middleware d'autorisation (nouveau)

// Appliquer l'authentification à toutes les routes de compétences
router.use(auth);

// Appliquer l'autorisation : seuls les rôles 'super_admin', 'admin', 'commercial_manager' sont autorisés
router.use(authorize('super_admin', 'admin', 'commercial_manager'));

// Routes
router.route('/')
  .get(skillController.getAllSkills)
  .post(skillController.createSkill);

router.route('/:id')
  .get(skillController.getSkillById)
  .put(skillController.updateSkill)
  .delete(skillController.deleteSkill);

module.exports = router;