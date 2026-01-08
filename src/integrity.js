/**
 * Integrity Layer - Pure validation and state derivation functions
 *
 * This is Layer 2 of the architecture - enforces contract rules
 * regardless of caller (AI, human, automation)
 *
 * Key functions:
 * - validate_idea() -> errors[]
 * - derive_state() -> raw/wanting/planning/implementing/done
 * - next_field() -> first unresolved required field
 * - resolve_field() -> value with source (local/inherited)
 */

// Field canonical order (for next_field derivation)
const FIELD_ORDER = [
  'intent',
  'stakeholders',
  'owner',
  'system_ref',
  'qa_doc',
  'update_set',
  'qa_results'
];

// Fields that cannot be inherited
const NON_INHERITABLE = ['update_set', 'qa_results'];

// Fields that can be inherited
const INHERITABLE = ['intent', 'stakeholders', 'owner', 'system_ref', 'qa_doc'];

/**
 * Check if a value is blank (null, empty string, or empty array)
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function is_blank(x) {
  if (x === null || x === undefined) return true;
  if (typeof x === 'string' && x.trim() === '') return true;
  if (Array.isArray(x) && x.length === 0) return true;
  return false;
}

/**
 * Check if an idea has a local value for a field
 * @param {Object} idea - Idea object
 * @param {string} field - Field name (e.g., 'intent')
 * @returns {boolean}
 */
function has_local_value(idea, field) {
  const localKey = `${field}_local`;
  return !is_blank(idea[localKey]);
}

/**
 * Check if an idea has an inheritance pointer for a field
 * @param {Object} idea - Idea object
 * @param {string} field - Field name
 * @returns {boolean}
 */
function has_inherit_ptr(idea, field) {
  const ptrKey = `${field}_inherited_from`;
  return !is_blank(idea[ptrKey]);
}

/**
 * Get the local value for a field
 * @param {Object} idea - Idea object
 * @param {string} field - Field name
 * @returns {*} Local value or null
 */
function get_local(idea, field) {
  const localKey = `${field}_local`;
  return idea[localKey] || null;
}

/**
 * Get the inheritance pointer for a field
 * @param {Object} idea - Idea object
 * @param {string} field - Field name
 * @returns {string|null} Ancestor idea ID or null
 */
function get_inherit_ptr(idea, field) {
  const ptrKey = `${field}_inherited_from`;
  return idea[ptrKey] || null;
}

/**
 * Generator: yields ancestors of an idea (parent chain, nearest first)
 * @param {Map} store - Map of idea ID to Idea object
 * @param {Object} idea - Starting idea
 * @yields {Object} Ancestor ideas
 */
function* ancestors(store, idea) {
  let currentId = idea.parent_id;

  while (currentId) {
    const ancestor = store.get(currentId);
    if (!ancestor) break;

    yield ancestor;
    currentId = ancestor.parent_id;
  }
}

/**
 * Resolve an inherited field value by following the inheritance pointer
 * @param {Map} store - Map of idea ID to Idea object
 * @param {Object} idea - Idea with inheritance pointer
 * @param {string} field - Field name
 * @returns {Object} { ok: boolean, value: *, error: string|null }
 */
function resolve_inherited(store, idea, field) {
  const srcId = get_inherit_ptr(idea, field);

  if (is_blank(srcId)) {
    return { ok: false, value: null, error: 'missing inheritance pointer' };
  }

  // Find the ancestor in the chain
  for (const ancestor of ancestors(store, idea)) {
    if (ancestor.id === srcId) {
      if (has_local_value(ancestor, field)) {
        return { ok: true, value: get_local(ancestor, field), error: null };
      } else {
        return { ok: false, value: null, error: 'inherit source has no local value for field' };
      }
    }
  }

  // Also check direct lookup (for non-strict mode)
  const directAncestor = store.get(srcId);
  if (directAncestor && has_local_value(directAncestor, field)) {
    // Warn: not in direct ancestor chain (context reference only)
    console.warn(`[Integrity] Field '${field}' references non-ancestor ${srcId} - treating as context, not inheritance`);
    return { ok: false, value: null, error: 'inherit source not in ancestor chain (context only)' };
  }

  return { ok: false, value: null, error: 'inherit source not found in ancestor chain' };
}

