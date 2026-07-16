const express = require('express');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.json({
      success: false,
      data: { publicKey: null, configured: false },
      message: 'VAPID public key not configured.'
    });
  }

  return res.json({ success: true, data: { publicKey, configured: true }, message: 'VAPID public key.' });
});

router.use(auth);

router.get('/', adminController.getNotifications);

router.put('/:id/read', adminController.markNotificationRead);

router.put('/read-all', adminController.markAllNotificationsRead);

router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, data: null, message: 'Subscription invalide.' });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint },
      {
        userId: req.user.id,
        role: req.user.role,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: subscription, message: 'Push subscription enregistrée.' });
  } catch (error) {
    console.error('Erreur notifications.subscribe:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({ success: false, data: null, message: 'Endpoint requis.' });
    }

    await PushSubscription.deleteOne({ userId: req.user.id, endpoint });
    res.json({ success: true, data: null, message: 'Push subscription supprimée.' });
  } catch (error) {
    console.error('Erreur notifications.unsubscribe:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
});

module.exports = router;
