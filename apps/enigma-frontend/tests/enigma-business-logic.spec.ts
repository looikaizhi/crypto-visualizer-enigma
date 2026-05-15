import fs from 'fs';
import path from 'path';
import type { Locator, Page, TestInfo } from '@playwright/test';
import { expect, test } from './fixtures';

type Status = 'PASS' | 'FAIL' | 'BLOCKED';

type ScenarioMeta = {
  id: string;
  name: string;
  planFile: string;
};

type PageState = {
  input: string;
  output: string;
  positions: string[];
  rotorWindows: string[];
  errors: string[];
  plugboardSolidLines: number;
};

const ROOT_DIR = path.resolve(__dirname, '../../..');
const RESULTS_PATH = path.join(
  ROOT_DIR,
  'specs',
  'enigma-business-logic.results.md'
);
const IMPLEMENTATION_FILE = 'apps/enigma-frontend/tests/enigma-business-logic.spec.ts';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function scenario(
  meta: ScenarioMeta,
  body: (page: Page, testInfo: TestInfo) => Promise<void>
) {
  test(`${meta.id}. ${meta.name}`, async ({ page }, testInfo) => {
    let status: Status = 'PASS';
    let failure = '';
    let screenshotPath = '';
    let caught: unknown;

    try {
      await body(page, testInfo);
    } catch (error) {
      caught = error;
      status =
        error instanceof Error && error.message.startsWith('BLOCKED:')
          ? 'BLOCKED'
          : 'FAIL';
      failure = errorToFeature(error);
      try {
        const absoluteScreenshotPath = testInfo.outputPath(
          `${meta.id}-${meta.name}.png`
        );
        await page.screenshot({ path: absoluteScreenshotPath, fullPage: true });
        screenshotPath = relativeToRoot(absoluteScreenshotPath);
      } catch {
        screenshotPath = 'screenshot capture failed';
      }
    } finally {
      const state = await collectState(page).catch(() => undefined);
      appendResult(meta, status, state, failure, screenshotPath);
    }

    if (caught) {
      throw caught;
    }
  });
}

function appendResult(
  meta: ScenarioMeta,
  status: Status,
  state: PageState | undefined,
  failure: string,
  screenshotPath: string
) {
  const lines = [
    `## ${meta.id}. ${meta.name}`,
    '',
    `- Status: ${status}`,
    `- Date: ${new Date().toISOString().slice(0, 10)}`,
    '- Environment: frontend `http://localhost:3000`, backend `http://localhost:8000`, browser `chrome`',
    '- Evidence:',
    `  - Plan target file: \`${meta.planFile}\``,
    `  - Executed by: \`${IMPLEMENTATION_FILE}\``,
    `  - Observed input: \`${state?.input ?? 'unavailable'}\``,
    `  - Observed output: \`${state?.output ?? 'unavailable'}\``,
    `  - Observed rotor positions: \`${state?.positions.join(', ') ?? 'unavailable'}\``,
    `  - Rotor windows: \`${state?.rotorWindows.join(' | ') ?? 'unavailable'}\``,
    `  - Visible error messages: \`${state?.errors.join(' | ') ?? ''}\``,
    `  - Plugboard solid SVG lines: \`${state?.plugboardSolidLines ?? 'unavailable'}\``,
  ];

  if (screenshotPath) {
    lines.push(`  - Screenshot: \`${screenshotPath}\``);
  }

  lines.push('- Failure Feature:');
  lines.push(
    status === 'PASS'
      ? '  - None.'
      : `  - ${failure || 'No failure detail was captured.'}`
  );
  lines.push('');

  fs.appendFileSync(RESULTS_PATH, `${lines.join('\n')}\n`, 'utf8');
}

function relativeToRoot(filePath: string) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
}

function errorToFeature(error: unknown) {
  if (error instanceof Error) {
    return error.message
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8)
      .join(' ');
  }
  return String(error);
}

async function collectState(page: Page): Promise<PageState> {
  const displays = page.locator('.input-output-text');
  const input = await normalizedDisplayText(displays.nth(0));
  const output = await normalizedDisplayText(displays.nth(1));
  const rotorWindows = await page.locator('.rotor-window').evaluateAll((els) =>
    els.map((el) => (el.textContent || '').trim())
  );
  const positions = parseRotorPositions(rotorWindows);
  const errors = await page.locator('.error-message').evaluateAll((els) =>
    els
      .map((el) => (el.textContent || '').trim())
      .filter((text) => text.length > 0)
  );
  const plugboardSolidLines = await page
    .locator('.plugboard-container svg.lines line.solid')
    .count();

  return { input, output, positions, rotorWindows, errors, plugboardSolidLines };
}