/**
 * Resolve a field value (local or inherited)
 * @param {Map} store - Map of idea ID to Idea object
 * @param {Object} idea - Idea to resolve
 * @param {string} field - Field name
 * @returns {Object} { ok: boolean, value: *, source: string, error: string|null }
 */
function resolve_field(store, idea, field) {
  // Non-inheritable fields must be local
  if (NON_INHERITABLE.includes(field)) {
    if (has_local_value(idea, field)) {
      return { ok: true, value: get_local(idea, field), source: 'local', error: null };
    }
    return { ok: false, value: null, source: null, error: 'must be local' };
  }

  // Inheritable fields: check local first
  if (has_local_value(idea, field)) {
    return { ok: true, value: get_local(idea, field), source: 'local', error: null };
  }

  // Check explicit inheritance pointer (mirror link)
  if (has_inherit_ptr(idea, field)) {
    const result = resolve_inherited(store, idea, field);
    if (result.ok) {
      return { ok: true, value: result.value, source: 'inherited', error: null };
    }
    return { ok: false, value: null, source: null, error: result.error };
  }

  // Auto-inherit from parent contract (implicit inheritance)
  const parentResult = resolve_from_parent_contract(store, idea, field);
  if (parentResult.ok) {
    return { ok: true, value: parentResult.value, source: 'parent', error: null };
  }

  return { ok: false, value: null, source: null, error: 'unresolved' };
}

/**
 * Try to resolve a field from parent contracts (automatic inheritance)
 * @param {Map} store - Map of idea ID to Idea object
 * @param {Object} idea - Current idea
 * @param {string} field - Field name
 * @returns {Object} { ok: boolean, value: *, error: string|null }
 */
function resolve_from_parent_contract(store, idea, field) {
  // Walk up the parent chain looking for contracts with this field
  for (const ancestor of ancestors(store, idea)) {
    if (has_local_value(ancestor, field)) {
      return { ok: true, value: get_local(ancestor, field), error: null };
    }
  }

  // Also check via WF API if parent_id exists but not in store
  if (idea.parent_id && window.ContractParser) {
    const parentItem = window.ContractParser.getItemById(idea.parent_id);
    if (parentItem) {
      const parentContract = window.ContractParser.findContractAncestor({ data: { pa: { id: idea.parent_id } } });
      if (parentContract) {
        // Build parent idea and check for field
        const parentIdea = window.ContractParser.buildIdea(parentContract);
        if (parentIdea && has_local_value(parentIdea, field)) {
          return { ok: true, value: get_local(parentIdea, field), error: null };
        }
      }
    }
  }

  return { ok: false, value: null, error: 'no parent has field' };
}

/**
 * Check if child system_ref properly narrows ancestor system_ref
 * @param {Object} ancestorRef - Ancestor's SystemRef
 * @param {Object} childRef - Child's SystemRef
 * @returns {boolean} True if valid narrowing
 */
function check_system_ref_narrowing(ancestorRef, childRef) {
  if (!ancestorRef || !childRef) return true; // Can't validate without both

  // Same domain required
  if (ancestorRef.domain !== childRef.domain) return false;

  // Same identifier (or sub-identifier)
  if (ancestorRef.identifier !== childRef.identifier) return false;

  // Child path must be within or equal to ancestor path
  if (ancestorRef.path !== null) {
    if (childRef.path === null) return false;
    if (!childRef.path.startsWith(ancestorRef.path)) return false;
  }

  return true;
}

