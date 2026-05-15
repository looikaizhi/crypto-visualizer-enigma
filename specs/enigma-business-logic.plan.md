# Enigma Business Logic Test Plan

## Phase

Phase1: define the test surface and executable Playwright scenarios. This file is the input for Phase2 automation and should not be treated as a bug report by itself.

## Application Overview

The application is an Enigma simulator with a React frontend and FastAPI backend. The user configures three rotors, their visible positions, a reflector, and plugboard pairs, then presses the on-screen keyboard to encrypt one character at a time. After each key press, the backend returns the ciphertext character and updated rotor positions; the frontend updates the input text, output text, lampboard, and rotor windows.

## Scope And Assumptions

- Target machine model: Enigma I / M3-style three-rotor machine.
- Rotor order in the UI/API is expected to be left-to-right: `Rotor 1 = left/slow`, `Rotor 2 = middle`, `Rotor 3 = right/fast`.
- Rotor stepping happens before encryption.
- Rotor III notch is `V`; rotor II notch is `E`; double-stepping must be supported.
- Ring settings are part of a full Enigma configuration, but the current UI/API surface found in Phase1 does not expose ring settings. Tests include this as a business coverage gap scenario.
- Unless a scenario says otherwise, use rotors `I`, `II`, `III`; positions `A`, `A`, `A`; reflector `B`; no plugboard pairs.
- Expected ciphertext values are reference-oracle outputs for the standard historical wirings in `services/enigma-api/app/core/constants.py`, with ring setting `AAA`.
- Each scenario must start from a fresh app state. Do not chain scenarios.

## Playwright Setup Notes For Phase2

- Current repository has no local Playwright config and no installed Playwright package.
- Phase2 should first bootstrap Playwright or add an agreed test workspace before generating tests.
- Suggested seed file: `tests/seed.spec.ts`.
- Suggested seed behavior: navigate to `http://localhost:3000/` after the backend is running at `http://localhost:8000/`.
- Preferred run flow from the `playwright-cli` skill:
  1. Run the seed with `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/seed.spec.ts --debug=cli`.
  2. Attach with `playwright-cli attach tw-XXXX`.
  3. Use `playwright-cli snapshot` to identify refs before every scenario generation.
  4. Stop the debug run before moving to the next scenario.
- Locator hints from Phase1 code inspection:
  - Rotor selects: `select.rotor-select`, three instances.
  - Position selects: `select.position-select`, three instances.
  - Reflector select: `select.reflector-select`.
  - Keyboard buttons: `.keyboard-key`, text `A` through `Z`.
  - Plugboard letters: `.plugboard-container .box`, text `A` through `Z`.
  - Input/output display blocks: `.input-section .input-output-text` and `.output-section .input-output-text`.
  - Rotor position display: `.rotor-window`.
  - Lamp letters: `.lampboard .lamp`.
  - Reset: `button.reset-button`.
- If the live snapshot exposes stronger accessible locators, use those instead of CSS.

## Reference Oracle

All expected values below assume UI/API rotor order is `left, middle, right`.

| Configuration | Plaintext | Expected Ciphertext | Expected Position Trace |
|---|---:|---:|---|
| I-II-III, AAA, Reflector B, no plugboard | `A` | `B` | `AAB` |
| I-II-III, AAA, Reflector B, no plugboard | `AAAAA` | `BDZGO` | `AAB`, `AAC`, `AAD`, `AAE`, `AAF` |
| I-II-III, AAA, Reflector B, no plugboard | `HELLOWORLD` | `ILBDAAMTAZ` | final `AAK` |
| I-II-III, AAA, Reflector B, plugboard `A-M` | `A` | `D` | `AAB` |
| I-II-III, AAA, Reflector B, plugboard `A-M`, `C-Z` | `HELLOWORLD` | `ILBDMMATMC` | final `AAK` |
| I-II-III, AAA, Reflector A, no plugboard | `HELLOWORLD` | `KCUBRKIDKN` | final `AAK` |
| I-II-III, AAA, Reflector C, no plugboard | `HELLOWORLD` | `XKVWSXCNHR` | final `AAK` |
| III-II-I, AAA, Reflector B, no plugboard | `HELLOWORLD` | `MFNCZBBFZM` | final `AAK` |
| II-IV-V, AAA, Reflector B, no plugboard | `HELLOWORLD` | `MQTVFBSMJX` | final `AAK` |
| I-II-III, BCD, Reflector B, no plugboard | `AAAAA` | `RNOOV` | final `BCI` |
| I-II-III, AAU, Reflector B, no plugboard | `AAAAAA` | `MUQOFX` | `AAV`, `ABW`, `ABX`, `ABY`, `ABZ`, `ABA` |
| I-II-III, ADU, Reflector B, no plugboard | `AAAA` | `EQIB` | `ADV`, `AEW`, `BFX`, `BFY` |
| I-II-III, ADV, Reflector B, no plugboard | `AA` | `QI` | `AEW`, `BFX` |

