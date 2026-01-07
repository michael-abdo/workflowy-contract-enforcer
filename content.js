/**
 * Content Script - Injects contract enforcement into Workflowy page context
 *
 * This script:
 * 1. Injects all module scripts into the page context
 * 2. Provides message bridge between page and extension
 * 3. Handles storage operations for event log
 */

console.log("[Contract Enforcer] Content script loading...");

// Scripts to inject (in order - storage first, then modules, then main entry)
const SCRIPTS_TO_INJECT = [
  'src/storage.js',   // Storage API bridge (must be first)
  'src/parser.js',
  'src/integrity.js',
  'src/ui.js',
  'src/observer.js',
  'injected.js'       // Main entry point - must be last
];

/**
 * Inject a script into the page context
 * @param {string} path - Script path relative to extension root
 * @returns {Promise} Resolves when script is loaded
 */
function injectScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(path);

    script.onload = function() {
      console.log(`[Contract Enforcer] Loaded: ${path}`);
      this.remove(); // Clean up after loading
      resolve();
    };

    script.onerror = function(e) {
      console.error(`[Contract Enforcer] Failed to load: ${path}`, e);
      reject(e);
    };

    (document.head || document.documentElement).appendChild(script);
  });
}

/**
 * Inject all scripts in sequence
 */
async function injectAllScripts() {
  console.log("[Contract Enforcer] Injecting scripts...");

  for (const scriptPath of SCRIPTS_TO_INJECT) {
    try {
      await injectScript(scriptPath);
    } catch (e) {
      console.error(`[Contract Enforcer] Failed to inject ${scriptPath}:`, e);
      // Continue with other scripts
    }
  }

  console.log("[Contract Enforcer] All scripts injected");
}

/**
 * Handle messages from the page context
 */
window.addEventListener('message', async (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  if (!event.data || !event.data.type) return;

  const { type, payload } = event.data;

  // Handle contract enforcer messages
  if (type === 'CONTRACT_ENFORCER_STORAGE_SET') {
    try {
      await chrome.storage.local.set({ [payload.key]: payload.value });
      window.postMessage({
        type: 'CONTRACT_ENFORCER_STORAGE_RESULT',
        payload: { success: true, key: payload.key }
      }, '*');
    } catch (e) {
      window.postMessage({
        type: 'CONTRACT_ENFORCER_STORAGE_RESULT',
        payload: { success: false, error: e.message }
      }, '*');
    }
  }

  if (type === 'CONTRACT_ENFORCER_STORAGE_GET') {
    try {
      const result = await chrome.storage.local.get(payload.key);
      window.postMessage({
        type: 'CONTRACT_ENFORCER_STORAGE_RESULT',
        payload: { success: true, key: payload.key, value: result[payload.key] }
      }, '*');
    } catch (e) {
      window.postMessage({
        type: 'CONTRACT_ENFORCER_STORAGE_RESULT',
        payload: { success: false, error: e.message }
      }, '*');
    }
  }

  if (type === 'CONTRACT_ENFORCER_LOG_EVENT') {
    // Store event in local storage
    try {
      const result = await chrome.storage.local.get('contract_events');
      const events = result.contract_events || [];
      events.push({
        ...payload,
        timestamp: Date.now()
      });

      // Keep last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      await chrome.storage.local.set({ contract_events: events });
    } catch (e) {
      console.error('[Contract Enforcer] Failed to log event:', e);
    }
  }
});

// Initialize - inject all scripts
injectAllScripts();

console.log("[Contract Enforcer] Content script ready");
