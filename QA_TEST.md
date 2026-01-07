# Contract Enforcer QA Test Plan

## Prerequisites
- Chrome browser
- Access to workflowy.com
- Extension loaded in Chrome

## Test URL
**Use this Workflowy location for testing:** `https://workflowy.com/#/6f9229acbf33`

---

## Phase 1: Extension Loading

### Test 1.1: Load Extension
1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `workflowy_chrome_extension` folder
5. **Expected**: Extension appears with name "Workflowy Contract Enforcer"

### Test 1.2: Verify Scripts Load
1. Navigate to `https://workflowy.com/#/6f9229acbf33`
2. Open DevTools (F12) → Console tab
3. **Expected**: See these logs in order:
   ```
   [Contract Enforcer] Content script loading...
   [Contract Enforcer] Injecting scripts...
   [Contract Storage] API loaded
   [Contract Parser] Loaded
   [Contract Integrity] Loaded
   [Contract UI] Loaded
   [Contract Observer] Loaded
   [Contract Enforcer] Initializing...
   [Contract Enforcer] Modules loaded
   [Contract Enforcer] Workflowy ready
   [Contract Enforcer] Injecting UI styles...
   [Contract Enforcer] Initializing observer...
   [Contract Enforcer] Observer initialized
   [Contract Enforcer] Ready! API available at window.contractEnforcer
   ```

### Test 1.3: Verify API Available
1. In Console, type: `contractEnforcer`
2. **Expected**: Object with methods: `getContracts`, `getIdea`, `validateNode`, `refresh`, `status`, etc.

---

## Phase 2: Contract Detection

### Test 2.1: Create Contract Node
1. In Workflowy, create a new bullet: `Test Contract #contract`
2. **Expected**:
   - Console shows: `[Contract Enforcer] Contract added: Test Contract`
   - Toast notification appears: "Contract Created"

### Test 2.2: Verify Contract Tracked
1. In Console, type: `contractEnforcer.status()`
2. **Expected**: Output shows:
   ```
   [Contract Enforcer] Tracking 1 contracts:
     - Test Contract [raw] next: intent
   ```

### Test 2.3: Remove Contract Tag
1. Edit the node to remove `#contract`: `Test Contract`
2. **Expected**: Console shows: `[Contract Enforcer] Contract removed: Test Contract`

---

## Phase 3: State Progression

### Test 3.1: Raw State (No Intent)
1. Create: `My Idea #contract`
2. In Console: `contractEnforcer.status()`
3. **Expected**: State is `raw`, next field is `intent`

### Test 3.2: Wanting State (Intent Only)
1. Under "My Idea #contract", add child: `Intent`
2. Under "Intent", add child: `User can log in with email`
3. In Console: `contractEnforcer.refresh()` then `contractEnforcer.status()`
4. **Expected**: State is `wanting`, next field is `stakeholders`

### Test 3.3: Add Stakeholders
1. Under "My Idea #contract", add child: `Stakeholders`
2. Under "Stakeholders", add children:
   - `Product Owner`
   - `Tech Lead`
3. Refresh and check status
4. **Expected**: Next field is `owner`

### Test 3.4: Add Owner
1. Under "My Idea #contract", add child: `Owner`
2. Under "Owner", add child: `John Developer`
3. Refresh and check status
4. **Expected**: Next field is `system_ref`

### Test 3.5: Add System Reference
1. Under "My Idea #contract", add child: `System Reference`
2. Under "System Reference", add child: `repo/src/auth/login.ts`
3. Refresh and check status
4. **Expected**: State is `planning`, next field is `qa_doc`

### Test 3.6: Planning State
1. Add child: `QA Document`
2. Under "QA Document", add child: `Test suite in /tests/auth.test.ts`
3. Refresh and check status
4. **Expected**: Next field is `update_set`

### Test 3.7: Add Update Set
1. Add child: `Update Set`
2. Under "Update Set", add children:
   - `Add login endpoint`
   - `Create JWT token generation`
   - `Add password validation`
3. Refresh and check status
4. **Expected**: State is `implementing`, next field is `qa_results`

### Test 3.8: Done State
1. Add child: `QA Results`
2. Under "QA Results", add children:
   - `pass - all tests passing`
   - `screenshot: /evidence/login-success.png`
3. Refresh and check status
4. **Expected**: State is `done`, next field is `null`

---

## Phase 4: Full Contract Structure Reference

Create this structure in Workflowy to test all fields:

```
My Feature #contract
  Intent
    User can authenticate via email/password and receive a JWT token
  Stakeholders
    Product Owner
    Tech Lead
  Owner
    John Developer
  System Reference
    monorepo/src/auth/login.ts
  QA Document
    Test suite: /tests/auth.test.ts
    Acceptance criteria checklist
  Update Set
    Add POST /auth/login endpoint
    Implement JWT generation
    Add password hashing
    Create login form component
  QA Results
    pass - 15/15 tests passing
    screenshot: login-success.png
    deployment log: deploy-123.log
```

---

## Phase 5: UI Feedback

### Test 5.1: Toast Notifications
1. Add `#contract` to a node
2. **Expected**: Blue info toast appears in top-right corner

### Test 5.2: Next Field Prompt
1. Create a new contract with only Intent filled
2. **Expected**: Prompt appears in bottom-right showing:
   - Current state (wanting)
   - Next field needed (Stakeholders)
   - Hint text

### Test 5.3: Toast Auto-Dismiss
1. Trigger a toast notification
2. Wait 5-7 seconds
3. **Expected**: Toast fades out automatically

### Test 5.4: Toast Manual Dismiss
1. Trigger a toast notification
2. Click the X button on the toast
3. **Expected**: Toast closes immediately

---

## Phase 6: Console API

### Test 6.1: Get All Contracts
```javascript
contractEnforcer.getContracts()
```
**Expected**: Array of [id, idea] pairs

### Test 6.2: Get Specific Idea
```javascript
// First get an ID from getContracts()
contractEnforcer.getIdea('some-node-id')
```
**Expected**: Idea object with all parsed fields

### Test 6.3: Validate Node
```javascript
contractEnforcer.validateNode('some-node-id')
```
**Expected**: Object with `errors`, `resolved_map`, `state`, `next_field`

### Test 6.4: Get Next Field
```javascript
contractEnforcer.getNextField('some-node-id')
```
**Expected**: `{ field: 'stakeholders', prompt: 'Who can accept...' }`

### Test 6.5: Force Refresh
```javascript
contractEnforcer.refresh()
```
**Expected**: Store rebuilds, all contracts re-validated

### Test 6.6: Status Summary
```javascript
contractEnforcer.status()
```
**Expected**: Formatted list of all contracts with states

---

## Phase 7: Edge Cases

### Test 7.1: Empty Contract
1. Create: `Empty #contract` (no children)
2. **Expected**: State is `raw`, no errors

### Test 7.2: Misspelled Field Label
1. Create contract with child: `Intents` (wrong spelling)
2. **Expected**: Field not recognized, state remains `raw`

### Test 7.3: Multiple Contracts
1. Create 3 different contracts
2. Run `contractEnforcer.status()`
3. **Expected**: All 3 listed with correct states

### Test 7.4: Nested Content (Not Nested Contracts)
1. Create contract with deep nesting in Update Set
2. **Expected**: Only top-level items in Update Set parsed

### Test 7.5: Page Reload
1. Create a contract, note its state
2. Reload the page (F5)
3. Check `contractEnforcer.status()`
4. **Expected**: Contract still tracked with same state

---

## Phase 8: Error Scenarios

### Test 8.1: No Workflowy (Timeout)
1. Load extension on a non-Workflowy page
2. **Expected**: Graceful failure, no crashes

### Test 8.2: Console Errors
1. Throughout all tests, monitor Console for red errors
2. **Expected**: No uncaught exceptions

---

## Test Results Template

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| 1.1 Load Extension | | |
| 1.2 Verify Scripts Load | | |
| 1.3 Verify API Available | | |
| 2.1 Create Contract Node | | |
| 2.2 Verify Contract Tracked | | |
| 2.3 Remove Contract Tag | | |
| 3.1 Raw State | | |
| 3.2 Wanting State | | |
| 3.3 Add Stakeholders | | |
| 3.4 Add Owner | | |
| 3.5 Add System Reference | | |
| 3.6 Planning State | | |
| 3.7 Add Update Set | | |
| 3.8 Done State | | |
| 5.1 Toast Notifications | | |
| 5.2 Next Field Prompt | | |
| 6.1-6.6 Console API | | |
| 7.1-7.5 Edge Cases | | |
| 8.1-8.2 Error Scenarios | | |

---

## Quick Smoke Test (5 minutes)

1. Load extension
2. Go to `https://workflowy.com/#/6f9229acbf33`
3. Check console for "Ready!" message
4. Create: `Quick Test #contract`
5. Run `contractEnforcer.status()` - should show 1 contract in `raw` state
6. Add Intent child with content
7. Run `contractEnforcer.refresh()` then `status()` - should show `wanting` state
8. ✅ If all above work, basic functionality is confirmed