## Test Scenarios

### 1. Initialization And Configuration Surface

**Seed:** `tests/seed.spec.ts`

#### 1.1. loads-enigma-simulator

**File:** `tests/enigma/loads-enigma-simulator.spec.ts`

**Steps:**
  1. Navigate to the seed page and wait for initialization to finish.
    - expect: heading `Enigma 密码机模拟器` is visible.
    - expect: no `初始化失败，请刷新页面重试` error is visible.
    - expect: three rotor selectors are visible.
    - expect: three rotor position selectors are visible.
    - expect: one reflector selector is visible.
    - expect: plugboard letters `A` through `Z` are visible.
    - expect: keyboard buttons `A` through `Z` are visible.
    - expect: input and output displays show waiting/empty state.

#### 1.2. exposes-standard-rotors-and-reflectors

**File:** `tests/enigma/exposes-standard-rotors-and-reflectors.spec.ts`

**Steps:**
  1. Open each rotor selector.
    - expect: rotor options `I`, `II`, `III`, `IV`, `V` are available.
    - expect: no duplicate rotor option labels are present inside a selector.
  2. Open the reflector selector.
    - expect: reflector options `A`, `B`, `C` are available.
  3. Inspect each rotor position selector.
    - expect: position options `A` through `Z` are available.

#### 1.3. blocks-encryption-until-required-machine-config-is-complete

**File:** `tests/enigma/blocks-encryption-until-required-machine-config-is-complete.spec.ts`

**Steps:**
  1. Start from the default page state without selecting rotors.
  2. Press keyboard button `A`.
    - expect: the app shows a user-facing validation message explaining that all three rotors must be selected.
    - expect: no ciphertext is appended to the output display.
    - expect: no plaintext is appended to the input display.
    - expect: no backend `500` error is surfaced as the normal validation path.

### 2. Canonical Encryption

**Seed:** `tests/seed.spec.ts`

#### 2.1. encrypts-single-letter-with-canonical-aaa-config

**File:** `tests/enigma/encrypts-single-letter-with-canonical-aaa-config.spec.ts`

**Steps:**
  1. Select rotors `I`, `II`, `III` in rotor slots 1, 2, 3.
    - expect: each selected rotor remains selected.
  2. Set positions to `A`, `A`, `A`.
    - expect: rotor windows show `A`, `A`, `A` in left-to-right order.
  3. Select reflector `B`.
    - expect: reflector `B` remains selected.
  4. Press keyboard button `A`.
    - expect: input display is `A`.
    - expect: output display is `B`.
    - expect: rotor windows show `A`, `A`, `B`.
    - expect: lamp `B` becomes active shortly after the click.

#### 2.2. encrypts-hello-world-with-canonical-config

**File:** `tests/enigma/encrypts-hello-world-with-canonical-config.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press keyboard buttons for `HELLOWORLD` in order.
    - expect: input display is `HELLOWORLD`.
    - expect: output display is `ILBDAAMTAZ`.
    - expect: rotor windows show final positions `A`, `A`, `K`.
    - expect: output length equals input length.

#### 2.3. encrypts-repeated-a-sequence-with-position-trace

**File:** `tests/enigma/encrypts-repeated-a-sequence-with-position-trace.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press `A`.
    - expect: output display is `B`.
    - expect: rotor windows show `A`, `A`, `B`.
  3. Press `A`.
    - expect: output display is `BD`.
    - expect: rotor windows show `A`, `A`, `C`.
  4. Press `A`.
    - expect: output display is `BDZ`.
    - expect: rotor windows show `A`, `A`, `D`.
  5. Press `A`.
    - expect: output display is `BDZG`.
    - expect: rotor windows show `A`, `A`, `E`.
  6. Press `A`.
    - expect: output display is `BDZGO`.
    - expect: rotor windows show `A`, `A`, `F`.

