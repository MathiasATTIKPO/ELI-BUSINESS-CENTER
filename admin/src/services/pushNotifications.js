import api from './api'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export const isPushSupported = () => {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

const buildAuthConfig = (token) => {
  if (!token) return {}
  return { headers: { Authorization: `Bearer ${token}` } }
}

export const subscribeUserToPush = async (token) => {
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' }
  }

  const vapidResp = await api.get('/api/notifications/vapid-public-key', buildAuthConfig(token))
  const publicKey = vapidResp?.data?.data?.publicKey
  const configured = vapidResp?.data?.data?.configured !== false && !!publicKey
  if (!configured) {
    return { success: false, reason: 'push_not_configured' }
  }

  const permission = await window.Notification.requestPermission()
  if (permission !== 'granted') {
    return { success: false, reason: 'permission_denied' }
  }

  const registration = await navigator.serviceWorker.register('/service-worker.js')
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    await api.post('/api/notifications/subscribe', existingSubscription.toJSON(), buildAuthConfig(token))
    return { success: true, subscription: existingSubscription }
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  await api.post('/api/notifications/subscribe', subscription.toJSON(), buildAuthConfig(token))
  return { success: true, subscription }
}

export const unsubscribeUserFromPush = async (token) => {
  if (!isPushSupported()) return { success: false, reason: 'unsupported' }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) return { success: true }

  const endpoint = subscription.endpoint
  await api.post('/api/notifications/unsubscribe', { endpoint }, buildAuthConfig(token))
  await subscription.unsubscribe()
  return { success: true }
}
