# Contract Enforcer - UI QA Test

**Test Location:** https://workflowy.com/#/8f6977a9d862

> ⚠️ **IMPORTANT:** Create ALL test nodes INSIDE this location only.
> DO NOT create, delete, or modify anything OUTSIDE of this node.

---

## Test 1: Extension Loads Successfully

**Steps:**
1. Open Chrome
2. Go to https://workflowy.com/#/8f6977a9d862
3. Wait for page to fully load

**Expected Result:**
- [ ] Page loads normally
- [ ] No error popups appear
- [ ] Workflowy functions normally (can click, type, navigate)

---

## Test 2: Create a Contract

**Steps:**
1. Create a new bullet point
2. Type: `My First Contract #contract`
3. Press Enter

**Expected Result:**
- [ ] Blue toast notification appears in top-right corner
- [ ] Toast says "Contract Created"
- [ ] Toast shows message: `"My First Contract" is now a managed idea`
- [ ] Toast disappears after ~4 seconds

---

## Test 3: Next Field Prompt Appears

**Steps:**
1. After creating the contract from Test 2, look at bottom-right corner

**Expected Result:**
- [ ] Small white card appears in bottom-right
- [ ] Card shows state badge (gray "RAW")
- [ ] Card shows "Next: Intent"
- [ ] Card shows hint: "What must be true after completion?"

---

## Test 4: Add Intent Field

**Steps:**
1. Under `My First Contract #contract`, create a child bullet
2. Type: `Intent`
3. Under `Intent`, create a child bullet
4. Type: `User can successfully log in with email and password`

**Your structure should look like:**
```
My First Contract #contract
  Intent
    User can successfully log in with email and password
```

**Expected Result:**
- [ ] Toast notification appears showing state change
- [ ] Bottom-right prompt updates to show "WANTING" state (amber/yellow)
- [ ] Next field now shows "Stakeholders"

---

## Test 5: Add Stakeholders Field

**Steps:**
1. Under `My First Contract #contract`, create another child bullet
2. Type: `Stakeholders`
3. Under `Stakeholders`, add children:
   - `Product Owner`
   - `Tech Lead`

**Your structure should look like:**
```
My First Contract #contract
  Intent
    User can successfully log in with email and password
  Stakeholders
    Product Owner
    Tech Lead
```

**Expected Result:**
- [ ] Prompt updates, next field is now "Owner"

---

## Test 6: Add Owner Field

**Steps:**
1. Under `My First Contract #contract`, create child: `Owner`
2. Under `Owner`, add child: `John Developer`

**Expected Result:**
- [ ] Prompt updates, next field is now "System Reference"

---

## Test 7: Add System Reference Field

**Steps:**
1. Add child: `System Reference`
2. Under it, add: `monorepo/src/auth/login.ts`

**Expected Result:**
- [ ] State changes to "PLANNING" (blue badge)
- [ ] Next field is now "QA Document"

---

## Test 8: Add QA Document Field

**Steps:**
1. Add child: `QA Document`
2. Under it, add: `Test suite at /tests/auth.test.ts`

**Expected Result:**
- [ ] Next field is now "Update Set"

---

## Test 9: Add Update Set Field

**Steps:**
1. Add child: `Update Set`
2. Under it, add multiple children:
   - `Add login API endpoint`
   - `Implement JWT token generation`
   - `Create login form component`

**Expected Result:**
- [ ] State changes to "IMPLEMENTING" (purple badge)
- [ ] Next field is now "QA Results"

---

## Test 10: Complete the Contract

**Steps:**
1. Add child: `QA Results`
2. Under it, add:
   - `pass - all 12 tests passing`
   - `screenshot: login-success.png`

**Expected Result:**
- [ ] State changes to "DONE" (green badge)
- [ ] Success toast appears
- [ ] Next field prompt may disappear or show "done"

---

## Test 11: Remove Contract Tag

**Steps:**
1. Edit `My First Contract #contract`
2. Remove the `#contract` tag so it's just `My First Contract`
3. Press Enter

**Expected Result:**
- [ ] Bottom-right prompt disappears
- [ ] Contract is no longer tracked

---

## Test 12: Toast Close Button

**Steps:**
1. Create a new contract: `Toast Test #contract`
2. When toast appears, click the X button on the toast

**Expected Result:**
- [ ] Toast closes immediately when X is clicked

---

## Test 13: Multiple Contracts

**Steps:**
1. Create three contracts:
   - `Project Alpha #contract`
   - `Project Beta #contract`
   - `Project Gamma #contract`

**Expected Result:**
- [ ] Each creation shows a toast
- [ ] Prompt shows the most recently selected/edited contract

---

## Test 14: Page Refresh Persistence

**Steps:**
1. Create a contract with Intent filled in
2. Press F5 to refresh the page
3. Wait for page to load

**Expected Result:**
- [ ] Extension reinitializes (may see brief toast)
- [ ] Contract is still recognized
- [ ] State is preserved (still "wanting" if Intent was filled)

---

## Final Contract Structure Reference

A complete contract should look like this in Workflowy:

```
Feature Name #contract
  Intent
    [What must be true when this is done - one sentence]
  Stakeholders
    [Person who can accept/reject]
    [Another person]
  Owner
    [Person doing the work]
  System Reference
    [Where the change happens - file path, doc, etc.]
  QA Document
    [How success will be measured]
  Update Set
    [Concrete action 1]
    [Concrete action 2]
    [Concrete action 3]
  QA Results
    [pass/fail + evidence]
    [link to proof]
```

---

## Test Results

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1. Extension Loads | ✅ | | Page loads normally, no errors |
| 2. Create Contract | ✅ | | Blue toast notification appeared |
| 3. Next Field Prompt | ✅ | | Bottom-right card showed RAW state |
| 4. Add Intent | ✅ | | State changed to WANTING (amber) |
| 5. Add Stakeholders | ✅ | | Next field updated to Owner |
| 6. Add Owner | ✅ | | Next field updated to System Reference |
| 7. Add System Reference | ✅ | | State changed to PLANNING (blue) |
| 8. Add QA Document | ✅ | | Next field updated to Update Set |
| 9. Add Update Set | ✅ | | State changed to IMPLEMENTING (purple) |
| 10. Complete Contract | ✅ | | State changed to DONE (green) |
| 11. Remove Contract Tag | ✅ | | Prompt disappeared, contract untracked |
| 12. Toast Close Button | ✅ | | Toast closed immediately on X click |
| 13. Multiple Contracts | ✅ | | Each contract showed toast notification |
| 14. Page Refresh | ✅ | | Contract state preserved after reload |

---

## Known Limitations

- Mobile browsers/apps will bypass enforcement
- Contract fields must be exact spelling: `Intent`, `Stakeholders`, `Owner`, `System Reference`, `QA Document`, `Update Set`, `QA Results`
- State tags (#raw, #wanting, etc.) are auto-managed - don't add them manually
