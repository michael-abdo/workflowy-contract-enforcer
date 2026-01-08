/**
 * Suggestions Module - Keyboard handling and suggestion acceptance
 *
 * Provides:
 * - Keyboard listener for Cmd+` to accept suggestions
 * - Logic to insert suggestion text into Workflowy nodes
 * - Field node detection
 */

console.log('[Contract Suggestions] Script loading...');

/**
 * Find the current field node based on the active suggestion
 * @param {Object} idea - The idea object
 * @param {string} field - The field name to find
 * @returns {Object|null} The Workflowy item for the field, or null
 */
function findFieldNode(idea, field) {
  if (!idea || !field) return null;
  if (!window.ContractParser) {
    console.warn('[Suggestions] ContractParser not available');
    return null;
  }

  // Get the contract item
  const contractItem = window.ContractParser.getItemById(idea.id);
  if (!contractItem) {
    console.warn('[Suggestions] Contract item not found:', idea.id);
    return null;
  }

  // Find the field child
  const fieldItem = window.ContractParser.findFieldChild(contractItem, field);
  return fieldItem;
}

/**
 * Create a new field node under the contract if it doesn't exist
 * @param {Object} idea - The idea object
 * @param {string} field - The field name
 * @param {string} value - The value to set
 * @returns {boolean} True if successful
 */
function createOrUpdateField(idea, field, value) {
  if (!idea || !field || !value) return false;

  // Get the contract item
  const contractItem = window.ContractParser?.getItemById(idea.id);
  if (!contractItem) {
    console.warn('[Suggestions] Contract item not found');
    return false;
  }

  // Format field label (capitalize first letter of each word)
  const fieldLabels = {
    intent: 'Intent',
    stakeholders: 'Stakeholders',
    owner: 'Owner',
    system_ref: 'System Reference',
    qa_doc: 'QA Document',
    update_set: 'Update Set',
    qa_results: 'QA Results'
  };
  const fieldLabel = fieldLabels[field] || field;

  // Check if field already exists
  let fieldItem = findFieldNode(idea, field);

  if (fieldItem) {
    // Update existing field - set the note content
    try {
      if (typeof WF !== 'undefined' && WF.setItemNote) {
        WF.setItemNote(fieldItem, value);
        console.log('[Suggestions] Updated field note:', field);
        return true;
      }
    } catch (e) {
      console.error('[Suggestions] Error updating field:', e);
    }
  } else {
    // Create new field under contract
    try {
      if (typeof WF !== 'undefined' && WF.createItem) {
        // Create the field with label as name, suggestion as note
        const newItem = WF.createItem(contractItem, 0); // Insert at beginning
        if (newItem) {
          WF.setItemName(newItem, fieldLabel);
          WF.setItemNote(newItem, value);
          console.log('[Suggestions] Created new field:', field);
          return true;
        }
      }
    } catch (e) {
      console.error('[Suggestions] Error creating field:', e);
    }
  }

  return false;
}

/**
 * Accept the current suggestion and insert it into the field
 * @returns {boolean} True if suggestion was accepted successfully
 */
function acceptSuggestion() {
  const UI = window.ContractUI;
  if (!UI) {
    console.warn('[Suggestions] ContractUI not available');
    return false;
  }

  const suggestion = UI.getCurrentSuggestion();
  if (!suggestion || !suggestion.idea || !suggestion.field || !suggestion.text) {
    console.log('[Suggestions] No active suggestion to accept');
    return false;
  }

  console.log('[Suggestions] Accepting suggestion for', suggestion.field);

  // Create or update the field with the suggestion text
  const success = createOrUpdateField(suggestion.idea, suggestion.field, suggestion.text);

  if (success) {
    // Hide the suggestion overlay
    UI.hideSuggestion();

    // Show success toast
    UI.showSuccess('Suggestion Accepted', `${suggestion.field} template inserted`);

    return true;
  } else {
    UI.showError('Failed to Accept', 'Could not insert suggestion into field');
    return false;
  }
}

/**
 * Initialize keyboard listener for suggestion acceptance
 * Listens for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
 * Note: Cmd+` is intercepted by macOS system shortcuts
 */
function initKeyboardListener() {
  document.addEventListener('keydown', (event) => {
    // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    const isEnter = event.key === 'Enter' || event.code === 'Enter';
    const hasModifier = event.metaKey || event.ctrlKey;

    // Only trigger if there's an active suggestion visible
    const suggestion = window.ContractUI?.getCurrentSuggestion();
    const hasSuggestion = suggestion && suggestion.idea && suggestion.field && suggestion.text;

    if (isEnter && hasModifier && hasSuggestion) {
      event.preventDefault();
      event.stopPropagation();

      console.log('[Suggestions] Keyboard shortcut triggered (Cmd/Ctrl+Enter)');
      acceptSuggestion();
    }
  }, true); // Use capture phase to get event before Workflowy

  console.log('[Suggestions] Keyboard listener initialized (Cmd/Ctrl + Enter)');
}

// Export for use in other modules
window.ContractSuggestions = {
  findFieldNode,
  createOrUpdateField,
  acceptSuggestion,
  initKeyboardListener
};

console.log('[Contract Suggestions] Loaded');
