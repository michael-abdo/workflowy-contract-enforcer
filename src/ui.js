/**
 * UI Module - Toast notifications and visual feedback
 *
 * Provides:
 * - Toast notifications for errors and status
 * - Next field prompts
 * - State indicator display
 * - Visual feedback for validation
 */

// Toast container ID
const TOAST_CONTAINER_ID = 'contract-toast-container';
const PROMPT_CONTAINER_ID = 'contract-prompt-container';
const SUGGESTION_CONTAINER_ID = 'contract-suggestion-container';

// Toast types
const TOAST_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info'
};

// State colors
const STATE_COLORS = {
  raw: '#9ca3af',       // Gray
  wanting: '#f59e0b',   // Amber
  planning: '#3b82f6',  // Blue
  implementing: '#8b5cf6', // Purple
  done: '#10b981'       // Green
};

/**
 * Inject CSS styles into the page
 */
function injectStyles() {
  if (document.getElementById('contract-ui-styles')) {
    return; // Already injected
  }

  const styles = document.createElement('style');
  styles.id = 'contract-ui-styles';
  styles.textContent = `
    /* Toast Container */
    #${TOAST_CONTAINER_ID} {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    /* Toast Base */
    .contract-toast {
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .contract-toast.closing {
      animation: slideOut 0.2s ease-in forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    /* Toast Types */
    .contract-toast.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .contract-toast.warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .contract-toast.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .contract-toast.info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    /* Toast Icon */
    .contract-toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    /* Toast Content */
    .contract-toast-content {
      flex: 1;
    }

    .contract-toast-title {
      font-weight: 600;
      margin-bottom: 2px;
    }

    .contract-toast-message {
      opacity: 0.9;
    }

    /* Toast Close Button */
    .contract-toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.5;
      padding: 2px;
      transition: opacity 0.2s;
    }

    .contract-toast-close:hover {
      opacity: 1;
    }

    /* Prompt Container */
    #${PROMPT_CONTAINER_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999998;
      pointer-events: none;
    }

    /* Next Field Prompt - Minimal, just the question */
    .contract-prompt {
      background: rgba(0, 0, 0, 0.75);
      padding: 10px 14px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      pointer-events: auto;
      max-width: 280px;
      color: white;
    }

    .contract-prompt-question {
      line-height: 1.4;
    }

    .contract-prompt-field {
      opacity: 0.6;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    /* State Badge (inline) */
    .contract-state-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      margin-left: 4px;
    }

    /* Suggestion Container */
    #${SUGGESTION_CONTAINER_ID} {
      position: fixed;
      bottom: 90px;
      right: 20px;
      z-index: 999997;
      pointer-events: none;
    }

    /* Suggestion Overlay */
    .contract-suggestion {
      background: rgba(59, 130, 246, 0.95);
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      pointer-events: auto;
      max-width: 320px;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.2s ease-out;
    }

    .contract-suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .contract-suggestion-field {
      opacity: 0.8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .contract-suggestion-shortcut {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
    }

    .contract-suggestion-question {
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 8px;
      opacity: 0.95;
    }

    .contract-suggestion-text {
      font-style: italic;
      opacity: 0.85;
      line-height: 1.5;
      white-space: pre-wrap;
      background: rgba(0, 0, 0, 0.15);
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .contract-suggestion.closing {
      animation: slideOut 0.2s ease-in forwards;
    }

    /* Suggestion Items (numbered) */
    .contract-suggestion-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .contract-suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: rgba(0, 0, 0, 0.15);
      padding: 6px 10px;
      border-radius: 4px;
    }

    .contract-suggestion-key {
      background: rgba(255, 255, 255, 0.25);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-family: monospace;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .contract-suggestion-value {
      font-size: 12px;
      line-height: 1.4;
      opacity: 0.95;
    }

    .contract-suggestion-all {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      margin-top: 4px;
      padding-top: 10px;
    }

    .contract-suggestion-all .contract-suggestion-value {
      font-weight: 600;
    }

    /* Checkbox styles for multi-select */
    .contract-suggestion-item {
      cursor: pointer;
      transition: background 0.15s;
    }

    .contract-suggestion-item:hover {
      background: rgba(0, 0, 0, 0.25);
    }

    .contract-suggestion-item.selected {
      background: rgba(255, 255, 255, 0.15);
    }

    .contract-suggestion-checkbox {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      cursor: pointer;
      accent-color: white;
      flex-shrink: 0;
    }

    /* Insert Selected button */
    .contract-suggestion-actions {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      gap: 8px;
    }

    .contract-suggestion-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .contract-suggestion-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .contract-suggestion-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .contract-suggestion-btn-primary {
      background: rgba(255, 255, 255, 0.3);
      font-weight: 600;
    }
  `;

  document.head.appendChild(styles);
  console.log('[UI] Styles injected');
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container
 */
function getToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Create prompt container if it doesn't exist
 * @returns {HTMLElement} Prompt container
 */
function getPromptContainer() {
  let container = document.getElementById(PROMPT_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = PROMPT_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Create suggestion container if it doesn't exist
 * @returns {HTMLElement} Suggestion container
 */
function getSuggestionContainer() {
  let container = document.getElementById(SUGGESTION_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = SUGGESTION_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

// Store current suggestion state
let currentSuggestion = {
  idea: null,
  field: null,
  text: null,
  items: [],  // Array of individual items for numbered selection
  selectedIndices: new Set()  // Set of selected item indices (0-based)
};

/**
 * Parse suggestion text into individual items
 * @param {string} text - Suggestion text (may be newline-separated)
 * @returns {string[]} Array of individual items
 */
function parseSuggestionItems(text) {
  if (!text) return [];
  // Split by newlines and clean up
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
}

/**
 * Toggle selection of an item by index
 * @param {number} index - 0-based index of the item
 */
function toggleItemSelection(index) {
  if (currentSuggestion.selectedIndices.has(index)) {
    currentSuggestion.selectedIndices.delete(index);
  } else {
    currentSuggestion.selectedIndices.add(index);
  }
  updateSelectionUI();
}

/**
 * Update the UI to reflect current selection state
 */
function updateSelectionUI() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  // Update item selected states
  const items = container.querySelectorAll('.contract-suggestion-item[data-index]');
  items.forEach(item => {
    const index = parseInt(item.dataset.index, 10);
    const checkbox = item.querySelector('.contract-suggestion-checkbox');
    if (currentSuggestion.selectedIndices.has(index)) {
      item.classList.add('selected');
      if (checkbox) checkbox.checked = true;
    } else {
      item.classList.remove('selected');
      if (checkbox) checkbox.checked = false;
    }
  });

  // Update Insert Selected button
  const insertBtn = container.querySelector('.contract-suggestion-btn-insert');
  if (insertBtn) {
    const count = currentSuggestion.selectedIndices.size;
    insertBtn.textContent = count > 0 ? `Insert Selected (${count})` : 'Insert Selected';
    insertBtn.disabled = count === 0;
  }
}

/**
 * Show a combined prompt + suggestion overlay for a field
 * Displays numbered items with Ctrl+1, Ctrl+2, etc. shortcuts
 * Supports click-to-select and multi-select with checkboxes
 * @param {Object} idea - Current idea object
 * @param {string} field - Field name (e.g., 'intent')
 * @param {Object|string} suggestion - Suggestion object {text, items} or legacy string
 */
function showSuggestion(idea, field, suggestion) {
  injectStyles();
  const container = getSuggestionContainer();

  // Handle both new object format and legacy string format
  let suggestionText, items;
  if (typeof suggestion === 'object' && suggestion !== null) {
    suggestionText = suggestion.text;
    // Items from project have {text, id}, fallback templates have null
    items = suggestion.items || parseSuggestionItems(suggestion.text).map(text => ({ text, id: null }));
  } else {
    // Legacy string format
    suggestionText = suggestion;
    items = parseSuggestionItems(suggestion).map(text => ({ text, id: null }));
  }

  // Store current state for acceptance (reset selection)
  // items is now [{text, id}, ...] where id may be null for templates
  currentSuggestion = { idea, field, text: suggestionText, items, selectedIndices: new Set() };

  // Hide the separate prompt since we're combining them
  hideNextField();

  // Clear existing suggestion
  container.innerHTML = '';

  // Get the prompt question for this field
  const prompt = window.ContractIntegrity?.get_field_prompt(field) || `Provide ${field}`;

  const suggestionEl = document.createElement('div');
  suggestionEl.className = 'contract-suggestion';

  // Build numbered items HTML with checkboxes
  let itemsHtml = '';
  items.forEach((item, index) => {
    const num = index + 1;
    const displayText = typeof item === 'object' ? item.text : item;
    itemsHtml += `
      <div class="contract-suggestion-item" data-index="${index}">
        <input type="checkbox" class="contract-suggestion-checkbox" />
        <span class="contract-suggestion-key">Ctrl+${num}</span>
        <span class="contract-suggestion-value">${escapeHtml(displayText)}</span>
      </div>
    `;
  });

  // Add actions row with Insert All and Insert Selected
  const actionsHtml = items.length > 0 ? `
    <div class="contract-suggestion-actions">
      <button class="contract-suggestion-btn contract-suggestion-btn-insert" disabled>Insert Selected</button>
      <button class="contract-suggestion-btn contract-suggestion-btn-primary contract-suggestion-btn-all">Insert All (Ctrl+${items.length + 1})</button>
    </div>
  ` : '';

  suggestionEl.innerHTML = `
    <div class="contract-suggestion-header">
      <div class="contract-suggestion-field">${formatFieldName(field)}</div>
    </div>
    <div class="contract-suggestion-question">${escapeHtml(prompt)}</div>
    <div class="contract-suggestion-items">${itemsHtml}</div>
    ${actionsHtml}
  `;

  container.appendChild(suggestionEl);

  // Attach click handlers to items
  const itemEls = suggestionEl.querySelectorAll('.contract-suggestion-item[data-index]');
  itemEls.forEach(itemEl => {
    itemEl.addEventListener('click', (e) => {
      // Prevent double-toggle if clicking directly on checkbox
      if (e.target.classList.contains('contract-suggestion-checkbox')) {
        e.stopPropagation();
      }
      const index = parseInt(itemEl.dataset.index, 10);
      toggleItemSelection(index);
    });

    // Handle checkbox direct clicks
    const checkbox = itemEl.querySelector('.contract-suggestion-checkbox');
    if (checkbox) {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(itemEl.dataset.index, 10);
        toggleItemSelection(index);
      });
    }
  });

  // Attach click handler to Insert Selected button
  const insertBtn = suggestionEl.querySelector('.contract-suggestion-btn-insert');
  if (insertBtn) {
    insertBtn.addEventListener('click', () => {
      if (window.ContractSuggestions?.acceptSelectedItems) {
        window.ContractSuggestions.acceptSelectedItems();
      }
    });
  }

  // Attach click handler to Insert All button
  const allBtn = suggestionEl.querySelector('.contract-suggestion-btn-all');
  if (allBtn) {
    allBtn.addEventListener('click', () => {
      if (window.ContractSuggestions?.acceptSuggestion) {
        window.ContractSuggestions.acceptSuggestion(null);
      }
    });
  }

  console.log('[UI] Showing', items.length, 'suggestion items for', field);
}

/**
 * Hide the suggestion overlay
 */
function hideSuggestion() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (container) {
    const suggestion = container.querySelector('.contract-suggestion');
    if (suggestion) {
      suggestion.classList.add('closing');
      setTimeout(() => {
        container.innerHTML = '';
      }, 200);
    }
  }
  currentSuggestion = { idea: null, field: null, text: null, items: [], selectedIndices: new Set() };
}

/**
 * Get the current suggestion state
 * @returns {Object} Current suggestion { idea, field, text, items, selectedIndices }
 */
function getCurrentSuggestion() {
  return currentSuggestion;
}

/**
 * Get the currently selected item indices
 * @returns {number[]} Array of selected indices (0-based)
 */
function getSelectedIndices() {
  return Array.from(currentSuggestion.selectedIndices);
}

/**
 * Get icon SVG for toast type
 * @param {string} type - Toast type
 * @returns {string} SVG string
 */
function getToastIcon(type) {
  const icons = {
    error: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`,
    warning: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
    success: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
    info: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
  };

  return icons[type] || icons.info;
}

/**
 * Create a toast notification element
 * @param {string} type - Toast type (error, warning, success, info)
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in ms (0 for no auto-dismiss)
 * @returns {HTMLElement} Toast element
 */
function createToast(type, title, message, duration = 5000) {
  const toast = document.createElement('div');
  toast.className = `contract-toast ${type}`;

  toast.innerHTML = `
    <div class="contract-toast-icon">${getToastIcon(type)}</div>
    <div class="contract-toast-content">
      <div class="contract-toast-title">${escapeHtml(title)}</div>
      <div class="contract-toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="contract-toast-close" title="Close">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </button>
  `;

  // Close button handler
  const closeBtn = toast.querySelector('.contract-toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

/**
 * Dismiss a toast with animation
 * @param {HTMLElement} toast - Toast element
 */
function dismissToast(toast) {
  toast.classList.add('closing');
  setTimeout(() => {
    toast.remove();
  }, 200);
}

/**
 * Show a toast notification
 * @param {string} type - Toast type
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in ms
 */
function showToast(type, title, message, duration = 5000) {
  injectStyles();
  const container = getToastContainer();
  const toast = createToast(type, title, message, duration);
  container.appendChild(toast);
}

/**
 * Show an error toast
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showError(title, message) {
  showToast(TOAST_TYPES.ERROR, title, message, 7000);
}

/**
 * Show a warning toast
 * @param {string} title - Warning title
 * @param {string} message - Warning message
 */
function showWarning(title, message) {
  showToast(TOAST_TYPES.WARNING, title, message, 5000);
}

/**
 * Show a success toast
 * @param {string} title - Success title
 * @param {string} message - Success message
 */
function showSuccess(title, message) {
  showToast(TOAST_TYPES.SUCCESS, title, message, 3000);
}

/**
 * Show an info toast
 * @param {string} title - Info title
 * @param {string} message - Info message
 */
function showInfo(title, message) {
  showToast(TOAST_TYPES.INFO, title, message, 4000);
}

/**
 * Show the next field prompt
 * @param {Object} idea - Idea object
 * @param {Object} validation - Validation result
 */
function showNextField(idea, validation) {
  injectStyles();

  const container = getPromptContainer();

  // Clear existing prompt
  container.innerHTML = '';

  if (!validation.next_field) {
    return; // All fields resolved
  }

  const nextField = validation.next_field;
  const prompt = window.ContractIntegrity?.get_field_prompt(nextField) || `Provide ${nextField}`;

  const promptEl = document.createElement('div');
  promptEl.className = 'contract-prompt';

  // Just the question - pure signal
  promptEl.innerHTML = `
    <div class="contract-prompt-field">${formatFieldName(nextField)}</div>
    <div class="contract-prompt-question">${escapeHtml(prompt)}</div>
  `;

  container.appendChild(promptEl);
}

/**
 * Hide the next field prompt
 */
function hideNextField() {
  const container = document.getElementById(PROMPT_CONTAINER_ID);
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Show validation errors for an idea
 * @param {Object} idea - Idea object
 * @param {Array<string>} errors - Validation errors
 */
function showValidationErrors(idea, errors) {
  if (errors.length === 0) return;

  const title = `Validation Error: ${idea.title}`;
  const message = errors.join('\n');

  showError(title, message);
}

/**
 * Show validation warnings for an idea
 * @param {Object} idea - Idea object
 * @param {Array<string>} warnings - Validation warnings
 */
function showValidationWarnings(idea, warnings) {
  if (warnings.length === 0) return;

  const title = `Warning: ${idea.title}`;
  const message = warnings.join('\n');

  showWarning(title, message);
}

/**
 * Show state change notification
 * @param {Object} idea - Idea object
 * @param {string} oldState - Previous state
 * @param {string} newState - New state
 */
function showStateChange(idea, oldState, newState) {
  const title = idea.title;
  const message = `State: ${oldState || 'none'} → ${newState}`;

  if (newState === 'done') {
    showSuccess(title, message);
  } else {
    showInfo(title, message);
  }
}

/**
 * Block #done tag attempt - show error
 * @param {Object} idea - Idea object
 * @param {string} missingField - The missing required field
 */
function blockDoneTag(idea, missingField) {
  showError(
    'Cannot Mark as Done',
    `"${idea.title}" is missing: ${formatFieldName(missingField)}`
  );
}

/**
 * Format field name for display
 * @param {string} field - Field name (e.g., 'qa_doc')
 * @returns {string} Formatted name (e.g., 'QA Document')
 */
function formatFieldName(field) {
  const names = {
    intent: 'Intent',
    stakeholders: 'Stakeholders',
    owner: 'Owner',
    system_ref: 'System Reference',
    qa_doc: 'QA Document',
    update_set: 'Update Set',
    qa_results: 'QA Results'
  };

  return names[field] || field;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a state badge element
 * @param {string} state - State name
 * @returns {HTMLElement} Badge element
 */
function createStateBadge(state) {
  const badge = document.createElement('span');
  badge.className = 'contract-state-badge';
  badge.style.background = STATE_COLORS[state] || '#6b7280';
  badge.textContent = state.toUpperCase();
  return badge;
}

// Export for use in other modules
window.ContractUI = {
  // Initialization
  injectStyles,

  // Toast notifications
  showToast,
  showError,
  showWarning,
  showSuccess,
  showInfo,

  // Prompts
  showNextField,
  hideNextField,

  // Suggestions
  showSuggestion,
  hideSuggestion,
  getCurrentSuggestion,
  getSelectedIndices,

  // Validation feedback
  showValidationErrors,
  showValidationWarnings,
  showStateChange,
  blockDoneTag,

  // Utilities
  formatFieldName,
  escapeHtml,
  createStateBadge,

  // Constants
  TOAST_TYPES,
  STATE_COLORS
};

console.log('[Contract UI] Loaded');