#### 2.4. no-letter-ever-encrypts-to-itself-at-a-keypress

**File:** `tests/enigma/no-letter-ever-encrypts-to-itself-at-a-keypress.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press keyboard buttons `A` through `Z` once each.
    - expect: input display is `ABCDEFGHIJKLMNOPQRSTUVWXYZ`.
    - expect: output display contains 26 uppercase letters.
    - expect: for every character index, plaintext character and ciphertext character differ.

### 3. Rotor Stepping And Turnover

**Seed:** `tests/seed.spec.ts`

#### 3.1. advances-rightmost-rotor-before-each-encryption

**File:** `tests/enigma/advances-rightmost-rotor-before-each-encryption.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press `A`.
    - expect: output display is `B`.
    - expect: positions are `A`, `A`, `B`.
  3. Press `A`.
    - expect: output display is `BD`.
    - expect: positions are `A`, `A`, `C`.

#### 3.2. advances-middle-rotor-when-right-rotor-is-at-notch

**File:** `tests/enigma/advances-middle-rotor-when-right-rotor-is-at-notch.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `U`, reflector `B`, no plugboard.
  2. Press `A`.
    - expect: output display is `M`.
    - expect: positions are `A`, `A`, `V`.
  3. Press `A`.
    - expect: output display is `MU`.
    - expect: positions are `A`, `B`, `W`.

#### 3.3. performs-double-stepping-at-middle-rotor-notch

**File:** `tests/enigma/performs-double-stepping-at-middle-rotor-notch.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `D`, `U`, reflector `B`, no plugboard.
  2. Press `A`.
    - expect: output display is `E`.
    - expect: positions are `A`, `D`, `V`.
  3. Press `A`.
    - expect: output display is `EQ`.
    - expect: positions are `A`, `E`, `W`.
  4. Press `A`.
    - expect: output display is `EQI`.
    - expect: positions are `B`, `F`, `X`.
  5. Press `A`.
    - expect: output display is `EQIB`.
    - expect: positions are `B`, `F`, `Y`.

#### 3.4. preserves-turnover-behavior-when-starting-at-adv

**File:** `tests/enigma/preserves-turnover-behavior-when-starting-at-adv.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `D`, `V`, reflector `B`, no plugboard.
  2. Press `A`.
    - expect: output display is `Q`.
    - expect: positions are `A`, `E`, `W`.
  3. Press `A`.
    - expect: output display is `QI`.
    - expect: positions are `B`, `F`, `X`.

### 4. Rotor Order, Positions, And Reflector Variants

**Seed:** `tests/seed.spec.ts`

#### 4.1. treats-rotor-selection-order-as-left-middle-right

**File:** `tests/enigma/treats-rotor-selection-order-as-left-middle-right.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press `HELLOWORLD`.
    - expect: output display is `ILBDAAMTAZ`.
  3. Reset the message state and positions.
  4. Configure rotors `III`, `II`, `I`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  5. Press `HELLOWORLD`.
    - expect: output display is `MFNCZBBFZM`.
    - expect: the result differs from the first configuration.

#### 4.2. supports-non-default-rotor-wirings

**File:** `tests/enigma/supports-non-default-rotor-wirings.spec.ts`

**Steps:**
  1. Configure rotors `II`, `IV`, `V`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press `HELLOWORLD`.
    - expect: output display is `MQTVFBSMJX`.
    - expect: final rotor positions are `A`, `A`, `K`.

#### 4.3. changing-start-positions-changes-output-and-final-position

**File:** `tests/enigma/changing-start-positions-changes-output-and-final-position.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `B`, `C`, `D`, reflector `B`, no plugboard.
  2. Press `AAAAA`.
    - expect: output display is `RNOOV`.
    - expect: final rotor positions are `B`, `C`, `I`.

#### 4.4. reflector-a-produces-reference-output

**File:** `tests/enigma/reflector-a-produces-reference-output.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `A`, no plugboard.
  2. Press `HELLOWORLD`.
    - expect: output display is `KCUBRKIDKN`.
    - expect: final rotor positions are `A`, `A`, `K`.

