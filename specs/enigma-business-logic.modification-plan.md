# Enigma Business Logic Modification Plan

## Scope

This is the Phase3 analysis and proposed solution plan based on `specs/enigma-business-logic.results.md`. It does not implement code changes.

The target behavior is the Phase1 model:

- Three-rotor Enigma I / M3-style machine.
- UI rotor slots are left-to-right: rotor 1 = left/slow, rotor 2 = middle, rotor 3 = right/fast.
- Rotor stepping happens before encryption.
- Forward signal path is right-to-left through rotors, then reflector, then left-to-right back through rotors.
- Plugboard pairs are physical cables, represented once in UI/config and applied reciprocally in the machine.
- Ring setting is a separate rotor setting from visible position.

## Phase2 Outcome Summary

Phase2 executed 36 scenarios.

| Status | Count |
|---|---:|
| PASS | 6 |
| FAIL | 30 |
| BLOCKED | 0 |

Passing areas:

- App shell loads and exposes rotor/reflector controls.
- Standard rotor and reflector wiring maps are available from API.
- Invalid malformed API request returns validation status rather than a raw server crash.
- The current machine still preserves the weak Enigma invariant that no letter encrypts to itself in the tested 26-key sequence.

Failing areas:

- Required machine configuration is not validated before encryption.
- Canonical Enigma outputs are wrong.
- Rotor stepping and turnover are wrong.
- Plugboard UI state/visual behavior is wrong.
- Reset/reconfiguration scenarios fail because the core encryption and plugboard behavior are wrong.
- Ring setting is missing.
- Rotor position display exposes raw wiring text.

## Failure Groups And Likely Roots

| Failure Group | Scenarios | User-visible Feature | Primary Root |
|---|---|---|---|
| Missing frontend validation | 1.3 | Pressing a key before selecting rotors appends input and shows generic error | `handleKeyPress` appends input before validating config |
| Core encryption mismatch | 2.1, 2.2, 2.3, 4.1-4.5, 6.1, 6.3, 6.4, 7.1, 8.1, 8.2, 9.3 | Expected reference outputs do not match observed outputs | Rotor traversal order and stepping orientation are reversed/incorrect |
| Turnover/double-stepping mismatch | 3.1-3.4 | Fast rotor and middle rotor do not advance according to Enigma rules | `step_rotors` rotates the left rotor every key and checks the wrong notch |
| Plugboard failures | 5.1-5.6, 6.2, 7.2 | Empty board already has a line; drag pairs do not produce expected stable cable behavior | Placeholder empty pair is rendered; pair representation is duplicated and fragile |
| Ring setting gap | 10.1, 10.2 | No ring setting controls exist | Schema, backend model, API, and UI do not include ring setting |
| Display mismatch | 8.2 | Rotor windows show raw wiring before position | UI renders `rotor.wiring` instead of rotor index/name |

## Code Findings

### 1. Backend Enigma Core Has The Main Cryptographic Bug

File: `services/enigma-api/app/core/machine.py`

Findings:

- `step_rotors` assigns `right, middle, left = self.rotors[2], self.rotors[1], self.rotors[0]`, but then always calls `left.rotate()` at line 70. With the Phase1 rotor order, `self.rotors[0]` is the left/slow rotor, so the slow rotor advances on every keypress.
- Turnover logic checks `left.at_notch()` at line 67, but the middle rotor should step when the right/fast rotor is at its notch. The left rotor should step when the middle rotor is at its notch.
- `encrypt_letter` forwards through `for rotor in self.rotors` at line 84. For left-to-right UI order this sends the signal left-to-right, but Enigma forward traversal must be right-to-left.
- The backward pass uses `reversed(self.rotors)` at line 91. It should be the opposite: after reflection, traverse left-to-right.
- The observed output confirms this: selecting `I-II-III` produced `MFNCZBBFZM`, which is the Phase1 reference output for `III-II-I`.

Required backend correction:

```python
# conceptual rotor order
left, middle, right = self.rotors

# step before encryption
middle_at_notch = middle.at_notch()
right_at_notch = right.at_notch()

if middle_at_notch:
    left.rotate()
if right_at_notch or middle_at_notch:
    middle.rotate()
right.rotate()

# signal path
for rotor in reversed(self.rotors):  # right -> middle -> left
    c = rotor.forward_substitute(c)

c = self.reflector.reflect(c)

for rotor in self.rotors:           # left -> middle -> right
    c = rotor.backward_substitute(c)
```

When ring settings are added, `at_notch()` must account for the ring-adjusted turnover position.

### 2. Backend Model Does Not Support Ring Setting

Files:

- `services/enigma-api/app/models/schemas.py`
- `services/enigma-api/app/core/machine.py`
- `services/enigma-api/app/routes/enigma.py`

Findings:

- `RotorConfig` only has `index`, `wiring`, and `position`.
- `Rotor` only stores `wiring`, `notch`, and `position`.
- There is no ring setting in the request, backend rotor model, stepping logic, or substitution formula.

Required backend correction:

- Add `ring_setting` to `RotorConfig`, defaulting to `A` for backward-compatible requests.
- Store ring offset in `Rotor`.
- Apply ring offset in forward/backward substitution:
  - enter rotor: `input_index + position_offset - ring_offset`
  - leave rotor: `mapped_index - position_offset + ring_offset`
- Adjust notch detection for ring setting.
- Add reference tests for `AAA` ring first, then one non-`A` ring case.

### 3. API Trusts Frontend Wiring And Converts Domain Errors Into 500

File: `services/enigma-api/app/routes/enigma.py`

Findings:

- `/encrypt` accepts `wiring` from the frontend and uses it directly to construct `Rotor`.
- Domain lookup failures such as empty rotor index are caught by the broad `except Exception` and returned as status `500`.
- The frontend then shows a generic "加密过程出错，请重试".

Required API correction:

- Do not trust frontend-supplied wiring as the source of truth. Request should identify rotors by `index`; backend should load wiring/notch from `constants.py`.
- Validate:
  - plaintext is exactly one alphabetic character.
  - exactly three rotors are provided.
  - rotor indexes exist.
  - positions and ring settings are `A-Z`.
  - reflector exists.
  - plugboard pairs are valid, unique, non-self, and at most 10.
- Raise `HTTPException(status_code=422, detail=...)` or use Pydantic validators for domain errors.
- Remove `print` tracing from core encryption or replace with structured debug logging.

### 4. Frontend Input Handling Mutates UI Before Validation

File: `apps/enigma-frontend/src/components/EnigmaSimulator.tsx`

Findings:

- `handleKeyPress` appends plaintext immediately at line 62, before checking rotor selection or before the API succeeds.
- If the API fails, the input remains changed and only a generic error is shown at line 93.
- This caused scenario 1.3: observed input `A`, output empty, generic error message.
- Rapid clicks can send multiple requests with stale `selectedRotors` because encryption is asynchronous and there is no queue or keyboard lock.

Required frontend correction:

- Before appending input, validate:
  - all three rotors have selected indexes.
  - reflector is selected.
  - no duplicate or invalid plugboard configuration exists.
- Only append plaintext and ciphertext after successful encryption.
- Clear stale errors on successful configuration/encryption.
- Add either:
  - a simple `isEncrypting` lock that disables keyboard buttons during an in-flight request, or
  - a proper sequential input queue so rapid clicks are processed using the latest returned rotor positions.

### 5. Plugboard State Model Is Incorrect

File: `apps/enigma-frontend/src/components/PlugboardConfig.tsx`

Findings:

- The parent initializes `plugPairs` with `{ from: '', to: '' }` in `EnigmaSimulator.tsx`. `PlugboardConfig.renderLines` maps all pairs without filtering invalid letters, so an empty pair is rendered as a solid line at `(0,0)`.
- Phase2 saw `Plugboard solid SVG lines: 1` even on an empty board.
- `onPointerUp` adds both `{ from, to }` and `{ from: to, to: from }`, but the backend `Plugboard` already makes every pair reciprocal.
- `usedLetters` is a separate local state instead of derived from `plugPairs`, so it can desynchronize after removals or parent resets.
- There is no max 10-pair enforcement.
- `error` state exists but is never set for duplicate/self/max-pair failures.
- `onClick={removePair(ch)}` is attached to every plugboard letter. This can conflict with drag behavior and makes removal semantics ambiguous.

Required plugboard correction:

- Store physical plugboard cables once:
  - initial state: `[]`
  - example: `{ from: 'A', to: 'M' }`
- Derive `usedLetters` from current pairs instead of storing it independently.
- Filter invalid pairs before rendering and before API submission.
- Reject:
  - self-pairs,
  - reused letters,
  - more than 10 pairs.
- Set visible validation messages for rejected actions.
- Use explicit pair removal behavior:
  - either click a cable/pair label to remove,
  - or only allow letter click removal when no drag has just occurred.
- Send each physical pair once to the backend.

Note: Some Phase2 plugboard assertions counted implementation-specific SVG lines. After normalizing to one physical cable per pair, update the Playwright assertion to check visible pair endpoints rather than expecting reciprocal duplicate line counts.

### 6. Rotor Display Uses Raw Wiring Instead Of User-facing Identity

File: `apps/enigma-frontend/src/components/EnigmaSimulator.tsx`

Finding:

- Rotor windows render `{rotor.wiring}: {rotor.position}` at line 161.
- Phase2 evidence shows windows such as `EKMFLGDQVZNTOWYHXUSPAIBRCJ: B`.

Required display correction:

- Render user-facing rotor identity and position, for example:
  - `I: B`
  - `Rotor I / Position B`
  - optionally include ring setting once implemented.
- Keep wiring available only inside visualization/debug details.

### 7. Frontend API Types Are Too Loose Or Inaccurate

File: `apps/enigma-frontend/src/services/api.ts`

Findings:

- `EncryptRequest.rotors` is typed as `Rotor[]`, but the actual request sends `RotorSelection[]` with positions.
- `EncryptResponse.forwardResult` and `backwardResult` are typed as tuple arrays, while the backend schema returns dictionaries.
- Hardcoded `API_BASE_URL = 'http://localhost:8000'` is acceptable for local tests but should become environment-configurable if this app is deployed.