async function normalizedDisplayText(locator: Locator) {
  const text = ((await locator.textContent()) || '').trim();
  return text === '等待输入...' ? '' : text;
}

function parseRotorPositions(rotorWindows: string[]) {
  return rotorWindows.map((text) => {
    const match = text.match(/:\s*([A-Z])\s*$/);
    return match ? match[1] : text;
  });
}

async function rotorSelects(page: Page) {
  return page.locator('select.rotor-select');
}

async function positionSelects(page: Page) {
  return page.locator('select.position-select');
}

async function configureMachine(
  page: Page,
  rotors: [string, string, string] = ['I', 'II', 'III'],
  positions: [string, string, string] = ['A', 'A', 'A'],
  reflector = 'B'
) {
  const rotorSelect = await rotorSelects(page);
  const positionSelect = await positionSelects(page);
  for (let index = 0; index < 3; index += 1) {
    await rotorSelect.nth(index).selectOption(rotors[index]);
  }
  for (let index = 0; index < 3; index += 1) {
    await positionSelect.nth(index).selectOption(positions[index]);
  }
  await page.locator('select.reflector-select').selectOption(reflector);
  await assertArrayEqual(await selectedRotorValues(page), rotors, 'selected rotors');
  await assertArrayEqual(
    await selectedPositionValues(page),
    positions,
    'selected positions'
  );
  await assertEqual(
    await page.locator('select.reflector-select').inputValue(),
    reflector,
    'selected reflector'
  );
}

async function selectedRotorValues(page: Page) {
  return page.locator('select.rotor-select').evaluateAll((els) =>
    els.map((el) => (el as HTMLSelectElement).value)
  );
}

async function selectedPositionValues(page: Page) {
  return page.locator('select.position-select').evaluateAll((els) =>
    els.map((el) => (el as HTMLSelectElement).value)
  );
}

async function pressMessageSequential(page: Page, message: string) {
  let expectedLength = (await outputText(page)).length;
  for (const letter of message) {
    expectedLength += 1;
    await page.getByRole('button', { name: letter, exact: true }).click();
    await waitForOutputLength(page, expectedLength);
  }
}

async function pressMessageRapid(page: Page, message: string) {
  for (const letter of message) {
    await page.getByRole('button', { name: letter, exact: true }).click();
  }
}

async function waitForOutputLength(page: Page, length: number) {
  await page.waitForFunction(
    (expectedLength) => {
      const output = document.querySelectorAll('.input-output-text')[1];
      const text = (output?.textContent || '').trim();
      const normalized = text === '等待输入...' ? '' : text;
      return normalized.length >= expectedLength;
    },
    length,
    { timeout: 8_000 }
  );
}

async function inputText(page: Page) {
  return normalizedDisplayText(page.locator('.input-output-text').nth(0));
}

async function outputText(page: Page) {
  return normalizedDisplayText(page.locator('.input-output-text').nth(1));
}

async function expectInput(page: Page, expected: string) {
  await assertEqual(await inputText(page), expected, 'input display');
}

async function expectOutput(page: Page, expected: string) {
  await assertEqual(await outputText(page), expected, 'output display');
}

async function expectPositions(page: Page, expected: [string, string, string]) {
  const state = await collectState(page);
  await assertArrayEqual(state.positions, expected, 'rotor positions');
}

async function reset(page: Page) {
  await page.getByRole('button', { name: '重置' }).click();
  await page.waitForFunction(() => {
    const displays = [...document.querySelectorAll('.input-output-text')].map(
      (node) => (node.textContent || '').trim()
    );
    return displays[0] === '等待输入...' && displays[1] === '等待输入...';
  });
}

function plugboardLetter(page: Page, letter: string) {
  return page
    .locator('.plugboard-container .box')
    .filter({ hasText: new RegExp(`^${letter}$`) });
}

async function dragPlugPair(page: Page, from: string, to: string) {
  const fromBox = await plugboardLetter(page, from).boundingBox();
  const toBox = await plugboardLetter(page, to).boundingBox();
  if (!fromBox || !toBox) {
    throw new Error(`plugboard boxes unavailable for ${from}-${to}`);
  }
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await page.waitForTimeout(100);
}

