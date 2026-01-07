/**
 * Contract Enforcer - Main Entry Point
 *
 * This is the main injected script that initializes the contract enforcement system.
 * It runs in the Workflowy page context with full access to WF globals.
 *
 * Architecture:
 * - Layer 1: Workflowy (data store)
 * - Layer 2: Integrity Layer (this extension)
 * - Modules: Parser, Integrity, Observer, UI
 */

console.log("[Contract Enforcer] Initializing...");

// Wait for all modules to load
function waitForModules(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      // Check for instance (object with init method), not class
      if (window.ContractParser &&
          window.ContractIntegrity &&
          window.ContractObserver &&
          typeof window.ContractObserver.init === 'function' &&
          window.ContractUI) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for modules'));
      } else {
        setTimeout(check, 100);
      }
    }

    check();
  });
}

// Wait for Workflowy to be ready
function waitForWorkflowy(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      if (typeof WF !== 'undefined' && WF.rootItem && WF.rootItem()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for Workflowy'));
      } else {
        setTimeout(check, 200);
      }
    }

    check();
  });
}

// Initialize the contract enforcement system
async function initializeContractEnforcer() {
  try {
    // Wait for dependencies
    await waitForModules();
    console.log("[Contract Enforcer] Modules loaded");

    await waitForWorkflowy();
    console.log("[Contract Enforcer] Workflowy ready");

    // Get references to modules from window (IMPORTANT: use window. to get instances)
    const Parser = window.ContractParser;
    const Integrity = window.ContractIntegrity;
    const Observer = window.ContractObserver;
    const UI = window.ContractUI;

    // Initialize UI styles
    console.log("[Contract Enforcer] Injecting UI styles...");
    UI.injectStyles();

    // Helper to check if we're focused on a specific contract
    const isFocusedOnContract = (nodeId) => {
      const focused = Parser.getFocusedItem();
      return focused && focused.data.id === nodeId;
    };

    // Initialize observer with callbacks
    console.log("[Contract Enforcer] Initializing observer...");
    Observer.init({
      onStateChange: (nodeId, idea, oldState, newState, validation) => {
        console.log(`[Contract Enforcer] State change: ${idea.title} ${oldState} -> ${newState}`);

        // Only show UI if focused on this contract
        if (isFocusedOnContract(nodeId)) {
          UI.showStateChange(idea, oldState, newState);
          UI.showNextField(idea, validation);
        }

        // Log event
        if (window.ContractStorage) {
          window.ContractStorage.logEvent({
            type: 'state_change',
            idea_id: nodeId,
            idea_title: idea.title,
            old_state: oldState,
            new_state: newState
          });
        }
      },

      onValidationError: (nodeId, idea, errors) => {
        console.warn(`[Contract Enforcer] Validation errors for ${idea.title}:`, errors);

        // Only show UI if focused on this contract
        if (isFocusedOnContract(nodeId)) {
          UI.showValidationErrors(idea, errors);
        }

        // Log event
        if (window.ContractStorage) {
          window.ContractStorage.logEvent({
            type: 'validation_error',
            idea_id: nodeId,
            idea_title: idea.title,
            errors: errors
          });
        }
      },

      onContractAdded: (nodeId, idea) => {
        console.log(`[Contract Enforcer] Contract added: ${idea.title}`);

        // Only show UI if focused on this contract
        if (isFocusedOnContract(nodeId)) {
          UI.showInfo('Contract Created', `"${idea.title}" is now a managed idea`);
          const validation = Integrity.validate_idea(Observer.ideaStore, idea);
          UI.showNextField(idea, validation);
        }

        // Log event
        if (window.ContractStorage) {
          window.ContractStorage.logEvent({
            type: 'contract_added',
            idea_id: nodeId,
            idea_title: idea.title
          });
        }
      },

      onContractRemoved: (nodeId, idea) => {
        console.log(`[Contract Enforcer] Contract removed: ${idea?.title || nodeId}`);

        // Only hide if we were focused on this contract
        if (isFocusedOnContract(nodeId)) {
          UI.hideNextField();
        }

        // Log event
        if (window.ContractStorage) {
          window.ContractStorage.logEvent({
            type: 'contract_removed',
            idea_id: nodeId,
            idea_title: idea?.title
          });
        }
      },

      onFieldChange: (nodeId, idea, validation) => {
        // Only show UI if focused on this contract
        if (isFocusedOnContract(nodeId)) {
          UI.showNextField(idea, validation);
        }
      }
    });

    console.log("[Contract Enforcer] Observer initialized");

    // Show initial status
    const contractCount = Observer.getContracts().length;
    if (contractCount > 0) {
      UI.showInfo(
        'Contract Enforcer Active',
        `Tracking ${contractCount} contract${contractCount === 1 ? '' : 's'}`
      );
    }

    // Expose API for debugging and testing
    window.contractEnforcer = {
      // Get all contracts
      getContracts: () => Observer.getContracts(),

      // Get a specific idea
      getIdea: (nodeId) => Observer.getIdea(nodeId),

      // Validate a specific node
      validateNode: (nodeId) => {
        const idea = Observer.getIdea(nodeId);
        if (!idea) return null;
        return Integrity.validate_idea(Observer.ideaStore, idea);
      },

      // Force refresh of all contracts
      refresh: () => {
        Observer.refreshStore();
        Observer.validateAll();
      },

      // Get next field for an idea
      getNextField: (nodeId) => {
        const idea = Observer.getIdea(nodeId);
        if (!idea) return null;
        const validation = Integrity.validate_idea(Observer.ideaStore, idea);
        return {
          field: validation.next_field,
          prompt: Integrity.get_field_prompt(validation.next_field)
        };
      },

      // Manual state derivation
      deriveState: (nodeId) => {
        const idea = Observer.getIdea(nodeId);
        if (!idea) return null;
        const validation = Integrity.validate_idea(Observer.ideaStore, idea);
        return validation.state;
      },

      // Show status
      status: () => {
        const contracts = Observer.getContracts();
        console.log(`[Contract Enforcer] Tracking ${contracts.length} contracts:`);
        for (const [id, idea] of contracts) {
          const validation = Integrity.validate_idea(Observer.ideaStore, idea);
          console.log(`  - ${idea.title} [${validation.state}] next: ${validation.next_field || 'done'}`);
        }
      },

      // Access to modules
      Parser: Parser,
      Integrity: Integrity,
      Observer: Observer,
      UI: UI
    };

    console.log("[Contract Enforcer] Ready! API available at window.contractEnforcer");
    console.log("[Contract Enforcer] Commands:");
    console.log("  contractEnforcer.status()");
    console.log("  contractEnforcer.getContracts()");
    console.log("  contractEnforcer.refresh()");

    // Set up URL change detection for SPA navigation
    setupUrlChangeDetection(Observer);

  } catch (e) {
    console.error("[Contract Enforcer] Initialization failed:", e);
    if (window.ContractUI) {
      window.ContractUI.showError('Initialization Failed', e.message);
    }
  }
}

