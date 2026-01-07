Universal Ideas

- Core Realization
  - This is NOT "software project management"
  - This is a system for executing deltas against systems
  - Software is just one concrete system
  - The universal abstraction: idea → change in a system → verified outcome
- Core object
  - Idea
    - Definition
      - An idea represents a proposed change to a system
      - The contract ensures the change is executable and verifiable, regardless of system type
      - The same idea persists while contract fields are progressively resolved
    - Invariant
      - An idea does not change type
      - It becomes executable as its contract resolves
- Minimal first-principles axioms
  - Axiom 1: An idea targets a delta against a system
    - An idea points at a real system change, even if initially vague
    - The delta exists to satisfy the Intent but is not the Intent
  - Axiom 2: An idea is executable only if it resolves a fixed contract
    - The contract is the smallest set of fields that makes the delta executable and falsifiable
    - Idea contract fields #template
      - Intent
      - Stakeholders
      - Owner
      - System Reference
      - QA Document
      - Update Set
      - QA Results
    - Contract field definitions
      - Intent
        - What must be true after completion?
        - Is
          - What must be true after completion
          - The definition of correctness
        - Is NOT
          - How to implement
          - A list of edits
        - Domain examples
          - Software: "Login API returns JWT with 15-minute expiry"
          - Business: "Q3 revenue forecast approved by CFO"
          - Legal: "MSA template includes indemnity clause X"
          - Hiring: "Backend engineer hired meeting criteria C by date S"
          - ML Research: "Model achieves +2% AUC over baseline on dataset D"
      - Stakeholders
        - Who can accept or reject the change?
        - Is
          - Who can accept or reject the delta
        - Is NOT
          - A broad FYI list
        - Domain examples
          - Software: Product owner, tech lead
          - Business: CFO, board
          - Legal: General counsel, CEO
          - Hiring: Hiring manager, recruiter, finance approver
          - ML Research: Research lead, advisor
      - Owner
        - Who is responsible for doing the work?
        - Is
          - The person or team accountable for executing the Update Set
          - Who will be prompted for next actions
        - Is NOT
          - Stakeholders (they accept/reject, not execute)
          - A broad responsibility list
        - Domain examples
          - Software: Assigned developer, team lead
          - Business: Project manager, analyst
          - Legal: Associate attorney, paralegal
          - Hiring: Recruiter, sourcer
          - ML Research: Researcher, engineer
      - System Reference
        - Where does the change occur?
        - Is
          - Where changes are allowed
        - Is NOT
          - A guess
          - Broader than parent scope
        - Domain examples
          - Software: repo/path/symbol/env (e.g., "monorepo/src/auth/login.ts")
          - Business: doc/process (e.g., "Q3 forecast spreadsheet v2.3")
          - Legal: contract/version (e.g., "MSA template v4, sections 8-10")
          - Hiring: ATS job req ID, team, budget line
          - ML Research: dataset/model/run (e.g., "dataset D v1.2, experiment tracker project X")
          - Infra: account/resource (e.g., "AWS account 123456, us-east-1")
      - QA Document
        - How do we decide success?
        - Is
          - How correctness will be evaluated
        - Is NOT
          - A retroactive story
        - Domain examples
          - Software: Test suite, acceptance criteria checklist
          - Business: KPI thresholds, approval workflow
          - Legal: Review checklist (conflicts, definitions, jurisdiction, risk)
          - Hiring: Interview rubric, score thresholds, reference check steps
          - ML Research: Evaluation protocol (splits, seeds, metric definitions, significance test)
      - Update Set
        - What concrete actions will be taken?
        - Is
          - The complete list of concrete modifications to apply to satisfy Intent
          - Later, the same list updated to reflect what was actually applied
        - Is NOT
          - Intent
          - A future roadmap
          - Inherited
        - Domain examples
          - Software: Code changes, config updates, migrations
          - Business: Meetings held, documents edited, decisions made
          - Legal: Edit sections 8-10, update definitions, update appendix
          - Hiring: Publish posting, source, interview, debrief, offer, negotiate
          - ML Research: Run experiments E1-E6, add features, change training config
      - QA Results
        - What evidence shows success?
        - Is
          - Evidence produced by executing the QA Document
        - Is NOT
          - A claim
          - Inherited
        - Domain examples
          - Software: Test results, screenshots, deployment logs
          - Business: Metrics report, approval email, before/after KPI
          - Legal: Redline link, approval email, final version ID
          - Hiring: Signed offer, rubric summary, approvals, start date confirmed
          - ML Research: Table of results, confidence intervals, links to runs
