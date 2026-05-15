import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '../../..');
const resultsPath = path.join(rootDir, 'specs', 'enigma-business-logic.results.md');

async function globalSetup() {
  fs.writeFileSync(
    resultsPath,
    [
      '# Enigma Business Logic Test Results',
      '',
      '- Plan: `specs/enigma-business-logic.plan.md`',
      '- Implementation: `apps/enigma-frontend/tests/enigma-business-logic.spec.ts`',
      '- Frontend URL: `http://localhost:3000`',
      '- Backend URL: `http://localhost:8000`',
      '- Browser: Chrome channel via Playwright',
      '',
    ].join('\n'),
    'utf8'
  );
}

export default globalSetup;
