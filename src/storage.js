/**
 * Storage API Bridge - Exposes chrome.storage to page context via message passing
 */

window.ContractStorage = {
  async set(key, value) {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        if (event.data.type === 'CONTRACT_ENFORCER_STORAGE_RESULT' &&
            event.data.payload.key === key) {
          window.removeEventListener('message', handler);
          if (event.data.payload.success) {
            resolve();
          } else {
            reject(new Error(event.data.payload.error));
          }
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({
        type: 'CONTRACT_ENFORCER_STORAGE_SET',
        payload: { key, value }
      }, '*');
    });
  },

  async get(key) {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        if (event.data.type === 'CONTRACT_ENFORCER_STORAGE_RESULT' &&
            event.data.payload.key === key) {
          window.removeEventListener('message', handler);
          if (event.data.payload.success) {
            resolve(event.data.payload.value);
          } else {
            reject(new Error(event.data.payload.error));
          }
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({
        type: 'CONTRACT_ENFORCER_STORAGE_GET',
        payload: { key }
      }, '*');
    });
  },

  logEvent(eventData) {
    window.postMessage({
      type: 'CONTRACT_ENFORCER_LOG_EVENT',
      payload: eventData
    }, '*');
  }
};

console.log('[Contract Storage] API loaded');
