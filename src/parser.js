/**
 * Parser Module - Extract contract data from Workflowy nodes
 *
 * Workflowy Structure:
 * - Node with #contract tag = managed Idea
 * - Child nodes with specific labels = contract fields
 * - Mirror links ((NodeName)) = inheritance pointers
 */

const CONTRACT_TAG = '#contract';
const PROJECT_TAG = '#project';

// State tags that will be auto-managed
const STATE_TAGS = ['#raw', '#wanting', '#planning', '#implementing', '#done'];

// Contract field labels (exact match, case-sensitive)
const CONTRACT_FIELDS = [
  'Intent',
  'Stakeholders',
  'Owner',
  'System Reference',
  'QA Document',
  'Update Set',
  'QA Results'
];

// Fields that cannot be inherited (must be local)
const NON_INHERITABLE_FIELDS = ['Update Set', 'QA Results'];

/**
 * Find all nodes with #contract tag
 * @returns {Array} Array of Workflowy item objects
 */
function findContractNodes() {
  const contractNodes = [];

  function traverse(item, depth = 0) {
    if (!item || !item.data) return;
    if (depth > 50) return; // Prevent infinite recursion

    const name = item.data.nm || '';

    if (hasTag(name, CONTRACT_TAG)) {
      contractNodes.push(item);
    }

    // Traverse children
    const children = item.data.ch || [];
    for (const child of children) {
      // Children in ch array are data objects, not full items
      try {
        const childItem = WF.getItemById(child.id);
        if (childItem) {
          traverse(childItem, depth + 1);
        }
      } catch (e) {
        // Skip problematic children
        console.warn('[Parser] Error traversing child:', child.id, e);
      }
    }
  }

  try {
    console.log('[Parser] Finding contract nodes...');
    const root = WF.rootItem();
    if (!root) {
      console.error('[Parser] WF.rootItem() returned null');
      return contractNodes;
    }
    traverse(root);
    console.log('[Parser] Found', contractNodes.length, 'contract nodes');
  } catch (e) {
    console.error('[Parser] Error in findContractNodes:', e);
  }

  return contractNodes;
}

/**
 * Check if a node name contains a specific tag
 * @param {string} nameHtml - The nm field (HTML string)
 * @param {string} tag - The tag to search for (e.g., '#contract')
 * @returns {boolean}
 */
function hasTag(nameHtml, tag) {
  if (!nameHtml) return false;
  // Tags appear as <span class="contentTag">#tagname</span> or as plain text
  const plainText = stripHtml(nameHtml);
  return plainText.includes(tag);
}

/**
 * Strip HTML tags from string
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Get node title without tags
 * @param {string} nameHtml - The nm field (HTML string)
 * @returns {string} Clean title without #tags
 */