/**
 * Check if an idea is stale (no state change for specified duration)
 * @param {Object} idea - Idea object with state_changed_at
 * @param {number} staleDays - Number of days to consider stale (default 7)
 * @returns {Object} { stale: boolean, daysSinceChange: number|null }
 */
function is_stale(idea, staleDays = 7) {
  if (!idea.state_changed_at) {
    return { stale: false, daysSinceChange: null };
  }

  const now = Date.now();
  const daysSinceChange = (now - idea.state_changed_at) / (1000 * 60 * 60 * 24);

  return {
    stale: daysSinceChange >= staleDays,
    daysSinceChange: Math.floor(daysSinceChange)
  };
}

/**
 * Validate that a contract lives inside a #project
 * @param {Object} idea - Idea object
 * @returns {Object} { valid: boolean, warning: string|null }
 */
function validate_project_container(idea) {
  if (!window.ContractParser) {
    return { valid: true, warning: null };
  }

  const item = idea._item;
  if (!item) {
    return { valid: true, warning: null };
  }

  const hasProject = window.ContractParser.hasProjectAncestor(item);

  if (!hasProject) {
    return {
      valid: false,
      warning: 'Contract should live inside a #project node'
    };
  }

  return { valid: true, warning: null };
}

/**
 * Validate that a contract is not nested inside another contract
 * @param {Object} idea - Idea object
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validate_no_nesting(idea) {
  if (!window.ContractParser) {
    return { valid: true, error: null };
  }

  const item = idea._item;
  if (!item) {
    return { valid: true, error: null };
  }

  const hasContractParent = window.ContractParser.hasContractAncestor(item);

  if (hasContractParent) {
    return {
      valid: false,
      error: 'Contracts cannot be nested inside other contracts'
    };
  }

  return { valid: true, error: null };
}

/**
 * Derive state from resolved fields map
 * @param {Object} resolved_map - Map of field to { resolved: boolean, ... }
 * @returns {string} State: 'raw', 'wanting', 'planning', 'implementing', or 'done'
 */
function derive_state(resolved_map) {
  // Raw: Intent unresolved
  if (!resolved_map.intent?.resolved) {
    return 'raw';
  }

  // Wanting: Intent resolved, but Stakeholders OR Owner OR System Reference unresolved
  if (!resolved_map.stakeholders?.resolved ||
      !resolved_map.owner?.resolved ||
      !resolved_map.system_ref?.resolved) {
    return 'wanting';
  }

  // Planning: Above resolved, but QA Document OR Update Set unresolved
  if (!resolved_map.qa_doc?.resolved || !resolved_map.update_set?.resolved) {
    return 'planning';
  }

  // Implementing: Above resolved, but QA Results unresolved
  if (!resolved_map.qa_results?.resolved) {
    return 'implementing';
  }

  // Done: All resolved
  return 'done';
}

/**
 * Get the next required field to resolve
 * @param {Object} resolved_map - Map of field to { resolved: boolean, ... }
 * @returns {string|null} Next field name or null if all resolved
 */
function next_field(resolved_map) {
  for (const field of FIELD_ORDER) {
    if (!resolved_map[field]?.resolved) {
      return field;
    }
  }
  return null;
}

/**
 * Full validation of an idea
 * @param {Map} store - Map of idea ID to Idea object
 * @param {Object} idea - Idea to validate
 * @returns {Object} { errors: string[], warnings: string[], resolved_map: Object, state: string, next_field: string|null }
 */