async function clickPlugLetter(page: Page, letter: string) {
  await plugboardLetter(page, letter).click();
  await page.waitForTimeout(100);
}

async function solidLineCount(page: Page) {
  return page.locator('.plugboard-container svg.lines line.solid').count();
}

async function expectSolidLines(page: Page, expected: number, label: string) {
  await page.waitForTimeout(100);
  await assertEqual(await solidLineCount(page), expected, label);
}

async function expectAtLeastSolidLines(page: Page, minimum: number, label: string) {
  await page.waitForTimeout(100);
  const observed = await solidLineCount(page);
  if (observed < minimum) {
    throw new Error(`${label} mismatch: expected at least ${minimum}, observed ${observed}`);
  }
}

async function expectLampActive(page: Page, letter: string) {
  await page.waitForFunction(
    (targetLetter) =>
      [...document.querySelectorAll('.lampboard .lamp')].some(
        (node) =>
          (node.textContent || '').trim() === targetLetter &&
          node.classList.contains('lamp-active')
      ),
    letter,
    { timeout: 1_000 }
  );
}

async function expectLampInactive(page: Page, letter: string) {
  await page.waitForFunction(
    (targetLetter) =>
      [...document.querySelectorAll('.lampboard .lamp')].some(
        (node) =>
          (node.textContent || '').trim() === targetLetter &&
          !node.classList.contains('lamp-active')
      ),
    letter,
    { timeout: 2_000 }
  );
}