- Why this framework is universal (not software-specific)
  - Most PM tools assume: software, tickets, sprints
  - This system models: change itself
  - Software is treated as just one domain
  - Can manage infra, business, research, legal, hiring with one ledger
- Minimality proof (by contradiction)
  - Goal: turn an idea into a verified change
  - Definition (Verified Change): A change counts as "verified" iff an evaluator can decide, using stated criteria and evidence, that the system now satisfies the intended post-condition, and the authorized acceptor(s) acknowledge completion
  - Proof: Remove each field and derive a contradiction
    - Remove Intent → No post-condition exists; QA becomes ungrounded; correctness undecidable
    - Remove Stakeholders → No acceptance authority; "done" has no stable meaning
    - Remove Owner → No accountability for execution; "next action" has no assignee; work stalls
    - Remove System Reference → Target boundary undefined; multiple systems could satisfy; acceptance ambiguous
    - Remove Update Set → Cannot attribute cause; cannot reproduce, rollback, audit, or learn
    - Remove QA Document → Evidence has no declared method; cannot falsify claims
    - Remove QA Results → Plan exists but no recorded outcome; stakeholders cannot rationally accept
  - Conclusion: No field is redundant; the contract is minimal for "idea → verified change"
  - Axiom 3: Every contract field must resolve to a concrete value
    - A field resolves if you either
      - Write it on the idea
      - Or explicitly inherit it from the nearest ancestor that defines it
    - Must be written locally
      - Update Set
      - QA Results
    - May be inherited (with explicit reference)
      - Intent
      - Stakeholders
      - Owner
      - System Reference (may narrow)
      - QA Document
- Derived rule: Completion
  - An idea is complete if and only if
    - All contract fields are resolved
    - QA Results are recorded
- States (derived from unresolved fields)
  - Raw
    - Condition
      - Intent unresolved
    - Next step
      - Write Intent
  - Wanting
    - Condition
      - Intent resolved
      - Stakeholders unresolved OR Owner unresolved OR System Reference unresolved
    - Next step
      - Resolve Stakeholders, then Owner, then System Reference
  - Planning
    - Condition
      - Intent + Stakeholders + Owner + System Reference resolved
      - QA Document unresolved OR Update Set unresolved
    - Next step
      - Write QA Document, then Update Set
  - Implementing
    - Condition
      - Intent + Stakeholders + Owner + System Reference + QA Document + Update Set resolved
      - QA Results unresolved
    - Next step
      - Execute QA, record QA Results
  - Done
    - Condition
      - All contract fields resolved
      - QA Results recorded
- FORMALIZATION
  - Purpose
    - Convert PRINCIPLE into machine-checkable rules
    - Enable enforcement, automation, and validation
  - Canonical object
    - Idea
      - The single persistent object for all work
      - Evolves only by resolving contract fields
  - Contract schema (normalized)
    - Intent
      - Type
        - String (one sentence)
      - Required
        - Yes (for executability)
      - Inheritable
        - Yes (explicit reference only)
    - Stakeholders
      - Type
        - List of identifiers (people or systems)
      - Required
        - Yes (for executability)
      - Inheritable
        - Yes (explicit reference only)
    - Owner
      - Type
        - Identifier (person or team)
      - Required
        - Yes (for executability)
      - Inheritable
        - Yes (explicit reference only)
    - System Reference
      - Type
        - Structured pointer (varies by domain: repo/path/symbol for software, doc/version for legal, etc.)
      - Required
        - Yes (for executability)
      - Inheritable
        - Yes (may only narrow)
    - QA Document
      - Type
        - Procedure or checklist reference
      - Required
        - Yes (for executability)
      - Inheritable
        - Yes (explicit reference only)
    - Update Set
      - Type
        - List of concrete deltas
      - Required
        - Yes (local authorship only)
      - Inheritable
        - No
    - QA Results
      - Type
        - Evidence record (pass/fail + artifacts)
      - Required
        - Yes (for completion)
      - Inheritable
        - No
  - Resolution rules
    - Field resolution
      - A field is resolved if
        - It has a local value
        - Or it explicitly references an ancestor value
    - Invalid resolution
      - Blank fields
      - Assumed inheritance without reference
      - Inheriting non-inheritable fields
  - State derivation (pure function)
    - Raw
      - Condition
        - Intent unresolved
    - Wanting
      - Condition
        - Intent resolved
        - Stakeholders unresolved OR System Reference unresolved
    - Planning
      - Condition
        - Intent + Stakeholders + System Reference resolved
        - QA Document unresolved OR Update Set unresolved
    - Implementing
      - Condition
        - Intent + Stakeholders + System Reference + QA Document + Update Set resolved
        - QA Results unresolved
    - Done
      - Condition
        - All contract fields resolved
        - QA Results present
  - Next-action derivation
    - Rule
      - The next action is always the first unresolved required field
    - Order
      - Intent
      - Stakeholders
      - Owner
      - System Reference
      - QA Document
      - Update Set
      - QA Results
  - Validation rules
    - Executable idea
      - Intent resolved
      - Stakeholders resolved
      - Owner resolved
      - System Reference resolved
      - QA Document resolved
      - Update Set resolved
    - Complete idea
      - All executable conditions met
      - QA Results recorded
    - Invalid idea
      - Any required field unresolved without inheritance
      - Any forbidden inheritance
  - Automation hooks
    - derive_state(idea)
    - next_required_field(idea)
    - validate(idea) -> error list
    - is_executable(idea) -> boolean
    - is_complete(idea) -> boolean
  - Practical outcomes
    - No manual stage tracking
    - No silent assumptions
    - Bugs and features handled identically
    - Enforcement replaces discipline