function validate_idea(store, idea) {
  const errors = [];
  const warnings = [];
  const resolved_map = {};

  // 1. Structural validation: nested contract check (ERROR)
  const nestingResult = validate_no_nesting(idea);
  if (!nestingResult.valid) {
    errors.push(nestingResult.error);
  }

  // 2. Structural validation: project container check (WARNING)
  const projectResult = validate_project_container(idea);
  if (!projectResult.valid) {
    warnings.push(projectResult.warning);
  }

  // 3. Check mutual exclusion: cannot have both local and inherited
  for (const field of INHERITABLE) {
    if (has_local_value(idea, field) && has_inherit_ptr(idea, field)) {
      // Special case: system_ref can have both (narrowing)
      if (field !== 'system_ref') {
        errors.push(`${field}: cannot be both local and inherited (pick one)`);
      }
    }
  }

  // 4. Non-inheritable fields must not have inherit pointers
  for (const field of NON_INHERITABLE) {
    if (has_inherit_ptr(idea, field)) {
      errors.push(`${field}: inheritance forbidden`);
    }
  }

  // 5. Resolve all fields
  for (const field of FIELD_ORDER) {
    const result = resolve_field(store, idea, field);
    if (result.ok) {
      resolved_map[field] = {
        resolved: true,
        source: result.source,
        value: result.value
      };
    } else {
      resolved_map[field] = {
        resolved: false,
        error: result.error
      };
    }
  }

  // 6. System Reference narrowing check
  if (has_inherit_ptr(idea, 'system_ref') && has_local_value(idea, 'system_ref')) {
    const inheritResult = resolve_inherited(store, idea, 'system_ref');
    if (inheritResult.ok) {
      const localRef = get_local(idea, 'system_ref');
      if (!check_system_ref_narrowing(inheritResult.value, localRef)) {
        errors.push('system_ref: child broadens beyond inherited scope');
      }
    } else {
      errors.push(`system_ref: cannot validate narrowing (${inheritResult.error})`);
    }
  }

  // 7. Derive state
  const state = derive_state(resolved_map);

  // 8. Get next required field
  const nextField = next_field(resolved_map);

  return {
    errors,
    warnings,
    resolved_map,
    state,
    next_field: nextField
  };
}

/**
 * Check if an idea can be marked as done
 * @param {Object} validation_output - Output from validate_idea()
 * @returns {boolean}
 */
function can_mark_done(validation_output) {
  return (
    validation_output.errors.length === 0 &&
    validation_output.state === 'done'
  );
}

/**
 * Check if an idea is executable (all fields except QA Results resolved)
 * @param {Object} validation_output - Output from validate_idea()
 * @returns {boolean}
 */
function is_executable(validation_output) {
  const { resolved_map } = validation_output;

  // Check all fields except qa_results
  for (const field of FIELD_ORDER) {
    if (field === 'qa_results') continue;
    if (!resolved_map[field]?.resolved) return false;
  }

  return true;
}

/**
 * Check if an idea is complete
 * @param {Object} validation_output - Output from validate_idea()
 * @returns {boolean}
 */
function is_complete(validation_output) {
  return can_mark_done(validation_output);
}

/**
 * Get prompt text for resolving a specific field
 * @param {string} field - Field name
 * @returns {string} Prompt text
 */
function get_field_prompt(field) {
  const prompts = {
    intent: 'What must be true after completion? (one sentence)',
    stakeholders: 'Who can accept or reject this change? (list)',
    owner: 'Who is responsible for doing the work?',
    system_ref: 'Where does the change occur? (domain/identifier/path)',
    qa_doc: 'How will correctness be evaluated? (checklist/procedure reference)',
    update_set: 'What concrete actions will be taken? (list of deltas)',
    qa_results: 'What evidence shows success? (pass/fail + artifacts)'
  };

  return prompts[field] || `Provide value for ${field}`;
}

/**
 * Get suggestion/template text for a specific field
 * First checks parent #project for existing values, falls back to generic templates
 * User can accept this suggestion with Cmd+Enter keyboard shortcut
 * @param {string} field - Field name
 * @param {Object} idea - Optional idea object for context
 * @returns {string} Suggestion text template
 */
