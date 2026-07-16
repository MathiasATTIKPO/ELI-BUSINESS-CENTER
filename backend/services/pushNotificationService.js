const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

let configured = false;

const ensureConfigured = () => {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@elibusiness.com';

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
};

const sendPushToUser = async ({ userId, title, body, data = {} }) => {
  if (!userId) return { sent: 0, skipped: true };
  if (!ensureConfigured()) return { sent: 0, skipped: true, reason: 'vapid_not_configured' };

  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions.length) return { sent: 0, skipped: true, reason: 'no_subscription' };

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    data,
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth,
          }
        },
        payload
      );
      sent += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: sub._id });
      }
    }
  }

  return { sent };
};

module.exports = {
  ensureConfigured,
  sendPushToUser,
};