- Enforcement Logic
  > UNIVERSAL ENFORCEMENT LOGIC (language-agnostic)
  >
  > 0) Definitions
  >
  > Contract fields (in order):
  > 1. intent
  > 2. stakeholders
  > 3. owner
  > 4. system_ref
  > 5. qa_doc
  > 6. update_set
  > 7. qa_results
  >
  > Resolution sources:
  > - LOCAL: value stored on the idea itself
  > - INHERITED: explicit pointer to an ancestor's value
  >
  > Non-inheritable fields:
  > - update_set
  > - qa_results
  >
  > Allowed to inherit:
  > - intent
  > - stakeholders
  > - owner
  > - system_ref (with narrowing only)
  > - qa_doc
  >
  > Field "resolved" means:
  > - LOCAL value exists and passes basic shape checks
  >   OR
  > - INHERITED pointer exists and resolves to a concrete ancestor value
  >
  > "Ancestor" means:
  > - walk parent_idea_id repeatedly until null
  > 
  > 
  > 1) Canonical Data Model (minimal)
  >
  > Data Store: Workflowy
  > - Workflowy is the single source of truth for Ideas
  > - Workflowy nodes = Ideas
  > - Workflowy hierarchy = parent/child relationships
  > - Workflowy node content = Context (freeform, not validated)
  > - Contract fields are extracted/parsed from node structure
  >
  > Workflowy conventions:
  > - `#contract` tag = marks a node as a managed Idea
  > - Node name + `#contract` = Idea title
  > - Child nodes with labels = contract fields (exact match, case-sensitive)
  > - Everything else in node = Context (not validated)
  > - State tags (#raw, #wanting, #planning, #implementing, #done) = derived automatically
  > - Removing `#contract` tag = un-manages the Idea
  > - Contracts cannot nest inside contracts (no `#contract` inside `#contract`)
  > - A parent node can have multiple `#contract` children
  > - Contracts must live inside a Project (`#project`) — no orphan contracts
  >
  > Contract field formats in Workflowy:
  > - All fields: label as node name, content as child nodes
  > - Intent: single child node with the intent statement
  > - Stakeholders: bullet children (one per stakeholder)
  > - Owner: single child node with person/team identifier
  > - System Reference: URL or local path as child node
  > - QA Document: URL or local path as child node
  > - Update Set: bullet children (one per delta)
  > - QA Results: bullet children (pass/fail + evidence links)
  >
  > Workflowy-specific mappings:
  > - Inheritance: parent-child node relationships (child inherits from parent)
  > - Explicit inheritance pointer: Workflowy mirror link ((ancestor node name))
  > - Dependencies (blocks/blocked_by): Workflowy mirror nodes link related ideas
  >
  > Idea:
  > - id: string                              # Workflowy node ID
  > - parent_id: string | null                # Workflowy parent node ID
  > - title: string                           # Node name (from Workflowy)
  > - has_contract_tag: boolean               # true if node has #contract tag
  >
  > - intent_local: string | null
  > - intent_inherited_from: string | null    # points to ancestor idea id
  >
  > - stakeholders_local: list<string> | null
  > - stakeholders_inherited_from: string | null
  >
  > - owner_local: string | null
  > - owner_inherited_from: string | null
  >
  > - system_ref_local: SystemRef | null
  > - system_ref_inherited_from: string | null
  >
  > - qa_doc_local: string | null             # could be doc id/url/text pointer
  > - qa_doc_inherited_from: string | null
  >
  > - update_set_local: list<Delta> | null    # MUST be local
  > - qa_results_local: QaResults | null      # MUST be local
  >
  > - blocks: list<string> | null             # IDs of ideas this idea blocks
  > - blocked_by: list<string> | null         # IDs of ideas blocking this idea
  >
  > Context (NOT a contract field):
  > - Everything in the Workflowy node that is NOT a contract field
  > - Parent/sibling/child nodes provide additional context
  > - Workflowy IS the context dump — no separate field needed
  > - Never validated, never required, preserved forever
  >
  > SystemRef (minimal shape - varies by domain):
  > - domain: string          # e.g. "software", "legal", "business", "hiring", "research", "infra"
  > - identifier: string      # primary reference (repo, doc, contract, ATS ID, dataset, account)
  > - path: string | null     # sub-location (file path, section, team, model)
  > - version: string | null  # version/env/hash as applicable
  >
  > Delta (minimal shape):
  > - kind: string            # e.g. "code", "config", "data", "document", "process", "decision"
  > - target: string          # file path / doc section / process step / config key
  > - summary: string         # concrete change statement
  >
  > QaResults (minimal shape):
  > - status: "pass" | "fail"
  > - evidence: list<string>  # links/paths/ids to screenshots/logs/tests/approvals
  >
  > Event Log (optional, local storage):
  > - For audit trail and workflow triggers
  > - Can be stored locally or in separate store
  > - Not required for core contract enforcement
  > - Structure: { idea_id, timestamp, field_changed, old_value, new_value, actor }
  > 
  > 
  > 2) Core Helpers
  > 
  > function is_blank(x):
  >   return x == null OR (x is string AND trim(x) == "") OR (x is list AND length(x) == 0)
  > 
  > function has_local_value(idea, field):
  >   return NOT is_blank(get_local(idea, field))
  > 
  > function has_inherit_ptr(idea, field):
  >   return NOT is_blank(get_inherit_ptr(idea, field))
  > 
  > function ancestors(store, idea):
  >   # yields parent chain, nearest first
  >   cur = idea
  >   while cur.parent_id != null:
  >     cur = store.get(cur.parent_id)
  >     if cur == null: break
  >     yield cur
  > 
  > function resolve_inherited(store, idea, field):
  >   # explicit inheritance only
  >   src_id = get_inherit_ptr(idea, field)
  >   if is_blank(src_id): return (false, null, "missing inheritance pointer")
  > 
  >   # find that ancestor in chain (or allow direct lookup if you trust ids)
  >   for a in ancestors(store, idea):
  >     if [a.id](http://a.id/) == src_id:
  >       if has_local_value(a, field):
  >         return (true, get_local(a, field), null)
  >       else:
  >         return (false, null, "inherit source has no local value for field")
  >   return (false, null, "inherit source not found in ancestor chain")
  > 
  > function resolve_field(store, idea, field):
  >   # non-inheritable fields must be local
  >   if field in ["update_set", "qa_results"]:
  >     if has_local_value(idea, field):
  >       return (true, get_local(idea, field), "local")
  >     return (false, null, "must be local")
  > 
  >   # inheritable fields
  >   if has_local_value(idea, field):
  >     return (true, get_local(idea, field), "local")
  >   if has_inherit_ptr(idea, field):
  >     (ok, val, err) = resolve_inherited(store, idea, field)
  >     if ok: return (true, val, "inherited")
  >     return (false, null, err)
  >   return (false, null, "unresolved")
  > 
  > 
  > 3) System Reference Narrowing Rule (semantic check)
  >
  > Goal:
  > - If system_ref is inherited, child's local system_ref (if present) may NARROW only.
  > - Never broaden beyond ancestor's system_ref.
  >
  > Practical, minimal narrowing check:
  > - Same domain required
  > - Same identifier (or sub-identifier)
  > - child.path must be within or equal to ancestor.path
  >
  > function check_system_ref_narrowing(ancestor_ref, child_ref):
  >   if ancestor_ref.domain != child_ref.domain: return false
  >   if ancestor_ref.identifier != child_ref.identifier: return false
  >   if ancestor_ref.path != null:
  >     if child_ref.path == null: return false
  >     if NOT starts_with(child_ref.path, ancestor_ref.path): return false
  >   return true
  > 
  > 
  > 4) Validation (authoritative)
  >
  > Returns:
  > - errors: list<string>
  > - resolved_map: map<field, {status: resolved/unresolved, source: local/inherited, value?}>
  > - state: one of ["raw", "wanting", "planning", "implementing", "done"]
  > - next_field: string | null
  >
  > function validate_idea(store, idea):
  >   errors = []
  >   resolved_map = {}
  >
  >   # 4.1 Basic inheritance pointer sanity + mutual exclusion (optional but recommended)
  >   for field in ["intent","stakeholders","owner","system_ref","qa_doc"]:
  >     if has_local_value(idea, field) AND has_inherit_ptr(idea, field):
  >       errors.append(field + ": cannot be both local and inherited (pick one)")
  >
  >   # 4.2 Non-inheritable must not have inherit pointers
  >   for field in ["update_set","qa_results"]:
  >     if has_inherit_ptr(idea, field):
  >       errors.append(field + ": inheritance forbidden")
  >
  >   # 4.3 Resolve all fields
  >   for field in ["intent","stakeholders","owner","system_ref","qa_doc","update_set","qa_results"]:
  >     (ok, val, src_or_err) = resolve_field(store, idea, field)
  >     if ok:
  >       resolved_map[field] = { "resolved": true, "source": src_or_err, "value": val }
  >     else:
  >       resolved_map[field] = { "resolved": false, "error": src_or_err }
  >
  >   # 4.4 SystemRef narrowing check when inherited is used
  >   # If child has system_ref_local AND also inherits system_ref, enforce narrowing.
  >   if has_inherit_ptr(idea, "system_ref") AND has_local_value(idea, "system_ref"):
  >     (okA, anc_ref, errA) = resolve_inherited(store, idea, "system_ref")
  >     if okA:
  >       if NOT check_system_ref_narrowing(anc_ref, idea.system_ref_local):
  >         errors.append("system_ref: child broadens beyond inherited scope")
  >     else:
  >       errors.append("system_ref: cannot validate narrowing (" + errA + ")")
  >
  >   # 4.5 Derive state from unresolved fields (deterministic)
  >   state = derive_state(resolved_map)
  >
  >   # 4.6 Next required field (first unresolved in canonical order)
  >   next_field = null
  >   for f in ["intent","stakeholders","owner","system_ref","qa_doc","update_set","qa_results"]:
  >     if resolved_map[f].resolved != true:
  >       next_field = f
  >       break
  >
  >   return { "errors": errors, "resolved_map": resolved_map, "state": state, "next_field": next_field }
  > 
  > 
  > 5) State Derivation (consistent with your doc)
  >
  > function derive_state(resolved_map):
  >   if resolved_map["intent"].resolved != true:
  >     return "raw"
  >   if resolved_map["stakeholders"].resolved != true OR resolved_map["owner"].resolved != true OR resolved_map["system_ref"].resolved != true:
  >     return "wanting"
  >   if resolved_map["qa_doc"].resolved != true OR resolved_map["update_set"].resolved != true:
  >     return "planning"
  >   if resolved_map["qa_results"].resolved != true:
  >     return "implementing"
  >   return "done"
  > 
  > 
  > 6) Write Guard (enforcement at boundaries)
  > 
  > Enforce on every create/update:
  > - Run validate_idea()
  > - If errors not empty -> reject write
  > - Optionally: allow incomplete ideas, but still reject “invalid meaning”:
  >   - forbid forbidden inheritance pointers
  >   - forbid local+inherited simultaneously
  >   - forbid system_ref broadening
  >   - allow unresolved fields (incomplete), but label by state
  > 
  > 
  > 7) Completion Gate (hard)
  > 
  > function can_mark_done(validation_output):
  >   return (length(validation_output.errors) == 0 AND validation_output.state == "done")
  > 
  > 
  > 8) Minimal "Template Fill" Guidance (optional UI logic)
  >
  > Given next_field:
  > - If next_field == "intent": prompt one sentence "what must be true?"
  > - stakeholders: prompt list of accept/reject authorities
  > - owner: prompt person/team responsible for executing the work
  > - system_ref: prompt domain + identifier + path (varies by domain)
  > - qa_doc: prompt checklist/procedure reference
  > - update_set: prompt concrete deltas list
  > - qa_results: prompt pass/fail + evidence links
  > 