#### 4.5. reflector-c-produces-reference-output

**File:** `tests/enigma/reflector-c-produces-reference-output.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `C`, no plugboard.
  2. Press `HELLOWORLD`.
    - expect: output display is `XKVWSXCNHR`.
    - expect: final rotor positions are `A`, `A`, `K`.

### 5. Plugboard Behavior

**Seed:** `tests/seed.spec.ts`

#### 5.1. creates-single-plugboard-pair-by-dragging

**File:** `tests/enigma/creates-single-plugboard-pair-by-dragging.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`.
  2. Drag plugboard letter `A` to letter `M`.
    - expect: a visible plugboard connection exists between `A` and `M`.
    - expect: `A` and `M` are both treated as used letters.
  3. Press keyboard button `A`.
    - expect: input display is `A`.
    - expect: output display is `D`.
    - expect: positions are `A`, `A`, `B`.

#### 5.2. plugboard-pairs-are-reciprocal-and-preserved-through-message

**File:** `tests/enigma/plugboard-pairs-are-reciprocal-and-preserved-through-message.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`.
  2. Drag `A` to `M`.
  3. Drag `C` to `Z`.
    - expect: two visible plugboard connections exist.
  4. Press `HELLOWORLD`.
    - expect: output display is `ILBDMMATMC`.
    - expect: final rotor positions are `A`, `A`, `K`.

#### 5.3. prevents-used-letter-from-being-reused-in-another-pair

**File:** `tests/enigma/prevents-used-letter-from-being-reused-in-another-pair.spec.ts`

**Steps:**
  1. Drag plugboard letter `A` to `M`.
  2. Try to drag plugboard letter `A` to `C`.
    - expect: no second connection involving `A` is created.
    - expect: either a validation message is shown or the attempted connection is ignored without changing existing pairs.
  3. Press keyboard button `A` with canonical rotor settings.
    - expect: output display is still `D`, proving only the `A-M` pair is active.

#### 5.4. ignores-self-pair-drag

**File:** `tests/enigma/ignores-self-pair-drag.spec.ts`

**Steps:**
  1. Drag plugboard letter `A` onto itself.
    - expect: no visible connection is created.
  2. Configure canonical rotor settings and press keyboard button `A`.
    - expect: output display is `B`, proving no plugboard mapping was added.

#### 5.5. removes-existing-plugboard-pair

**File:** `tests/enigma/removes-existing-plugboard-pair.spec.ts`

**Steps:**
  1. Drag plugboard letter `A` to `M`.
    - expect: a visible connection exists between `A` and `M`.
  2. Remove the pair using the visible plugboard interaction for either `A` or `M`.
    - expect: the connection disappears.
    - expect: both `A` and `M` can be used in new pairs again.
  3. Configure canonical rotor settings and press keyboard button `A`.
    - expect: output display is `B`, proving the removed pair is not sent to encryption.

#### 5.6. enforces-normal-enigma-maximum-of-ten-plugboard-pairs

**File:** `tests/enigma/enforces-normal-enigma-maximum-of-ten-plugboard-pairs.spec.ts`

**Steps:**
  1. Create ten valid plugboard pairs: `A-V`, `B-S`, `C-G`, `D-L`, `F-U`, `H-Z`, `I-N`, `K-M`, `O-W`, `R-X`.
    - expect: ten connections are visible.
  2. Try to create an eleventh pair with two unused letters.
    - expect: the eleventh pair is rejected.
    - expect: the app shows or exposes a user-facing validation state explaining the ten-pair limit.

### 6. Reset, Reconfiguration, And State Consistency

**Seed:** `tests/seed.spec.ts`

#### 6.1. reset-clears-message-and-returns-positions-to-a

**File:** `tests/enigma/reset-clears-message-and-returns-positions-to-a.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `B`, `C`, `D`, reflector `B`, no plugboard.
  2. Press `AAAAA`.
    - expect: output display is `RNOOV`.
    - expect: rotor positions are `B`, `C`, `I`.
  3. Click reset.
    - expect: input display returns to waiting/empty state.
    - expect: output display returns to waiting/empty state.
    - expect: rotor selections remain `I`, `II`, `III`.
    - expect: rotor positions are `A`, `A`, `A`.
    - expect: reflector selection remains `B`.