function getNodeTitle(nameHtml) {
  if (!nameHtml) return '';
  const plainText = stripHtml(nameHtml);
  // Remove all hashtags and clean up whitespace
  return plainText
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract all tags from a node name
 * @param {string} nameHtml - The nm field (HTML string)
 * @returns {Array<string>} Array of tags (including #)
 */
function extractTags(nameHtml) {
  if (!nameHtml) return [];
  const plainText = stripHtml(nameHtml);
  const matches = plainText.match(/#\w+/g) || [];
  return matches;
}

/**
 * Find a child node by exact label match
 * @param {Object} item - Workflowy item
 * @param {string} label - Label to match (e.g., 'Intent')
 * @returns {Object|null} Child item or null
 */
function findChildByLabel(item, label) {
  if (!item || !item.data || !item.data.ch) return null;

  for (const childData of item.data.ch) {
    const childName = stripHtml(childData.nm || '');
    // Check if the child name starts with the label (case-sensitive)
    if (childName.trim() === label || childName.trim().startsWith(label + ':')) {
      return WF.getItemById(childData.id);
    }
  }

  return null;
}

/**
 * Find the actual original item for a mirror
 * Uses _cachedOriginalItem first, then falls back to mirrorRootIds search
 * @param {Object} mirrorItem - The mirror item (from WF.getItemById)
 * @returns {string|null} The original item's ID, or null
 */
function findOriginalId(mirrorItem) {
  if (!mirrorItem) return null;

  const data = mirrorItem.data || mirrorItem;

  // Method 1: Use _cachedOriginalItem if available
  if (data._cachedOriginalItem) {
    const originalId = data._cachedOriginalItem.id || data._cachedOriginalItem.data?.id;
    if (originalId) {
      return originalId;
    }
  }

  // Method 2: Check mirrorRootIds for an ID with actual content
  const mirrorRootIds = data.metadata?.mirror?.mirrorRootIds;
  if (mirrorRootIds) {
    const selfId = data.id;
    const ids = Object.keys(mirrorRootIds).filter(id => id !== selfId);

    for (const id of ids) {
      try {
        const item = WF.getItemById(id);
        if (item) {
          const nm = item.data?.nm || '';
          if (nm && nm.trim() !== '') {
            return id;
          }
        }
      } catch (e) {
        // Skip
      }
    }
  }

  return null;
}

/**
 * Get the text content of a child item, resolving mirrors if needed
 * Mirror items have empty nm field - text comes from the original
 * Uses _cachedOriginalItem to find the actual original
 * @param {Object} child - Child data object from ch array
 * @returns {string} The text content
 */
function getChildText(child) {
  if (!child) return '';

  // If nm is empty, this might be a mirror - fetch fresh item and resolve
  if (!child.nm || child.nm === '') {
    if (child.id) {
      try {
        const freshItem = WF.getItemById(child.id);
        if (freshItem) {
          // Try to find the original using _cachedOriginalItem
          const originalId = findOriginalId(freshItem);
          if (originalId) {
            const originalItem = WF.getItemById(originalId);
            if (originalItem) {
              const originalName = originalItem.getName ? originalItem.getName() : (originalItem.data?.nm || '');
              return stripHtml(originalName);
            }
          }
        }
      } catch (e) {
        console.warn('[Parser] Error resolving mirror:', child.id, e);
      }
    }
    return '';
  }

  // Regular item with content - use nm directly
  return stripHtml(child.nm);
}

/**
 * Extract content from a field node's children
 * For single-value fields: returns string
 * For list fields: returns array of strings
 * Handles both regular items and mirror items
 * @param {Object} fieldItem - The field node (e.g., "Intent" node)
 * @param {boolean} asList - Whether to return as list
 * @returns {string|Array<string>|null}
 */
function extractFieldContent(fieldItem, asList = false) {
  if (!fieldItem || !fieldItem.data) return null;

  // Try data.ch first, fall back to getChildren() if stale
  let children = fieldItem.data.ch || [];

  // If ch array is empty but getChildren returns items, use those instead
  if (children.length === 0 && fieldItem.getChildren) {
    const freshChildren = fieldItem.getChildren();
    if (freshChildren && freshChildren.length > 0) {
      children = freshChildren.map(c => c.data);
    }
  }

  if (children.length === 0) {
    // Check if the field has inline content after the label
    const name = stripHtml(fieldItem.data.nm || '');
    const colonIndex = name.indexOf(':');
    if (colonIndex !== -1) {
      const inlineContent = name.substring(colonIndex + 1).trim();
      if (inlineContent) {
        return asList ? [inlineContent] : inlineContent;
      }
    }
    return null;
  }

  if (asList) {
    // Use getChildText to resolve mirrors
    return children.map(child => getChildText(child)).filter(Boolean);
  } else {
    // Single value - take first child's content (resolve if mirror)
    return getChildText(children[0]) || null;
  }
}

/**
 * Detect inheritance pointer in a field's content
 * Inheritance pointers are mirrors that point to OTHER #contract nodes
 * Mirrors pointing to #project values are NOT inheritance - they're local values
 * Uses _cachedOriginalItem to find the actual original
 * @param {Object} fieldItem - The field node
 * @returns {string|null} The referenced contract ID, or null if no inheritance
 */
function detectInheritancePointer(fieldItem) {
  if (!fieldItem || !fieldItem.data) return null;

  const children = fieldItem.data.ch || [];

  for (const child of children) {
    // Skip non-mirror children (they have content in nm)
    if (child.nm && child.nm.trim() !== '') {
      continue;
    }

    // This might be a mirror - fetch fresh item and check
    if (child.id) {
      try {
        const childItem = WF.getItemById(child.id);
        if (childItem && childItem.data.reactToOriginalMarkChanged) {
          // Confirmed mirror - find the original
          const originalId = findOriginalId(childItem);
          if (originalId) {
            const originalItem = WF.getItemById(originalId);
            if (originalItem) {
              // Check if original is under a #contract (inheritance)
              if (hasContractAncestor(originalItem) || hasTag(originalItem.data?.nm || '', CONTRACT_TAG)) {
                return originalId;
              }
              // Original is under #project - NOT inheritance, it's a local value
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  return null;
}

/**
 * Parse all contract fields from a contract node
 * @param {Object} item - Workflowy item with #contract tag
 * @returns {Object} Parsed fields with local values and inheritance pointers
 */
function parseContractFields(item) {
  const fields = {
    intent_local: null,
    intent_inherited_from: null,
    stakeholders_local: null,
    stakeholders_inherited_from: null,
    owner_local: null,
    owner_inherited_from: null,
    system_ref_local: null,
    system_ref_inherited_from: null,
    qa_doc_local: null,
    qa_doc_inherited_from: null,
    update_set_local: null,
    qa_results_local: null
  };

  // Intent (single value, inheritable)
  const intentNode = findChildByLabel(item, 'Intent');
  if (intentNode) {
    const inheritPtr = detectInheritancePointer(intentNode);
    if (inheritPtr) {
      fields.intent_inherited_from = inheritPtr;
    } else {
      fields.intent_local = extractFieldContent(intentNode, false);
    }
  }

  // Stakeholders (list, inheritable)
  const stakeholdersNode = findChildByLabel(item, 'Stakeholders');
  if (stakeholdersNode) {
    const inheritPtr = detectInheritancePointer(stakeholdersNode);
    if (inheritPtr) {
      fields.stakeholders_inherited_from = inheritPtr;
    } else {
      fields.stakeholders_local = extractFieldContent(stakeholdersNode, true);
    }
  }

  // Owner (single value, inheritable)
  const ownerNode = findChildByLabel(item, 'Owner');
  if (ownerNode) {
    const inheritPtr = detectInheritancePointer(ownerNode);
    if (inheritPtr) {
      fields.owner_inherited_from = inheritPtr;
    } else {
      fields.owner_local = extractFieldContent(ownerNode, false);
    }
  }

  // System Reference (structured, inheritable with narrowing)
  const sysRefNode = findChildByLabel(item, 'System Reference');
  if (sysRefNode) {
    const inheritPtr = detectInheritancePointer(sysRefNode);
    if (inheritPtr) {
      fields.system_ref_inherited_from = inheritPtr;
    }
    // Can have both local (narrowing) and inherited
    const localContent = extractFieldContent(sysRefNode, false);
    if (localContent) {
      fields.system_ref_local = parseSystemRef(localContent);
    }
  }

  // QA Document (single value, inheritable)
  const qaDocNode = findChildByLabel(item, 'QA Document');
  if (qaDocNode) {
    const inheritPtr = detectInheritancePointer(qaDocNode);
    if (inheritPtr) {
      fields.qa_doc_inherited_from = inheritPtr;
    } else {
      fields.qa_doc_local = extractFieldContent(qaDocNode, false);
    }
  }

  // Update Set (list, NOT inheritable)
  const updateSetNode = findChildByLabel(item, 'Update Set');
  if (updateSetNode) {
    fields.update_set_local = extractFieldContent(updateSetNode, true);
  }

  // QA Results (list, NOT inheritable)
  const qaResultsNode = findChildByLabel(item, 'QA Results');
  if (qaResultsNode) {
    fields.qa_results_local = parseQaResults(qaResultsNode);
  }

  return fields;
}

/**
 * Parse System Reference into structured format
 * @param {string} content - Raw system reference content
 * @returns {Object} SystemRef object
 */
function parseSystemRef(content) {
  if (!content) return null;

  // Try to parse structured format: domain/identifier/path
  // For now, simple string parsing - can be enhanced
  return {
    domain: 'unknown',
    identifier: content,
    path: null,
    version: null
  };
}

/**
 * Parse QA Results into structured format
 * @param {Object} qaResultsNode - The QA Results field node
 * @returns {Object} QaResults object with status and evidence
 */
function parseQaResults(qaResultsNode) {
  if (!qaResultsNode || !qaResultsNode.data) return null;

  const children = qaResultsNode.data.ch || [];
  if (children.length === 0) return null;

  const evidence = [];
  let status = 'unknown';

  for (const child of children) {
    const content = stripHtml(child.nm || '').toLowerCase();
    if (content.includes('pass')) {
      status = 'pass';
    } else if (content.includes('fail')) {
      status = 'fail';
    }
    evidence.push(stripHtml(child.nm || ''));
  }

  return {
    status: status,
    evidence: evidence
  };
}

/**
 * Build a complete Idea object from a contract node
 * @param {Object} item - Workflowy item with #contract tag
 * @returns {Object} Complete Idea object
 */
function buildIdea(item) {
  if (!item || !item.data) return null;

  const name = item.data.nm || '';
  if (!hasTag(name, CONTRACT_TAG)) {
    console.warn('[Parser] Item does not have #contract tag');
    return null;
  }

  const fields = parseContractFields(item);
  const tags = extractTags(name);

  // Find current state tag
  let currentState = null;
  for (const stateTag of STATE_TAGS) {
    if (tags.includes(stateTag)) {
      currentState = stateTag.substring(1); // Remove #
      break;
    }
  }

  // Get parent ID
  let parentId = null;
  if (item.data.pa) {
    parentId = item.data.pa.id || null;
  }

  // Build blocks and blocked_by from mirror links
  const { blocks, blocked_by } = parseDependencies(item);

  return {
    id: item.data.id,
    parent_id: parentId,
    title: getNodeTitle(name),
    has_contract_tag: true,
    current_state_tag: currentState,
    tags: tags,

    // Contract fields
    ...fields,

    // Dependencies
    blocks: blocks,
    blocked_by: blocked_by,

    // Timestamps (state_changed_at loaded from storage, lm from Workflowy)
    last_modified: item.data.lm || null,
    state_changed_at: null, // Will be set by observer when state changes

    // Reference to original item for mutations
    _item: item
  };
}

/**
 * Parse dependency relationships from the contract node
 * Looks for "blocks" and "blocked_by" children with mirror links
 * @param {Object} item - Workflowy item
 * @returns {Object} { blocks: string[], blocked_by: string[] }
 */
function parseDependencies(item) {
  const blocks = [];
  const blocked_by = [];

  // Look for "blocks" child
  const blocksNode = findChildByLabel(item, 'blocks');
  if (blocksNode && blocksNode.data.ch) {
    for (const child of blocksNode.data.ch) {
      if (child.metadata?.mirror?.mirrorRootIds) {
        const ids = Object.keys(child.metadata.mirror.mirrorRootIds);
        blocks.push(...ids);
      }
    }
  }

  // Look for "blocked_by" child
  const blockedByNode = findChildByLabel(item, 'blocked_by');
  if (blockedByNode && blockedByNode.data.ch) {
    for (const child of blockedByNode.data.ch) {
      if (child.metadata?.mirror?.mirrorRootIds) {
        const ids = Object.keys(child.metadata.mirror.mirrorRootIds);
        blocked_by.push(...ids);
      }
    }
  }

  return { blocks, blocked_by };
}

/**
 * Get an item by ID (wrapper for WF.getItemById)
 * @param {string} id
 * @returns {Object|null}
 */
function getItemById(id) {
  try {
    return WF.getItemById(id);
  } catch (e) {
    console.error('[Parser] Error getting item:', e);
    return null;
  }
}

/**
 * Get parent item of a given item
 * @param {Object} item - Workflowy item
 * @returns {Object|null} Parent item or null
 */
function getParentItem(item) {
  if (!item || !item.data || !item.data.pa) return null;

  const parentId = item.data.pa.id;
  if (!parentId || parentId === 'None') return null;

  return getItemById(parentId);
}

/**
 * Find the nearest ancestor that is a contract
 * @param {Object} item - Starting item
 * @returns {Object|null} Contract ancestor item or null
 */
function findContractAncestor(item) {
  let current = getParentItem(item);

  while (current) {
    const name = current.data.nm || '';
    if (hasTag(name, CONTRACT_TAG)) {
      return current;
    }
    current = getParentItem(current);
  }

  return null;
}

/**
 * Find the nearest ancestor that is a project (#project tag)
 * @param {Object} item - Starting item
 * @returns {Object|null} Project ancestor item or null
 */
function findProjectAncestor(item) {
  let current = getParentItem(item);

  while (current) {
    const name = current.data.nm || '';
    if (hasTag(name, PROJECT_TAG)) {
      return current;
    }
    current = getParentItem(current);
  }

  return null;
}

/**
 * Check if an item has a contract ancestor (for nested contract detection)
 * @param {Object} item - Starting item (should be a contract)
 * @returns {boolean} True if item has a #contract ancestor
 */
function hasContractAncestor(item) {
  return findContractAncestor(item) !== null;
}

/**
 * Check if an item has a project ancestor
 * @param {Object} item - Starting item
 * @returns {boolean} True if item has a #project ancestor
 */
function hasProjectAncestor(item) {
  return findProjectAncestor(item) !== null;
}

/**
 * Get the current focused node from URL hash
 * @returns {Object|null} Focused item or null
 */
function getFocusedItem() {
  const hash = window.location.hash;
  // Format: #/nodeId or #/nodeId?q=search
  const match = hash.match(/^#\/([a-f0-9]+)/i);

  if (match && match[1]) {
    return getItemById(match[1]);
  }

  return null;
}

/**
 * Check if currently focused on a contract node
 * Only returns the contract if we're directly focused on it (not descendants or ancestors)
 * @returns {Object|null} The focused contract, or null if not focused on a contract
 */
function getContractContext() {
  const focused = getFocusedItem();
  if (!focused) return null;

  // Only show popup if focused item itself is a contract
  const name = focused.data.nm || '';
  if (hasTag(name, CONTRACT_TAG)) {
    return focused;
  }

  // Don't show popup for children or ancestors of contracts
  return null;
}

/**
 * Build a store of all contract ideas for validation
 * @returns {Map<string, Object>} Map of idea ID to Idea object
 */
function buildIdeaStore() {
  const store = new Map();

  try {
    console.log('[Parser] Building idea store...');
    const contractNodes = findContractNodes();
    console.log('[Parser] Processing', contractNodes.length, 'contract nodes...');

    for (const node of contractNodes) {
      try {
        const idea = buildIdea(node);
        if (idea) {
          store.set(idea.id, idea);
        }
      } catch (e) {
        console.error('[Parser] Error building idea from node:', node?.data?.id, e);
      }
    }

    console.log('[Parser] Built store with', store.size, 'ideas');
  } catch (e) {
    console.error('[Parser] Error in buildIdeaStore:', e);
  }

  return store;
}

/**
 * Find a field child node by field name (maps to label)
 * @param {Object} item - Workflowy contract item
 * @param {string} field - Field name (e.g., 'intent', 'qa_doc')
 * @returns {Object|null} Child item or null
 */
function findFieldChild(item, field) {
  const fieldLabels = {
    intent: 'Intent',
    stakeholders: 'Stakeholders',
    owner: 'Owner',
    system_ref: 'System Reference',
    qa_doc: 'QA Document',
    update_set: 'Update Set',
    qa_results: 'QA Results'
  };

  const label = fieldLabels[field];
  if (!label) return null;

  return findChildByLabel(item, label);
}

/**
 * Get field values from a project node
 * Looks for a child with the given label and returns its children's names
 * @param {Object} projectItem - Workflowy project item (#project node)
 * @param {string} fieldLabel - Label to search for (e.g., 'Stakeholders', 'System Reference')
 * @returns {string[]|null} Array of child names, or null if field not found
 */
function getProjectFieldValues(projectItem, fieldLabel) {
  if (!projectItem) return null;

  // Find the field child under project
  const fieldChild = findChildByLabel(projectItem, fieldLabel);
  if (!fieldChild) return null;

  // Get the children of the field
  const children = fieldChild.getChildren ? fieldChild.getChildren() : [];
  if (children.length === 0) return null;

  // Extract the names of each child
  const values = children
    .map(child => {
      const name = child.getName ? child.getName() : (child.data?.nm || '');
      return stripHtml(name).trim();
    })
    .filter(name => name !== '');

  return values.length > 0 ? values : null;
}

/**
 * Get field values from a project node, recursively collecting leaf nodes
 * Handles nested structures like:
 *   System Reference
 *     - Credentials
 *       - Credential A
 *       - Credential B
 *     - Documents
 *       - Doc A
 * Returns: [{text: "Credential A", id: "abc123"}, ...]
 *
 * @param {Object} projectItem - Workflowy project item (#project node)
 * @param {string} fieldLabel - Label to search for (e.g., 'System Reference')
 * @param {number} maxDepth - Maximum recursion depth (default 3)
 * @returns {Object[]|null} Array of {text, id} objects, or null if field not found
 */
function getProjectFieldValuesDeep(projectItem, fieldLabel, maxDepth = 3) {
  if (!projectItem) return null;

  // Find the field child under project
  const fieldChild = findChildByLabel(projectItem, fieldLabel);
  if (!fieldChild) return null;

  const values = [];

  // Recursive helper to collect leaf nodes
  function collectLeaves(item, depth) {
    if (depth > maxDepth) return;

    const children = item.getChildren ? item.getChildren() : [];

    if (children.length === 0) {
      // Leaf node - collect its name and ID
      const name = item.getName ? item.getName() : (item.data?.nm || '');
      const cleanName = stripHtml(name).trim();
      const id = item.getId ? item.getId() : (item.data?.id || null);
      if (cleanName !== '' && id) {
        values.push({ text: cleanName, id: id });
      }
    } else {
      // Has children - recurse into each
      for (const child of children) {
        collectLeaves(child, depth + 1);
      }
    }
  }

  // Start collecting from field's children
  const topChildren = fieldChild.getChildren ? fieldChild.getChildren() : [];
  for (const child of topChildren) {
    collectLeaves(child, 1);
  }

  return values.length > 0 ? values : null;
}

// Export for use in other modules
window.ContractParser = {
  CONTRACT_TAG,
  PROJECT_TAG,
  STATE_TAGS,
  CONTRACT_FIELDS,
  NON_INHERITABLE_FIELDS,

  findContractNodes,
  hasTag,
  stripHtml,
  getNodeTitle,
  extractTags,
  findChildByLabel,
  findFieldChild,
  getProjectFieldValues,
  getProjectFieldValuesDeep,
  extractFieldContent,
  detectInheritancePointer,
  parseContractFields,
  buildIdea,
  buildIdeaStore,
  getItemById,
  getParentItem,
  findContractAncestor,
  findProjectAncestor,
  hasContractAncestor,
  hasProjectAncestor,
  getFocusedItem,
  getContractContext
};

console.log('[Contract Parser] Loaded');
