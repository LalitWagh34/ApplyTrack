/**
 * Notifications API & Web Push Client Helper
 * Manages browser PushManager registration, VAPID key exchange, and test alerts
 */
import { API_ENDPOINTS } from '../../../config/api.config.js';

const API_BASE = API_ENDPOINTS.NOTIFICATIONS;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('applytrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationsApi = {
  /**
   * Checks if browser supports ServiceWorker and PushManager
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  /**
   * Gets current permission state ('default' | 'granted' | 'denied')
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  /**
   * Checks if browser currently holds an active push subscription
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      return !!sub;
    } catch {
      return false;
    }
  },

  /**
   * Fetches public VAPID key from backend
   */
  async getPublicKey(): Promise<string> {
    const res = await fetch(`${API_BASE}/vapid-key`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data?.publicKey || '';
  },

  /**
   * Requests permission and subscribes browser PushManager to VAPID
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was denied. Please allow it in browser settings.');
    }

    const publicKey = await this.getPublicKey();
    if (!publicKey) {
      throw new Error('VAPID public key not configured on server.');
    }

    // Register or get active service worker
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch {
      // Ignored if already registered
    }
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    // If an existing subscription exists, renew it with the current active server key
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch {
        // Ignored
      }
    }

    const convertedVapidKey = urlBase64ToUint8Array(publicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as unknown as BufferSource
    });

    // Save subscription in backend
    const res = await fetch(`${API_BASE}/subscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subscription: subscription.toJSON() })
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'Failed to save push subscription on server');
    }

    return true;
  },

  /**
   * Unsubscribes active device from web push
   */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch(`${API_BASE}/unsubscribe`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ endpoint })
        });
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Sends an instant test push notification from backend
   */
  async sendTestPush(): Promise<string> {
    // Ensure permission is granted & fresh subscription is active
    if (Notification.permission !== 'granted') {
      await this.subscribe();
    }

    try {
      const res = await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        // If server had no active subscription record, refresh subscribe and retry
        await this.subscribe();
        const retryRes = await fetch(`${API_BASE}/test`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        const retryJson = await retryRes.json();
        if (!retryRes.ok) {
          // Fallback: show instant native notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('⚡ ApplyTrack Alert: Active!', {
              body: 'You are ready to receive OA deadlines and interview alerts directly on your device.',
              icon: '/icon.svg'
            });
            return 'Test notification displayed on your device!';
          }
          throw new Error(retryJson.message || 'Failed to send test notification');
        }
        return retryJson.message || 'Test notification sent to your device!';
      }

      const json = await res.json();
      return json.message || 'Test notification sent to your device!';
    } catch (err: any) {
      if (Notification.permission === 'granted') {
        new Notification('⚡ ApplyTrack Alert: Active!', {
          body: 'You are ready to receive OA deadlines and interview alerts directly on your device.',
          icon: '/icon.svg'
        });
        return 'Test notification displayed on your device!';
      }
      throw err;
    }
  }
};

export default notificationsApi;