/**
 * Set up URL change detection for Workflowy SPA navigation
 * @param {Object} observer - ContractObserver instance
 */
function setupUrlChangeDetection(observer) {
  let lastHash = window.location.hash;
  let debounceTimer = null;

  const handleUrlChange = (source) => {
    const currentHash = window.location.hash;

    // Only react if hash actually changed
    if (currentHash !== lastHash) {
      console.log('[Contract Enforcer] URL changed via', source + ':', lastHash, '->', currentHash);
      lastHash = currentHash;

      // Debounce to avoid rapid refreshes during navigation
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        observer.refreshOnNavigation();
      }, 150);
    }
  };

  // Listen for hash changes (primary navigation method in Workflowy)
  window.addEventListener('hashchange', () => handleUrlChange('hashchange'));

  // Also listen for popstate (back/forward buttons)
  window.addEventListener('popstate', () => handleUrlChange('popstate'));

  // Wrap History API to catch pushState/replaceState calls
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;

  history.pushState = function(...args) {
    const result = origPushState.apply(this, args);
    handleUrlChange('pushState');
    return result;
  };

  history.replaceState = function(...args) {
    const result = origReplaceState.apply(this, args);
    handleUrlChange('replaceState');
    return result;
  };

  // Polling fallback - check every 500ms for URL changes that might have been missed
  setInterval(() => {
    const currentHash = window.location.hash;
    if (currentHash !== lastHash) {
      handleUrlChange('poll');
    }
  }, 500);

  console.log('[Contract Enforcer] URL change detection active (hashchange + popstate + History API + polling)');
}

