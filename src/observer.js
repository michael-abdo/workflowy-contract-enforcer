/**
 * Observer Module - Real-time DOM observation for contract enforcement
 *
 * Watches for:
 * - #contract tag additions/removals
 * - Contract field edits
 * - State tag changes
 *
 * Triggers:
 * - State derivation on field changes
 * - Auto-update of state tags
 * - Validation error display
 */

console.log('[Contract Observer] Script starting to execute...');

/**
 * Debounce utility - batch rapid changes
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId = null;

  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle utility - limit execution rate
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum time between executions in ms
 * @returns {Function} Throttled function
 */
function throttle(fn, limit) {
  let lastRun = 0;
  let timeoutId = null;

  return function(...args) {
    const now = Date.now();

    if (now - lastRun >= limit) {
      fn.apply(this, args);
      lastRun = now;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastRun = Date.now();
      }, limit - (now - lastRun));
    }
  };
}

console.log('[Contract Observer] About to define ContractObserver class...');

/**
 * ContractObserver - Main observer class
 */
class ContractObserver {
  constructor() {
    console.log('[Contract Observer] Constructor called');
    this.observer = null;
    this.ideaStore = new Map();
    this.trackedNodes = new Set(); // IDs of nodes we're watching
    this.pendingValidations = new Map(); // nodeId -> timeout
    this.stateTimestamps = new Map(); // nodeId -> timestamp of last state change
    this.isInitialized = false;
    this.callbacks = {
      onStateChange: null,
      onValidationError: null,
      onValidationWarning: null, // New callback for warnings
      onContractAdded: null,
      onContractRemoved: null,
      onFieldChange: null
    };

    // Debounced handlers
    this.handleMutationDebounced = debounce(this.processMutations.bind(this), 100);
    this.validateNodeThrottled = throttle(this.validateNode.bind(this), 200);
  }

  /**
   * Initialize the observer
   * @param {Object} callbacks - Event callbacks
   */
  async init(callbacks = {}) {
    try {
      if (this.isInitialized) {
        console.warn('[Observer] Already initialized');
        return;
      }

      console.log('[Observer] Starting initialization...');
      this.callbacks = { ...this.callbacks, ...callbacks };

      // Load state timestamps from storage
      console.log('[Observer] Loading state timestamps...');
      await this.loadStateTimestamps();

      // Build initial store
      console.log('[Observer] Building initial store...');
      this.refreshStore();

      // Start observing
      console.log('[Observer] Starting DOM observation...');
      this.startObserving();

      this.isInitialized = true;
      console.log('[Observer] Initialized with', this.ideaStore.size, 'contracts');
    } catch (e) {
      console.error('[Observer] Initialization failed:', e);
      throw e;
    }
  }

  /**
   * Load state timestamps from chrome.storage
   */
  async loadStateTimestamps() {
    try {
      if (!window.ContractStorage) {
        console.warn('[Observer] ContractStorage not available');
        return;
      }

      const timestamps = await window.ContractStorage.get('state_timestamps');
      if (timestamps && typeof timestamps === 'object') {
        this.stateTimestamps = new Map(Object.entries(timestamps));
        console.log('[Observer] Loaded', this.stateTimestamps.size, 'state timestamps');
      }
    } catch (e) {
      console.warn('[Observer] Failed to load state timestamps:', e);
    }
  }

  /**
   * Save state timestamp to chrome.storage
   * @param {string} nodeId - Node ID
   * @param {number} timestamp - Timestamp in ms
   */
  async saveStateTimestamp(nodeId, timestamp) {
    this.stateTimestamps.set(nodeId, timestamp);

    try {
      if (!window.ContractStorage) {
        return;
      }

      // Convert Map to object for storage
      const timestampsObj = Object.fromEntries(this.stateTimestamps);
      await window.ContractStorage.set('state_timestamps', timestampsObj);
    } catch (e) {
      console.warn('[Observer] Failed to save state timestamp:', e);
    }
  }

  /**
   * Get state timestamp for a node
   * @param {string} nodeId - Node ID
   * @returns {number|null} Timestamp or null
   */
  getStateTimestamp(nodeId) {
    return this.stateTimestamps.get(nodeId) || null;
  }

  /**
   * Refresh the idea store from current DOM state
   */
  refreshStore() {
    try {
      if (!window.ContractParser) {
        console.error('[Observer] ContractParser not loaded');
        return;
      }

      console.log('[Observer] Calling ContractParser.buildIdeaStore()...');
      this.ideaStore = ContractParser.buildIdeaStore();
      this.trackedNodes = new Set(this.ideaStore.keys());

      console.log('[Observer] Store refreshed:', this.ideaStore.size, 'contracts');
    } catch (e) {
      console.error('[Observer] refreshStore failed:', e);
      throw e;
    }
  }