function get_field_suggestion(field, idea = null) {
  const ideaTitle = idea?.title || '[this idea]';

  // Map field names to multiple label aliases (try in order)
  const fieldAliases = {
    intent: ['Intent', 'Goal', 'Objective'],
    stakeholders: ['Stakeholders', 'Stakeholder', 'Team', 'People'],
    owner: ['Owner', 'Owners', 'Assigned', 'Responsible'],
    system_ref: ['System Reference', 'System Ref', 'Systems', 'Reference', 'Paths', 'Credentials'],
    qa_doc: ['QA Document', 'QA Documents', 'QA Doc', 'QA', 'Testing', 'Tests'],
    update_set: ['Update Set', 'Updates', 'Actions', 'Tasks', 'Deltas'],
    qa_results: ['QA Results', 'Results', 'Evidence', 'Proof']
  };

  // Try to get values from parent #project
  if (idea?.id && window.ContractParser) {
    try {
      const contractItem = window.ContractParser.getItemById(idea.id);
      if (contractItem) {
        const projectItem = window.ContractParser.findProjectAncestor(contractItem);
        if (projectItem) {
          // Try each alias until we find values
          const aliases = fieldAliases[field] || [field];
          for (const label of aliases) {
            const projectValues = window.ContractParser.getProjectFieldValues(projectItem, label);
            if (projectValues && projectValues.length > 0) {
              console.log(`[Integrity] Found ${field} values from project (label: ${label}):`, projectValues);
              // Format based on field type - most fields support multiple items
              if (field === 'owner') {
                // Owner is typically single value
                return projectValues[0];
              } else {
                // Multi-line format for all other fields (inserted as separate nodes)
                return projectValues.join('\n');
              }
            }
          }
          console.log(`[Integrity] No project values found for ${field} (tried: ${aliases.join(', ')})`);
        }
      }
    } catch (e) {
      console.warn('[Integrity] Error getting project values:', e);
    }
  }

  // Fallback to generic templates
  const suggestions = {
    intent: `When complete, ${ideaTitle} will [describe the outcome]`,
    stakeholders: `[Name]: can accept/reject\n[Name]: must be informed`,
    owner: `[Person/Team responsible]`,
    system_ref: `[Domain]: [identifier] / [path]`,
    qa_doc: `[Verification step 1]\n[Verification step 2]`,
    update_set: `[Action 1]\n[Action 2]\n[Action 3]`,
    qa_results: `Pass/Fail: [result]\nEvidence: [link to artifacts]`
  };

  return suggestions[field] || `[Provide ${field}]`;
}

/**
 * Validate a write operation before allowing it
 * @param {Map} store - Current idea store
 * @param {Object} newIdea - The idea after proposed changes
 * @returns {Object} { allowed: boolean, errors: string[], validation: Object }
 */
function validate_write(store, newIdea) {
  const validation = validate_idea(store, newIdea);

  // Allow incomplete ideas (unresolved fields OK)
  // Reject only structurally invalid ideas
  const structuralErrors = validation.errors.filter(e =>
    e.includes('cannot be both') ||
    e.includes('inheritance forbidden') ||
    e.includes('broadens beyond') ||
    e.includes('cannot be nested')
  );

  return {
    allowed: structuralErrors.length === 0,
    errors: structuralErrors,
    validation
  };
}

// Export for use in other modules
window.ContractIntegrity = {
  FIELD_ORDER,
  NON_INHERITABLE,
  INHERITABLE,

  // Core helpers
  is_blank,
  has_local_value,
  has_inherit_ptr,
  get_local,
  get_inherit_ptr,
  ancestors,

  // Resolution
  resolve_inherited,
  resolve_field,
  check_system_ref_narrowing,

  // State derivation
  derive_state,
  next_field,

  // Validation
  validate_idea,
  validate_write,
  can_mark_done,
  is_executable,
  is_complete,

  // Structural validation
  validate_project_container,
  validate_no_nesting,

  // Stale detection
  is_stale,

  // Prompts
  get_field_prompt,

  // Suggestions
  get_field_suggestion
};

console.log('[Contract Integrity] Loaded');