// Legacy wfExplore API (for backwards compatibility)
window.wfExplore = {
  deepExplore: function(itemId) {
    const item = itemId ? WF.getItemById(itemId) : WF.rootItem();
    if (!item) {
      console.log("[WF Explorer] Item not found");
      return null;
    }

    console.log("[WF Explorer] === ITEM DATA ===");
    const data = item.data;
    console.log("All data keys:", Object.keys(data));
    console.log("data.id:", data.id);
    console.log("data.nm (name):", data.nm);
    console.log("data.no (note):", data.no);
    console.log("data.ct (created):", data.ct);
    console.log("data.lm (lastModified):", data.lm);
    console.log("data.cp (completed):", data.cp);
    console.log("data.ch (children):", data.ch);
    console.log("data.metadata:", data.metadata);

    if (data.metadata) {
      console.log("[WF Explorer] === METADATA ===");
      console.log("metadata keys:", Object.keys(data.metadata));
      console.log("metadata.mirror:", data.metadata.mirror);
    }

    return { item, data };
  },

  findMirror: function() {
    const diamondEl = document.querySelector('.mirrorDiamondIcon');
    if (diamondEl) {
      const projectEl = diamondEl.closest('[projectid]');
      if (projectEl) {
        const id = projectEl.getAttribute('projectid');
        console.log("[WF Explorer] Found mirror (diamond):", id);
        return this.deepExplore(id);
      }
    }

    const mirrorEl = document.querySelector('.hasMirrors');
    if (mirrorEl) {
      const id = mirrorEl.getAttribute('projectid');
      console.log("[WF Explorer] Found node with mirrors:", id);
      return this.deepExplore(id);
    }

    console.log("[WF Explorer] No mirror found in DOM");
    return null;
  },

  getAllDataKeys: function() {
    const allKeys = new Set();
    const metadataKeys = new Set();
    const nodes = document.querySelectorAll('[projectid]');

    Array.from(nodes).slice(0, 50).forEach(el => {
      const id = el.getAttribute('projectid');
      if (id === 'None') return;
      try {
        const item = WF.getItemById(id);
        if (item && item.data) {
          Object.keys(item.data).forEach(k => allKeys.add(k));
          if (item.data.metadata) {
            Object.keys(item.data.metadata).forEach(k => metadataKeys.add(k));
          }
        }
      } catch(e) {}
    });

    console.log("[WF Explorer] All data keys:", Array.from(allKeys));
    console.log("[WF Explorer] All metadata keys:", Array.from(metadataKeys));
    return { dataKeys: Array.from(allKeys), metadataKeys: Array.from(metadataKeys) };
  },

  getChildren: function(itemId) {
    const item = itemId ? WF.getItemById(itemId) : WF.rootItem();
    if (!item) return null;

    console.log("[WF Explorer] item.data.ch:", item.data.ch);

    if (item.data.ch && item.data.ch.length > 0) {
      const firstChild = item.data.ch[0];
      console.log("[WF Explorer] First child:", firstChild);
      console.log("[WF Explorer] First child data keys:", Object.keys(firstChild));
    }

    return item.data.ch;
  },

  exploreMirror: function(itemId) {
    let item = itemId ? WF.getItemById(itemId) : null;
    if (!item) {
      const diamondEl = document.querySelector('.mirrorDiamondIcon');
      if (diamondEl) {
        const projectEl = diamondEl.closest('[projectid]');
        if (projectEl) {
          item = WF.getItemById(projectEl.getAttribute('projectid'));
        }
      }
    }
    if (!item) {
      console.log("[WF Explorer] No mirror found");
      return null;
    }

    const data = item.data;
    console.log("[WF Explorer] === MIRROR EXPLORATION ===");
    console.log("Item ID:", data.id);
    console.log("Name:", data.nm);

    if (data.metadata && data.metadata.mirror) {
      console.log("[WF Explorer] metadata.mirror:", data.metadata.mirror);
      if (data.metadata.mirror.mirrorRootIds) {
        const rootIds = data.metadata.mirror.mirrorRootIds;
        console.log("Mirror root IDs:", rootIds);
        Object.keys(rootIds).forEach(key => {
          console.log(`  Root ID [${key}]:`, rootIds[key]);
          const original = WF.getItemById(key);
          if (original) {
            console.log(`  Original item name:`, original.data.nm);
          }
        });
      }
    }

    if (data.mirroringMetadata) {
      console.log("[WF Explorer] mirroringMetadata:", data.mirroringMetadata);
    }

    if (data._cachedOriginalItem) {
      console.log("[WF Explorer] _cachedOriginalItem:", data._cachedOriginalItem);
    }

    if (data.reactToOriginalMarkChanged) {
      console.log("[WF Explorer] This IS a mirror (has reactToOriginal methods)");
    }

    return data;
  },

  checkTimestamps: function(itemId) {
    const item = itemId ? WF.getItemById(itemId) : WF.rootItem().data.ch[0];
    const data = item.data || item;

    console.log("[WF Explorer] === TIMESTAMPS ===");
    console.log("Item:", data.nm);
    console.log("ct (created?):", data.ct);
    console.log("lm (lastModified):", data.lm);
    console.log("cb:", data.cb);

    if (data.ct) {
      console.log("ct as epoch:", new Date(data.ct * 1000));
    }
    if (data.lm) {
      console.log("lm as epoch:", new Date(data.lm * 1000));
    }

    return { ct: data.ct, lm: data.lm, cb: data.cb };
  }
};

// Start initialization
initializeContractEnforcer();