#### 6.2. reset-preserves-plugboard-machine-configuration

**File:** `tests/enigma/reset-preserves-plugboard-machine-configuration.spec.ts`

**Steps:**
  1. Configure canonical rotors and reflector.
  2. Create plugboard pair `A-M`.
  3. Press `A`.
    - expect: output display is `D`.
  4. Click reset.
    - expect: input and output are cleared.
    - expect: rotor positions are `A`, `A`, `A`.
    - expect: plugboard pair `A-M` is still visible.
  5. Press `A`.
    - expect: output display is `D`, proving reset did not remove the plugboard pair.

#### 6.3. reconfiguring-position-after-reset-changes-next-message

**File:** `tests/enigma/reconfiguring-position-after-reset-changes-next-message.spec.ts`

**Steps:**
  1. Configure canonical rotors and reflector.
  2. Press `AAAAA`.
    - expect: output display is `BDZGO`.
  3. Click reset.
  4. Set positions to `B`, `C`, `D`.
  5. Press `AAAAA`.
    - expect: output display is `RNOOV`.
    - expect: final positions are `B`, `C`, `I`.

#### 6.4. handles-rapid-keyboard-clicks-without-lost-or-reordered-output

**File:** `tests/enigma/handles-rapid-keyboard-clicks-without-lost-or-reordered-output.spec.ts`

**Steps:**
  1. Configure canonical rotors and reflector.
  2. Rapidly click keyboard button `A` five times without waiting between clicks.
    - expect: input display eventually becomes `AAAAA`.
    - expect: output display eventually becomes `BDZGO`.
    - expect: output length is exactly five.
    - expect: final positions are `A`, `A`, `F`.

### 7. Encryption Reversibility

**Seed:** `tests/seed.spec.ts`

#### 7.1. decrypts-canonical-ciphertext-by-resetting-to-same-start-position

**File:** `tests/enigma/decrypts-canonical-ciphertext-by-resetting-to-same-start-position.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press `HELLOWORLD`.
    - expect: output display is `ILBDAAMTAZ`.
  3. Click reset.
    - expect: rotor positions are `A`, `A`, `A`.
  4. Press `ILBDAAMTAZ`.
    - expect: output display is `HELLOWORLD`.

#### 7.2. decrypts-plugboard-ciphertext-by-resetting-to-same-start-position

**File:** `tests/enigma/decrypts-plugboard-ciphertext-by-resetting-to-same-start-position.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`.
  2. Create plugboard pairs `A-M` and `C-Z`.
  3. Press `HELLOWORLD`.
    - expect: output display is `ILBDMMATMC`.
  4. Click reset.
    - expect: plugboard pairs are still visible.
    - expect: rotor positions are `A`, `A`, `A`.
  5. Press `ILBDMMATMC`.
    - expect: output display is `HELLOWORLD`.

### 8. Lampboard And Visual Feedback

**Seed:** `tests/seed.spec.ts`

#### 8.1. lights-ciphertext-lamp-then-clears-it

**File:** `tests/enigma/lights-ciphertext-lamp-then-clears-it.spec.ts`

**Steps:**
  1. Configure canonical rotors and reflector.
  2. Press keyboard button `A`.
    - expect: output display is `B`.
    - expect: lamp `B` has the active visual state shortly after encryption.
  3. Wait for the configured lamp clear interval.
    - expect: lamp `B` no longer has the active visual state.

#### 8.2. rotor-position-display-matches-post-encryption-state

**File:** `tests/enigma/rotor-position-display-matches-post-encryption-state.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `U`, reflector `B`, no plugboard.
  2. Press `A` six times.
    - expect: output display is `MUQOFX`.
    - expect: rotor windows show `A`, `B`, `A`.
    - expect: no rotor window displays raw wiring text as the primary rotor identifier instead of the rotor name/position.

### 9. API Contract Through Browser Automation

**Seed:** `tests/seed.spec.ts`

#### 9.1. rotors-api-returns-standard-wiring-map

**File:** `tests/enigma/rotors-api-returns-standard-wiring-map.spec.ts`