- Future Workflows
  - Intent
    > So what I'm looking to do is build this layer and then attach API + LLM AI onto this so I can run workflows such as
    >
    - a) automatically message the stake holders once a project is complete with the QA results
    - b) if missing a QA, validate with the stakeholder
    - c) generate unique ideas from conversation transcript (they must be unique)
  - Stakeholders
  - System Reference
    - Architecture (5 layers)
      - Layer 1: Data Store (Workflowy)
        - Workflowy nodes = Ideas + Context
        - Single source of truth for all idea data
        - Accessed ONLY through Layer 2 (integrity layer)
      - Layer 2: Data Integrity Layer (pure, enforcement)
        - validate(idea) -> errors[]
        - derive_state(idea) -> raw/wanting/planning/implementing/done
        - next_field(idea) -> intent|stakeholders|...|qa_results
        - Write guards: reject invalid changes
        - All writes from any source must pass through this layer
      - Layer 3: Workflow Layer (impure, automations)
        - Primary trigger: field completion → state change → next step prompt
        - Also supports: time-based (stale), manual triggers, #done events
        - Subscribes to idea changes (via event log if enabled)
        - Runs rules: "when X becomes true, do Y"
        - Executes side effects: Slack/email/Jira/GitHub/any external system
        - All writes go through Layer 2 (cannot bypass enforcement)
        - Separate from enforcement to keep enforcement pure
      - Layer 4: AI Service Layer (bounded)
        - Reads: Workflowy data THROUGH integrity layer (keeps guardrails)
        - Writes: proposed patches only (through Layer 2)
        - Never bypasses validate(); the system rejects invalid patches
        - Interprets human intent, answers queries
        - UI: separate panel showing current vs suggested node
        - User can edit suggestion, prompt for revisions, then approve
        - Approve button commits change through integrity layer
      - Layer 5: UI/UX Layer
        - Human interacts with AI chatbot
        - Natural language interface
        - "What's next?", "What's blocking?", "Help me with this idea"
      - Chrome Extension (enforcement mechanism)
        - Tracks keystrokes on contract fields in real-time
        - Calls derive_state() on every contract field edit
        - Updates state tags (#raw, #wanting, #planning, #implementing, #done) automatically
        - Blocks #done tag if QA Results missing
        - Rejects invalid writes → shows error toast to user
        - Non-contract content (Context) remains freeform
  - QA Document
  - Update Set
  - QA Results
- Edge Case Validation
  - Research (ML / experiments)
    - Example idea: "Determine whether feature set A outperforms B on metric M"
    - Intent: "Choose model approach that yields +2% AUC over baseline on dataset D"
    - Stakeholders: "Research lead + you"
    - System Reference: "Repo ml/, dataset D version hash, experiment tracker project"
    - QA Document: "Evaluation protocol: splits, seeds, metric definitions, significance test"
    - Update Set: "Run experiments E1-E6; add new features; change training config; log artifacts"
    - QA Results: "Table of results, confidence intervals, links to runs"
  - Legal (contracts, policy)
    - Example idea: "Update MSA template to include new indemnity clause"
    - Intent: "MSA template includes clause X; approved for use starting date Y"
    - Stakeholders: "Legal counsel + CEO (or whoever signs off)"
    - System Reference: "MSA template doc version, clause library, jurisdiction scope"
    - QA Document: "Review checklist: conflicts, definitions, jurisdiction, consistency, risk notes"
    - Update Set: "Edit sections 8-10; update definitions; update appendix"
    - QA Results: "Redline link + approval email/record + final version ID"
  - Hiring (people/process)
    - Example idea: "Hire a backend engineer for team T"
    - Intent: "Fill role with candidate meeting criteria C, start date S, comp band B"
    - Stakeholders: "Hiring manager + recruiter + finance approver"
    - System Reference: "ATS job req ID, team, budget line"
    - QA Document: "Interview loop rubric, score thresholds, reference check steps"
    - Update Set: "Publish posting; source; interview; debrief; offer; negotiate; finalize"
    - QA Results: "Signed offer + rubric summary + approvals + start date confirmed"