async function assertEqual<T>(observed: T, expected: T, label: string) {
  if (observed !== expected) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(
        observed
      )}`
    );
  }
}

async function assertArrayEqual<T>(
  observed: readonly T[],
  expected: readonly T[],
  label: string
) {
  const observedJson = JSON.stringify(observed);
  const expectedJson = JSON.stringify(expected);
  if (observedJson !== expectedJson) {
    throw new Error(
      `${label} mismatch: expected ${expectedJson}, observed ${observedJson}`
    );
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchFromBrowser(
  page: Page,
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) {
  return page.evaluate(
    async ({ requestUrl, requestInit }) => {
      const response = await fetch(requestUrl, requestInit);
      const text = await response.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      return { status: response.status, body };
    },
    { requestUrl: url, requestInit: init }
  );
}

scenario(
  {
    id: '1.1',
    name: 'loads-enigma-simulator',
    planFile: 'tests/enigma/loads-enigma-simulator.spec.ts',
  },
  async (page) => {
    await expect(page.getByRole('heading', { name: 'Enigma 密码机模拟器' })).toBeVisible();
    await expect(page.getByText('初始化失败，请刷新页面重试')).toHaveCount(0);
    await assertEqual(await page.locator('select.rotor-select').count(), 3, 'rotor selector count');
    await assertEqual(
      await page.locator('select.position-select').count(),
      3,
      'position selector count'
    );
    await assertEqual(
      await page.locator('select.reflector-select').count(),
      1,
      'reflector selector count'
    );
    for (const letter of LETTERS) {
      await expect(plugboardLetter(page, letter)).toBeVisible();
      await expect(page.getByRole('button', { name: letter, exact: true })).toBeVisible();
    }
    await expectInput(page, '');
    await expectOutput(page, '');
  }
);

scenario(
  {
    id: '1.2',
    name: 'exposes-standard-rotors-and-reflectors',
    planFile: 'tests/enigma/exposes-standard-rotors-and-reflectors.spec.ts',
  },
  async (page) => {
    const rotorSelect = page.locator('select.rotor-select');
    for (let index = 0; index < 3; index += 1) {
      const values = await rotorSelect.nth(index).locator('option').evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value).filter(Boolean)
      );
      await assertArrayEqual(values, ['I', 'II', 'III', 'IV', 'V'], `rotor ${index + 1} options`);
      const labels = await rotorSelect.nth(index).locator('option').evaluateAll((options) =>
        options.map((option) => (option.textContent || '').trim()).filter(Boolean)
      );
      assert(new Set(labels).size === labels.length, `rotor ${index + 1} options contain duplicates`);
    }

    const reflectorValues = await page
      .locator('select.reflector-select option')
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value).filter(Boolean)
      );
    await assertArrayEqual(reflectorValues, ['A', 'B', 'C'], 'reflector options');

    const positionSelect = page.locator('select.position-select');
    for (let index = 0; index < 3; index += 1) {
      const values = await positionSelect.nth(index).locator('option').evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value)
      );
      await assertArrayEqual(values, LETTERS, `position ${index + 1} options`);
    }
  }
);

scenario(
  {
    id: '1.3',
    name: 'blocks-encryption-until-required-machine-config-is-complete',
    planFile: 'tests/enigma/blocks-encryption-until-required-machine-config-is-complete.spec.ts',
  },
  async (page) => {
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.waitForTimeout(700);
    const state = await collectState(page);
    const failures: string[] = [];
    if (!state.errors.some((text) => /转子|rotor|select/i.test(text))) {
      failures.push(
        `expected rotor validation message, observed errors ${JSON.stringify(state.errors)}`
      );
    }
    if (state.errors.some((text) => /加密过程出错|500/i.test(text))) {
      failures.push(`generic encryption/backend error shown: ${JSON.stringify(state.errors)}`);
    }
    if (state.input !== '') {
      failures.push(`input changed before valid configuration: ${JSON.stringify(state.input)}`);
    }
    if (state.output !== '') {
      failures.push(`output changed before valid configuration: ${JSON.stringify(state.output)}`);
    }
    if (failures.length > 0) {
      throw new Error(failures.join('; '));
    }
  }
);

scenario(
  {
    id: '2.1',
    name: 'encrypts-single-letter-with-canonical-aaa-config',
    planFile: 'tests/enigma/encrypts-single-letter-with-canonical-aaa-config.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectInput(page, 'A');
    await expectOutput(page, 'B');
    await expectPositions(page, ['A', 'A', 'B']);
    await expectLampActive(page, 'B');
  }
);

scenario(
  {
    id: '2.2',
    name: 'encrypts-hello-world-with-canonical-config',
    planFile: 'tests/enigma/encrypts-hello-world-with-canonical-config.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectInput(page, 'HELLOWORLD');
    await expectOutput(page, 'ILBDAAMTAZ');
    await expectPositions(page, ['A', 'A', 'K']);
    await assertEqual((await outputText(page)).length, (await inputText(page)).length, 'output length');
  }
);

scenario(
  {
    id: '2.3',
    name: 'encrypts-repeated-a-sequence-with-position-trace',
    planFile: 'tests/enigma/encrypts-repeated-a-sequence-with-position-trace.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    const outputs = ['B', 'BD', 'BDZ', 'BDZG', 'BDZGO'];
    const positions: [string, string, string][] = [
      ['A', 'A', 'B'],
      ['A', 'A', 'C'],
      ['A', 'A', 'D'],
      ['A', 'A', 'E'],
      ['A', 'A', 'F'],
    ];
    for (let index = 0; index < 5; index += 1) {
      await page.getByRole('button', { name: 'A', exact: true }).click();
      await waitForOutputLength(page, index + 1);
      await expectOutput(page, outputs[index]);
      await expectPositions(page, positions[index]);
    }
  }
);

scenario(
  {
    id: '2.4',
    name: 'no-letter-ever-encrypts-to-itself-at-a-keypress',
    planFile: 'tests/enigma/no-letter-ever-encrypts-to-itself-at-a-keypress.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await pressMessageSequential(page, LETTERS.join(''));
    const input = await inputText(page);
    const output = await outputText(page);
    await assertEqual(input, LETTERS.join(''), 'input display');
    assert(/^[A-Z]{26}$/.test(output), `output should contain 26 uppercase letters, observed ${output}`);
    const sameIndexes = [...input].flatMap((letter, index) =>
      output[index] === letter ? [`${index}:${letter}`] : []
    );
    assert(sameIndexes.length === 0, `letters encrypted to themselves at ${sameIndexes.join(', ')}`);
  }
);

scenario(
  {
    id: '3.1',
    name: 'advances-rightmost-rotor-before-each-encryption',
    planFile: 'tests/enigma/advances-rightmost-rotor-before-each-encryption.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'B');
    await expectPositions(page, ['A', 'A', 'B']);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 2);
    await expectOutput(page, 'BD');
    await expectPositions(page, ['A', 'A', 'C']);
  }
);

scenario(
  {
    id: '3.2',
    name: 'advances-middle-rotor-when-right-rotor-is-at-notch',
    planFile: 'tests/enigma/advances-middle-rotor-when-right-rotor-is-at-notch.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['A', 'A', 'U']);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'M');
    await expectPositions(page, ['A', 'A', 'V']);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 2);
    await expectOutput(page, 'MU');
    await expectPositions(page, ['A', 'B', 'W']);
  }
);

scenario(
  {
    id: '3.3',
    name: 'performs-double-stepping-at-middle-rotor-notch',
    planFile: 'tests/enigma/performs-double-stepping-at-middle-rotor-notch.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['A', 'D', 'U']);
    const outputs = ['E', 'EQ', 'EQI', 'EQIB'];
    const positions: [string, string, string][] = [
      ['A', 'D', 'V'],
      ['A', 'E', 'W'],
      ['B', 'F', 'X'],
      ['B', 'F', 'Y'],
    ];
    for (let index = 0; index < 4; index += 1) {
      await page.getByRole('button', { name: 'A', exact: true }).click();
      await waitForOutputLength(page, index + 1);
      await expectOutput(page, outputs[index]);
      await expectPositions(page, positions[index]);
    }
  }
);

scenario(
  {
    id: '3.4',
    name: 'preserves-turnover-behavior-when-starting-at-adv',
    planFile: 'tests/enigma/preserves-turnover-behavior-when-starting-at-adv.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['A', 'D', 'V']);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'Q');
    await expectPositions(page, ['A', 'E', 'W']);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 2);
    await expectOutput(page, 'QI');
    await expectPositions(page, ['B', 'F', 'X']);
  }
);

scenario(
  {
    id: '4.1',
    name: 'treats-rotor-selection-order-as-left-middle-right',
    planFile: 'tests/enigma/treats-rotor-selection-order-as-left-middle-right.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await pressMessageSequential(page, 'HELLOWORLD');
    const first = await outputText(page);
    await assertEqual(first, 'ILBDAAMTAZ', 'I-II-III output');
    await reset(page);
    await configureMachine(page, ['III', 'II', 'I'], ['A', 'A', 'A'], 'B');
    await pressMessageSequential(page, 'HELLOWORLD');
    const second = await outputText(page);
    await assertEqual(second, 'MFNCZBBFZM', 'III-II-I output');
    assert(first !== second, `rotor order outputs should differ, both were ${first}`);
  }
);

scenario(
  {
    id: '4.2',
    name: 'supports-non-default-rotor-wirings',
    planFile: 'tests/enigma/supports-non-default-rotor-wirings.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['II', 'IV', 'V']);
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectOutput(page, 'MQTVFBSMJX');
    await expectPositions(page, ['A', 'A', 'K']);
  }
);

scenario(
  {
    id: '4.3',
    name: 'changing-start-positions-changes-output-and-final-position',
    planFile: 'tests/enigma/changing-start-positions-changes-output-and-final-position.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['B', 'C', 'D']);
    await pressMessageSequential(page, 'AAAAA');
    await expectOutput(page, 'RNOOV');
    await expectPositions(page, ['B', 'C', 'I']);
  }
);

scenario(
  {
    id: '4.4',
    name: 'reflector-a-produces-reference-output',
    planFile: 'tests/enigma/reflector-a-produces-reference-output.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['A', 'A', 'A'], 'A');
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectOutput(page, 'KCUBRKIDKN');
    await expectPositions(page, ['A', 'A', 'K']);
  }
);

scenario(
  {
    id: '4.5',
    name: 'reflector-c-produces-reference-output',
    planFile: 'tests/enigma/reflector-c-produces-reference-output.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['A', 'A', 'A'], 'C');
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectOutput(page, 'XKVWSXCNHR');
    await expectPositions(page, ['A', 'A', 'K']);
  }
);

scenario(
  {
    id: '5.1',
    name: 'creates-single-plugboard-pair-by-dragging',
    planFile: 'tests/enigma/creates-single-plugboard-pair-by-dragging.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await dragPlugPair(page, 'A', 'M');
    await expectAtLeastSolidLines(page, 1, 'A-M plugboard connection lines');
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectInput(page, 'A');
    await expectOutput(page, 'D');
    await expectPositions(page, ['A', 'A', 'B']);
  }
);

scenario(
  {
    id: '5.2',
    name: 'plugboard-pairs-are-reciprocal-and-preserved-through-message',
    planFile: 'tests/enigma/plugboard-pairs-are-reciprocal-and-preserved-through-message.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await dragPlugPair(page, 'A', 'M');
    await dragPlugPair(page, 'C', 'Z');
    await expectAtLeastSolidLines(page, 2, 'two plugboard connection pairs');
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectOutput(page, 'ILBDMMATMC');
    await expectPositions(page, ['A', 'A', 'K']);
  }
);

scenario(
  {
    id: '5.3',
    name: 'prevents-used-letter-from-being-reused-in-another-pair',
    planFile: 'tests/enigma/prevents-used-letter-from-being-reused-in-another-pair.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await dragPlugPair(page, 'A', 'M');
    await expectAtLeastSolidLines(page, 1, 'initial A-M pair');
    const before = await solidLineCount(page);
    await dragPlugPair(page, 'A', 'C');
    await assertEqual(await solidLineCount(page), before, 'line count after reusing A');
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'D');
  }
);

scenario(
  {
    id: '5.4',
    name: 'ignores-self-pair-drag',
    planFile: 'tests/enigma/ignores-self-pair-drag.spec.ts',
  },
  async (page) => {
    await dragPlugPair(page, 'A', 'A');
    await expectSolidLines(page, 0, 'self-pair line count');
    await configureMachine(page);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'B');
  }
);

scenario(
  {
    id: '5.5',
    name: 'removes-existing-plugboard-pair',
    planFile: 'tests/enigma/removes-existing-plugboard-pair.spec.ts',
  },
  async (page) => {
    await dragPlugPair(page, 'A', 'M');
    await expectAtLeastSolidLines(page, 1, 'A-M pair before removal');
    await clickPlugLetter(page, 'A');
    await expectSolidLines(page, 0, 'A-M pair after removal');
    await configureMachine(page);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'B');
  }
);

scenario(
  {
    id: '5.6',
    name: 'enforces-normal-enigma-maximum-of-ten-plugboard-pairs',
    planFile: 'tests/enigma/enforces-normal-enigma-maximum-of-ten-plugboard-pairs.spec.ts',
  },
  async (page) => {
    const pairs: [string, string][] = [
      ['A', 'V'],
      ['B', 'S'],
      ['C', 'G'],
      ['D', 'L'],
      ['F', 'U'],
      ['H', 'Z'],
      ['I', 'N'],
      ['K', 'M'],
      ['O', 'W'],
      ['R', 'X'],
    ];
    for (const [from, to] of pairs) {
      await dragPlugPair(page, from, to);
    }
    await expectSolidLines(page, 10, 'ten plugboard pairs represented as physical lines');
    await dragPlugPair(page, 'E', 'J');
    await assertEqual(
      await solidLineCount(page),
      10,
      'plugboard line count after attempted eleventh pair'
    );
    const state = await collectState(page);
    assert(
      state.errors.some((message) => /10|十|limit|上限|最多/i.test(message)),
      `expected ten-pair limit validation message, observed ${JSON.stringify(state.errors)}`
    );
  }
);

scenario(
  {
    id: '6.1',
    name: 'reset-clears-message-and-returns-positions-to-a',
    planFile: 'tests/enigma/reset-clears-message-and-returns-positions-to-a.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['B', 'C', 'D']);
    await pressMessageSequential(page, 'AAAAA');
    await expectOutput(page, 'RNOOV');
    await expectPositions(page, ['B', 'C', 'I']);
    await reset(page);
    await expectInput(page, '');
    await expectOutput(page, '');
    await assertArrayEqual(await selectedRotorValues(page), ['I', 'II', 'III'], 'rotor selections after reset');
    await assertArrayEqual(await selectedPositionValues(page), ['A', 'A', 'A'], 'positions after reset');
    await assertEqual(await page.locator('select.reflector-select').inputValue(), 'B', 'reflector after reset');
  }
);

scenario(
  {
    id: '6.2',
    name: 'reset-preserves-plugboard-machine-configuration',
    planFile: 'tests/enigma/reset-preserves-plugboard-machine-configuration.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await dragPlugPair(page, 'A', 'M');
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'D');
    await reset(page);
    await expectInput(page, '');
    await expectOutput(page, '');
    await expectPositions(page, ['A', 'A', 'A']);
    await expectAtLeastSolidLines(page, 1, 'A-M pair after reset');
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'D');
  }
);

scenario(
  {
    id: '6.3',
    name: 'reconfiguring-position-after-reset-changes-next-message',
    planFile: 'tests/enigma/reconfiguring-position-after-reset-changes-next-message.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await pressMessageSequential(page, 'AAAAA');
    await expectOutput(page, 'BDZGO');
    await reset(page);
    await configureMachine(page, ['I', 'II', 'III'], ['B', 'C', 'D']);
    await pressMessageSequential(page, 'AAAAA');
    await expectOutput(page, 'RNOOV');
    await expectPositions(page, ['B', 'C', 'I']);
  }
);

scenario(
  {
    id: '6.4',
    name: 'handles-rapid-keyboard-clicks-without-lost-or-reordered-output',
    planFile: 'tests/enigma/handles-rapid-keyboard-clicks-without-lost-or-reordered-output.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await pressMessageRapid(page, 'AAAAA');
    await waitForOutputLength(page, 5);
    await expectInput(page, 'AAAAA');
    await expectOutput(page, 'BDZGO');
    await assertEqual((await outputText(page)).length, 5, 'rapid output length');
    await expectPositions(page, ['A', 'A', 'F']);
  }
);

scenario(
  {
    id: '7.1',
    name: 'decrypts-canonical-ciphertext-by-resetting-to-same-start-position',
    planFile: 'tests/enigma/decrypts-canonical-ciphertext-by-resetting-to-same-start-position.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectOutput(page, 'ILBDAAMTAZ');
    await reset(page);
    await expectPositions(page, ['A', 'A', 'A']);
    await pressMessageSequential(page, 'ILBDAAMTAZ');
    await expectOutput(page, 'HELLOWORLD');
  }
);

scenario(
  {
    id: '7.2',
    name: 'decrypts-plugboard-ciphertext-by-resetting-to-same-start-position',
    planFile: 'tests/enigma/decrypts-plugboard-ciphertext-by-resetting-to-same-start-position.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await dragPlugPair(page, 'A', 'M');
    await dragPlugPair(page, 'C', 'Z');
    await pressMessageSequential(page, 'HELLOWORLD');
    await expectOutput(page, 'ILBDMMATMC');
    await reset(page);
    await expectAtLeastSolidLines(page, 2, 'plugboard pairs after reset');
    await expectPositions(page, ['A', 'A', 'A']);
    await pressMessageSequential(page, 'ILBDMMATMC');
    await expectOutput(page, 'HELLOWORLD');
  }
);

scenario(
  {
    id: '8.1',
    name: 'lights-ciphertext-lamp-then-clears-it',
    planFile: 'tests/enigma/lights-ciphertext-lamp-then-clears-it.spec.ts',
  },
  async (page) => {
    await configureMachine(page);
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await waitForOutputLength(page, 1);
    await expectOutput(page, 'B');
    await expectLampActive(page, 'B');
    await page.waitForTimeout(700);
    await expectLampInactive(page, 'B');
  }
);

scenario(
  {
    id: '8.2',
    name: 'rotor-position-display-matches-post-encryption-state',
    planFile: 'tests/enigma/rotor-position-display-matches-post-encryption-state.spec.ts',
  },
  async (page) => {
    await configureMachine(page, ['I', 'II', 'III'], ['A', 'A', 'U']);
    await pressMessageSequential(page, 'AAAAAA');
    await expectOutput(page, 'MUQOFX');
    await expectPositions(page, ['A', 'B', 'A']);
    const state = await collectState(page);
    const rawWiringWindows = state.rotorWindows.filter((text) => /^[A-Z]{26}:\s*[A-Z]$/.test(text));
    assert(
      rawWiringWindows.length === 0,
      `rotor windows expose raw wiring text: ${JSON.stringify(rawWiringWindows)}`
    );
  }
);

scenario(
  {
    id: '9.1',
    name: 'rotors-api-returns-standard-wiring-map',
    planFile: 'tests/enigma/rotors-api-returns-standard-wiring-map.spec.ts',
  },
  async (page) => {
    const response = await fetchFromBrowser(page, 'http://localhost:8000/rotors');
    await assertEqual(response.status, 200, 'rotors API status');
    const body = response.body as Record<string, string>;
    await assertArrayEqual(Object.keys(body), ['I', 'II', 'III', 'IV', 'V'], 'rotors API keys');
    await assertEqual(body.I, 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'rotor I wiring');
    await assertEqual(body.III, 'BDFHJLCPRTXVZNYEIWGAKMUSQO', 'rotor III wiring');
  }
);

scenario(
  {
    id: '9.2',
    name: 'reflectors-api-returns-standard-wiring-map',
    planFile: 'tests/enigma/reflectors-api-returns-standard-wiring-map.spec.ts',
  },
  async (page) => {
    const response = await fetchFromBrowser(page, 'http://localhost:8000/reflectors');
    await assertEqual(response.status, 200, 'reflectors API status');
    const body = response.body as Record<string, string>;
    await assertArrayEqual(Object.keys(body), ['A', 'B', 'C'], 'reflectors API keys');
    await assertEqual(body.B, 'YRUHQSLDPXNGOKMIEBFZCWVJAT', 'reflector B wiring');
  }
);

scenario(
  {
    id: '9.3',
    name: 'encrypt-api-returns-reference-single-character-result',
    planFile: 'tests/enigma/encrypt-api-returns-reference-single-character-result.spec.ts',
  },
  async (page) => {
    const response = await fetchFromBrowser(page, 'http://localhost:8000/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintext: 'A',
        rotors: [
          { index: 'I', wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', position: 'A' },
          { index: 'II', wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', position: 'A' },
          { index: 'III', wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', position: 'A' },
        ],
        reflector: 'B',
        plugboard: [],
      }),
    });
    await assertEqual(response.status, 200, 'encrypt API status');
    const body = response.body as {
      ciphertext?: string;
      rotor_positions?: string[];
      plugResult?: unknown;
      forwardResult?: unknown;
      backwardResult?: unknown;
    };
    await assertEqual(body.ciphertext, 'B', 'encrypt API ciphertext');
    await assertArrayEqual(body.rotor_positions || [], ['A', 'A', 'B'], 'encrypt API positions');
    assert(Array.isArray(body.plugResult), 'plugResult should be present and array-like');
    assert(typeof body.forwardResult === 'object' && body.forwardResult !== null, 'forwardResult should be object');
    assert(typeof body.backwardResult === 'object' && body.backwardResult !== null, 'backwardResult should be object');
  }
);

scenario(
  {
    id: '9.4',
    name: 'invalid-encrypt-request-returns-validation-error-not-server-crash',
    planFile: 'tests/enigma/invalid-encrypt-request-returns-validation-error-not-server-crash.spec.ts',
  },
  async (page) => {
    const response = await fetchFromBrowser(page, 'http://localhost:8000/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plaintext: 'A',
        rotors: [{ wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', position: 'A' }],
        reflector: 'B',
        plugboard: [],
      }),
    });
    assert([400, 422].includes(response.status), `expected validation status 400/422, observed ${response.status}`);
    await assertEqual(response.status === 500, false, 'invalid request server crash status');
    assert(
      JSON.stringify(response.body).length > 0,
      `expected validation response body, observed ${JSON.stringify(response.body)}`
    );
  }
);

scenario(
  {
    id: '10.1',
    name: 'exposes-ring-setting-controls-for-each-rotor',
    planFile: 'tests/enigma/exposes-ring-setting-controls-for-each-rotor.spec.ts',
  },
  async (page) => {
    const rotorConfigs = page.locator('.rotor-config');
    await assertEqual(await rotorConfigs.count(), 3, 'rotor config count');
    for (let index = 0; index < 3; index += 1) {
      const selectCount = await rotorConfigs.nth(index).locator('select').count();
      assert(
        selectCount >= 3,
        `rotor ${index + 1} exposes ${selectCount} select controls; expected rotor, position, and ring setting`
      );
    }
  }
);

scenario(
  {
    id: '10.2',
    name: 'ring-setting-changes-encryption-and-turnover-semantics',
    planFile: 'tests/enigma/ring-setting-changes-encryption-and-turnover-semantics.spec.ts',
  },
  async (page) => {
    const rotorConfigs = page.locator('.rotor-config');
    const ringControls = await rotorConfigs.evaluateAll((configs) =>
      configs.map((config) => config.querySelectorAll('select').length)
    );
    assert(
      ringControls.every((count) => count >= 3),
      `ring setting controls unavailable; select counts per rotor are ${JSON.stringify(ringControls)}`
    );
    await configureMachine(page);
    await pressMessageSequential(page, 'AAAAA');
    await expectOutput(page, 'BDZGO');
    await reset(page);
    await page.locator('select.ring-setting-select').nth(0).selectOption('B');
    await pressMessageSequential(page, 'AAAAA');
    const ringedOutput = await outputText(page);
    assert(
      ringedOutput.length === 5,
      `ring setting output should be 5 letters; observed ${JSON.stringify(ringedOutput)}`
    );
    assert(
      ringedOutput !== 'BDZGO',
      `ring setting did not change output; still ${JSON.stringify(ringedOutput)}`
    );
  }
);