Required typing correction:

- Define a request rotor type that includes `index`, `position`, and `ringSetting`.
- Remove frontend-supplied `wiring` from the encrypt request after backend starts deriving wiring from index.
- Align path result types with the backend response.

## Recommended Implementation Sequence

### Step 1. Lock The Backend Reference Behavior

Add backend unit tests before changing implementation.

Suggested files:

- `services/enigma-api/tests/test_machine_reference.py`
- `services/enigma-api/tests/test_api_validation.py`

Minimum test cases:

- `I-II-III`, `AAA`, reflector `B`, `A -> B`, positions `AAB`.
- `I-II-III`, `AAA`, reflector `B`, `AAAAA -> BDZGO`.
- `I-II-III`, `AAA`, reflector `B`, `HELLOWORLD -> ILBDAAMTAZ`.
- Turnover from `AAU` and double-step from `ADU`.
- Plugboard `A-M`, `A -> D`.
- Invalid rotor index returns validation status.

Acceptance:

- Backend unit tests pass without starting the frontend.

### Step 2. Correct Backend Rotor Order, Stepping, And Signal Traversal

Change only the cryptographic core first:

- Fix `step_rotors`.
- Fix forward/backward traversal order.
- Keep existing ring setting default behavior equivalent to `AAA`.
- Preserve stateless single-character API behavior.

Acceptance:

- API scenario 9.3 passes.
- Canonical UI scenarios should start producing the expected ciphertext once frontend sends valid config.

### Step 3. Add Domain Validation To API

Add Pydantic validators or explicit route-level validation.

Acceptance:

- Invalid rotor or incomplete config returns `400/422`.
- No user-correctable domain error is returned as `500`.

### Step 4. Fix Frontend Preflight Validation And Async Input Flow

Change `handleKeyPress` behavior:

- Validate selected rotors before API call.
- Append input/output only on success.
- Add keyboard lock or sequential queue.
- Surface specific validation messages.

Acceptance:

- Scenario 1.3 passes.
- Rapid-click scenario is deterministic.

### Step 5. Normalize Plugboard State And UI

Change plugboard representation to one physical cable per pair.

Acceptance:

- Empty board renders zero cables.
- Creating `A-M` changes encryption result.
- Duplicate/self-pairs are rejected with visible feedback.
- Ten-pair limit is enforced.
- Reset behavior intentionally preserves or clears plugboard according to product decision; Phase1 expects preserve.

### Step 6. Add Ring Setting End-to-end

Add ring setting to:

- Backend schema.
- `Rotor`.
- Notch calculation.
- Substitution math.
- Frontend rotor controls.
- API request type.

Acceptance:

- Ring setting controls exist per rotor.
- `AAA` ring setting still matches all canonical reference outputs.
- A non-`A` ring setting changes output and turnover as expected.

### Step 7. Clean Up Display And Visualization

Change rotor windows to user-facing labels and remove debug console/print noise.

Acceptance:

- Rotor window no longer exposes raw wiring as the primary label.
- Lampboard test passes once ciphertext is correct.

### Step 8. Re-run Phase2

Run:

```powershell
cd apps\enigma-frontend
npx playwright test enigma-business-logic.spec.ts
```

Expected after all functional fixes:

- 36/36 pass, or
- if product decides ring settings are out of scope, update Phase1/Phase2 specs to mark scenarios 10.1 and 10.2 as explicit known gaps rather than failures.

## Directory-level Responsibility After Fixes

Recommended ownership:

- `services/enigma-api/app/core/constants.py`
  - Owns historical rotor/reflector wirings and notch constants.
- `services/enigma-api/app/core/machine.py`
  - Owns pure Enigma mechanics: plugboard, rotor math, stepping, reflection, encryption path.
  - Should not know HTTP or frontend concerns.
- `services/enigma-api/app/models/schemas.py`
  - Owns request/response shape and validation constraints.
- `services/enigma-api/app/routes/enigma.py`
  - Owns API orchestration: validate request, construct machine from server constants, return response.
- `apps/enigma-frontend/src/services/api.ts`
  - Owns frontend API contract types and transport details.
- `apps/enigma-frontend/src/components/EnigmaSimulator.tsx`
  - Owns user workflow state: selected config, message input/output, async request sequencing, reset semantics.
- `apps/enigma-frontend/src/components/RotorSelector.tsx`
  - Owns rotor index, position, and ring setting controls.
- `apps/enigma-frontend/src/components/PlugboardConfig.tsx`
  - Owns physical plugboard cable editing and validation feedback.

## Residual Risks

- The current Phase2 plugboard line-count assertions are partly implementation-specific. Keep the user-level requirement, but update assertions after the plugboard representation is normalized.
- If the project intends a different rotor order convention than Phase1, the UI must label that convention explicitly and the reference oracle must be regenerated. The current results strongly indicate the UI and backend are not aligned.
- Ring setting support changes both API and UI contracts. Add it with `A` defaults to keep existing simple configurations stable.