**Steps:**
  1. From the Playwright page context, fetch `http://localhost:8000/rotors`.
    - expect: response status is `200`.
    - expect: keys are `I`, `II`, `III`, `IV`, `V`.
    - expect: rotor `I` wiring is `EKMFLGDQVZNTOWYHXUSPAIBRCJ`.
    - expect: rotor `III` wiring is `BDFHJLCPRTXVZNYEIWGAKMUSQO`.

#### 9.2. reflectors-api-returns-standard-wiring-map

**File:** `tests/enigma/reflectors-api-returns-standard-wiring-map.spec.ts`

**Steps:**
  1. From the Playwright page context, fetch `http://localhost:8000/reflectors`.
    - expect: response status is `200`.
    - expect: keys are `A`, `B`, `C`.
    - expect: reflector `B` wiring is `YRUHQSLDPXNGOKMIEBFZCWVJAT`.

#### 9.3. encrypt-api-returns-reference-single-character-result

**File:** `tests/enigma/encrypt-api-returns-reference-single-character-result.spec.ts`

**Steps:**
  1. From the Playwright page context, POST to `http://localhost:8000/encrypt` with plaintext `A`, rotors `I`, `II`, `III`, positions `A`, `A`, `A`, reflector `B`, no plugboard.
    - expect: response status is `200`.
    - expect: `ciphertext` is `B`.
    - expect: `rotor_positions` are `A`, `A`, `B`.
    - expect: `plugResult`, `forwardResult`, and `backwardResult` are present and machine-readable.

#### 9.4. invalid-encrypt-request-returns-validation-error-not-server-crash

**File:** `tests/enigma/invalid-encrypt-request-returns-validation-error-not-server-crash.spec.ts`

**Steps:**
  1. From the Playwright page context, POST to `http://localhost:8000/encrypt` with a missing rotor index or incomplete rotor list.
    - expect: response status is a client validation status such as `400` or `422`.
    - expect: response body contains a useful validation message.
    - expect: response status is not `500`.

### 10. Full-Enigma Coverage Gap Checks

**Seed:** `tests/seed.spec.ts`

#### 10.1. exposes-ring-setting-controls-for-each-rotor

**File:** `tests/enigma/exposes-ring-setting-controls-for-each-rotor.spec.ts`

**Steps:**
  1. Inspect the configuration section after initialization.
    - expect: each rotor has a ring setting control independent from the rotor visible position.
    - expect: each ring setting can be set to `A` through `Z`.
  2. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, ring settings `A`, `A`, `A`.
    - expect: behavior matches the canonical reference outputs above.

#### 10.2. ring-setting-changes-encryption-and-turnover-semantics

**File:** `tests/enigma/ring-setting-changes-encryption-and-turnover-semantics.spec.ts`

**Steps:**
  1. Configure rotors `I`, `II`, `III`, positions `A`, `A`, `A`, ring settings `A`, `A`, `A`, reflector `B`, no plugboard.
  2. Press `AAAAA`.
    - expect: output display is `BDZGO`.
  3. Reset and change at least one ring setting away from `A`.
  4. Press `AAAAA`.
    - expect: output display differs from `BDZGO`.
    - expect: rotor turnover behavior uses the ring-adjusted notch position.

## Phase2 Result File Requirement

When Phase2 executes these scenarios, record the outcome after each scenario in a separate Markdown file, suggested path:

`specs/enigma-business-logic.results.md`

Use this result shape:

```markdown
# Enigma Business Logic Test Results

## <scenario-id>. <scenario-name>

- Status: PASS | FAIL | BLOCKED
- Date: YYYY-MM-DD
- Environment: frontend URL, backend URL, browser
- Evidence:
  - Playwright command/test file used
  - Observed input/output text
  - Observed rotor positions
  - Screenshot/snapshot path if captured
- Failure Feature:
  - Only fill this for FAIL/BLOCKED.
  - Describe the exact user-visible mismatch, not the suspected code cause.
```

## Phase3 Modification Plan Input

Phase3 should only begin after Phase2 has a completed results file. Summarize every failed scenario by feature area first, then inspect the relevant code paths. Suggested output path:

`specs/enigma-business-logic.modification-plan.md`