  /**
   * Start the MutationObserver
   */
  startObserving() {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Find the main content area
    const contentArea = document.querySelector('.page') ||
                        document.querySelector('.content') ||
                        document.body;

    this.observer = new MutationObserver((mutations) => {
      this.handleMutationDebounced(mutations);
    });

    this.observer.observe(contentArea, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeFilter: ['class', 'projectid']
    });

    console.log('[Observer] Started observing DOM');
  }

  /**
   * Stop the observer
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
    console.log('[Observer] Stopped');
  }

  /**
   * Process collected mutations
   * @param {Array} mutations - MutationObserver mutations
   */
  processMutations(mutations) {
    const affectedNodeIds = new Set();
    let needsStoreRefresh = false;

    for (const mutation of mutations) {
      // Check for new/removed nodes
      if (mutation.type === 'childList') {
        // Check added nodes for #contract tags
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const projectId = this.findProjectId(node);
            if (projectId) {
              affectedNodeIds.add(projectId);
              needsStoreRefresh = true;
            }
          }
        }

        // Check removed nodes
        for (const node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const projectId = this.findProjectId(node);
            if (projectId && this.trackedNodes.has(projectId)) {
              needsStoreRefresh = true;
            }
          }
        }
      }

      // Check for text/character changes (field edits)
      if (mutation.type === 'characterData') {
        const projectEl = mutation.target.parentElement?.closest('[projectid]');
        if (projectEl) {
          const projectId = projectEl.getAttribute('projectid');
          if (projectId) {
            affectedNodeIds.add(projectId);
          }
        }
      }

      // Check for class changes (tag additions/removals)
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList?.contains('contentTag')) {
          const projectEl = target.closest('[projectid]');
          if (projectEl) {
            const projectId = projectEl.getAttribute('projectid');
            if (projectId) {
              affectedNodeIds.add(projectId);
              needsStoreRefresh = true;
            }
          }
        }
      }
    }

    // Refresh store if contract structure changed
    if (needsStoreRefresh) {
      this.refreshStore();
    }

    // Validate affected nodes
    for (const nodeId of affectedNodeIds) {
      this.scheduleValidation(nodeId);
    }
  }

  /**
   * Find the project ID from a DOM element
   * @param {Element} el - DOM element
   * @returns {string|null} Project ID or null
   */
  findProjectId(el) {
    if (!el || !el.closest) return null;

    const projectEl = el.closest('[projectid]') || el.querySelector?.('[projectid]');
    if (projectEl) {
      return projectEl.getAttribute('projectid');
    }

    return null;
  }

  /**
   * Schedule a validation for a node (debounced)
   * @param {string} nodeId - Node ID to validate
   */
  scheduleValidation(nodeId) {
    // Clear existing timeout for this node
    if (this.pendingValidations.has(nodeId)) {
      clearTimeout(this.pendingValidations.get(nodeId));
    }

    // Schedule new validation
    const timeoutId = setTimeout(() => {
      this.validateNode(nodeId);
      this.pendingValidations.delete(nodeId);
    }, 150);

    this.pendingValidations.set(nodeId, timeoutId);
  }

  /**
   * Validate a specific node and update its state
   * @param {string} nodeId - Node ID to validate
   */
  validateNode(nodeId) {
    if (!window.ContractParser || !window.ContractIntegrity) {
      console.error('[Observer] Parser or Integrity not loaded');
      return;
    }

    // Get the item
    const item = ContractParser.getItemById(nodeId);
    if (!item) return;

    // Check if it's a contract node
    const name = item.data.nm || '';
    if (!ContractParser.hasTag(name, ContractParser.CONTRACT_TAG)) {
      // Node lost #contract tag
      if (this.trackedNodes.has(nodeId)) {
        this.handleContractRemoved(nodeId);
      }
      return;
    }

    // Build idea and validate
    const idea = ContractParser.buildIdea(item);
    if (!idea) return;

    // Load state_changed_at from storage
    idea.state_changed_at = this.getStateTimestamp(nodeId);

    // Check if this is a new contract
    if (!this.trackedNodes.has(nodeId)) {
      this.handleContractAdded(nodeId, idea);
    }

    // Update store
    this.ideaStore.set(nodeId, idea);
    this.trackedNodes.add(nodeId);

    // Validate
    const validation = ContractIntegrity.validate_idea(this.ideaStore, idea);

    // Determine if state changed
    const oldState = idea.current_state_tag;
    const newState = validation.state;

    if (oldState !== newState) {
      this.handleStateChange(nodeId, idea, oldState, newState, validation);
    }

    // Check for validation errors
    if (validation.errors.length > 0) {
      this.handleValidationError(nodeId, idea, validation.errors);
    }

    // Check for validation warnings
    if (validation.warnings && validation.warnings.length > 0) {
      this.handleValidationWarning(nodeId, idea, validation.warnings);
    }

    // Trigger field change callback
    if (this.callbacks.onFieldChange) {
      this.callbacks.onFieldChange(nodeId, idea, validation);
    }
  }

  /**
   * Handle a new contract being added
   * @param {string} nodeId
   * @param {Object} idea
   */
  handleContractAdded(nodeId, idea) {
    console.log('[Observer] Contract added:', nodeId, idea.title);

    if (this.callbacks.onContractAdded) {
      this.callbacks.onContractAdded(nodeId, idea);
    }
  }

  /**
   * Handle a contract being removed
   * @param {string} nodeId
   */
  handleContractRemoved(nodeId) {
    const idea = this.ideaStore.get(nodeId);
    console.log('[Observer] Contract removed:', nodeId, idea?.title);

    this.ideaStore.delete(nodeId);
    this.trackedNodes.delete(nodeId);

    if (this.callbacks.onContractRemoved) {
      this.callbacks.onContractRemoved(nodeId, idea);
    }
  }

  /**
   * Handle state change - update state tag in Workflowy
   * @param {string} nodeId
   * @param {Object} idea
   * @param {string} oldState
   * @param {string} newState
   * @param {Object} validation
   */
  handleStateChange(nodeId, idea, oldState, newState, validation) {
    console.log('[Observer] State change:', nodeId, oldState, '->', newState);

    // Record timestamp of state change
    const timestamp = Date.now();
    this.saveStateTimestamp(nodeId, timestamp);

    // Update idea with timestamp
    idea.state_changed_at = timestamp;
    this.ideaStore.set(nodeId, idea);

    // Update the state tag in Workflowy
    this.updateStateTag(nodeId, idea, newState);

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(nodeId, idea, oldState, newState, validation);
    }
  }

  /**
   * Handle validation errors
   * @param {string} nodeId
   * @param {Object} idea
   * @param {Array} errors
   */
  handleValidationError(nodeId, idea, errors) {
    console.warn('[Observer] Validation errors for', nodeId, ':', errors);

    if (this.callbacks.onValidationError) {
      this.callbacks.onValidationError(nodeId, idea, errors);
    }
  }

  /**
   * Handle validation warnings
   * @param {string} nodeId
   * @param {Object} idea
   * @param {Array} warnings
   */
  handleValidationWarning(nodeId, idea, warnings) {
    console.warn('[Observer] Validation warnings for', nodeId, ':', warnings);

    if (this.callbacks.onValidationWarning) {
      this.callbacks.onValidationWarning(nodeId, idea, warnings);
    }
  }

  /**
   * Update the state tag on a Workflowy node
   * @param {string} nodeId
   * @param {Object} idea
   * @param {string} newState
   */
  updateStateTag(nodeId, idea, newState) {
    const item = ContractParser.getItemById(nodeId);
    if (!item || !item.data) return;

    const currentName = item.data.nm || '';
    const stateTags = ContractParser.STATE_TAGS;
    const newTag = `#${newState}`;

    // Build new name: remove old state tags, add new one
    let newName = currentName;

    // Remove existing state tags
    for (const stateTag of stateTags) {
      // Handle both HTML tag format and plain text
      const tagRegex = new RegExp(`<span[^>]*class="[^"]*contentTag[^"]*"[^>]*>${stateTag}</span>`, 'gi');
      newName = newName.replace(tagRegex, '');
      // Also remove plain text version
      newName = newName.replace(new RegExp(`\\s*${stateTag}\\b`, 'gi'), '');
    }

    // Clean up extra spaces
    newName = newName.replace(/\s+/g, ' ').trim();

    // Add new state tag (before #contract tag if possible)
    const contractTagIndex = newName.toLowerCase().indexOf('#contract');
    if (contractTagIndex !== -1) {
      newName = newName.slice(0, contractTagIndex) + newTag + ' ' + newName.slice(contractTagIndex);
    } else {
      newName = newName + ' ' + newTag;
    }

    // Update the node name using Workflowy's internal API
    try {
      if (typeof WF !== 'undefined' && WF.setItemName) {
        WF.setItemName(item, newName);
        console.log('[Observer] Updated state tag to', newTag);
      } else {
        console.warn('[Observer] WF.setItemName not available');
      }
    } catch (e) {
      console.error('[Observer] Error updating state tag:', e);
    }
  }

  /**
   * Block #done tag if QA Results missing
   * @param {string} nodeId
   * @param {Object} idea
   * @returns {boolean} True if blocked
   */
  blockDoneTag(nodeId, idea) {
    if (!window.ContractIntegrity) return false;

    const validation = ContractIntegrity.validate_idea(this.ideaStore, idea);

    if (validation.state !== 'done') {
      // Cannot mark as done
      const missing = validation.next_field;
      console.warn('[Observer] Cannot mark as done. Missing:', missing);

      if (this.callbacks.onValidationError) {
        this.callbacks.onValidationError(nodeId, idea, [
          `Cannot mark as done. Missing: ${missing}`
        ]);
      }

      return true; // Blocked
    }

    return false; // Allowed
  }

  /**
   * Detect if user is trying to add #done tag
   * @param {string} nodeId
   * @param {string} oldName
   * @param {string} newName
   * @returns {boolean} True if adding #done
   */
  detectDoneTagAddition(nodeId, oldName, newName) {
    const hadDone = ContractParser.hasTag(oldName, '#done');
    const hasDone = ContractParser.hasTag(newName, '#done');

    return !hadDone && hasDone;
  }

  /**
   * Get all tracked contracts
   * @returns {Array} Array of [nodeId, idea] pairs
   */
  getContracts() {
    return Array.from(this.ideaStore.entries());
  }

  /**
   * Get a specific idea by ID
   * @param {string} nodeId
   * @returns {Object|null}
   */
  getIdea(nodeId) {
    return this.ideaStore.get(nodeId) || null;
  }

  /**
   * Force validation of all contracts
   */
  validateAll() {
    for (const nodeId of this.trackedNodes) {
      this.validateNode(nodeId);
    }
  }

  /**
   * Handle navigation (URL change) - refresh store and update UI
   */
  refreshOnNavigation() {
    console.log('[Observer] Navigation detected, refreshing...');

    // Hide prompt immediately
    if (window.ContractUI) {
      window.ContractUI.hideNextField();
    }

    // Refresh store (for internal tracking)
    this.refreshStore();

    // Only show prompt if we're in a contract context (focused on contract or its descendant)
    this.checkContractContext();

    console.log('[Observer] Navigation refresh complete');
  }

  /**
   * Check if currently zoomed into a descendant of a contract
   * If so, show the prompt for that contract
   */
  checkContractContext() {
    if (!window.ContractParser || !window.ContractIntegrity) return;

    const contractContext = window.ContractParser.getContractContext();

    if (contractContext) {
      console.log('[Observer] Inside contract context:', contractContext.data.nm);

      // Build idea for the contract ancestor
      const idea = window.ContractParser.buildIdea(contractContext);
      if (idea) {
        // Add to store temporarily
        this.ideaStore.set(idea.id, idea);
        this.trackedNodes.add(idea.id);

        // Validate and show prompt
        const validation = window.ContractIntegrity.validate_idea(this.ideaStore, idea);
        if (window.ContractUI) {
          window.ContractUI.showNextField(idea, validation);
        }
      }
    }
  }
}

// Create singleton instance
try {
  console.log('[Contract Observer] Creating singleton instance...');
  const contractObserver = new ContractObserver();
  console.log('[Contract Observer] Instance created:', contractObserver);
  console.log('[Contract Observer] Instance has init:', typeof contractObserver.init);
  console.log('[Contract Observer] Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(contractObserver)));

  // Export for use in other modules
  window.ContractObserver = contractObserver;
  window.ContractObserverClass = ContractObserver;

  console.log('[Contract Observer] Assigned to window.ContractObserver');
  console.log('[Contract Observer] window.ContractObserver.init type:', typeof window.ContractObserver.init);
} catch (e) {
  console.error('[Contract Observer] Error creating singleton:', e);
}

// Utility exports
window.ContractUtils = {
  debounce,
  throttle
};

console.log('[Contract Observer] Loaded, window.ContractObserver:', window.ContractObserver);
console.log('[Contract Observer] Final check - init type:', typeof window.ContractObserver?.init);
