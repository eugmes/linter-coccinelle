'use babel';

import * as fs from 'fs';
import * as path from 'path';
import * as CSON from 'cson-parser';

const { lint } = require('../lib/main.js').provideLinter();

async function lintFile(fileName) {
  const editor = await atom.workspace.open(fileName);
  return lint(editor);
}

describe('Coccinelle provider for Linter', () => {
  beforeEach(async () => {
    atom.workspace.destroyActivePaneItem();
    await atom.packages.activatePackage('linter-coccinelle');
  });

  it('finds nothing wrong with a valid file', async () => {
    const goodFile = path.join(__dirname, 'fixtures', 'good.cocci');
    const messages = await lintFile(goodFile);

    expect(messages.length).toBe(0);
  });

  it('does not report anything for an empty file', async () => {
    const emptyFile = path.join(__dirname, 'fixtures', 'empty.cocci');
    const messages = await lintFile(emptyFile);

    expect(messages.length).toBe(0);
  });

  describe('files with problems', async () => {
    const badFixturesRoot = path.join(__dirname, 'fixtures', 'bad');
    const testFileNames = fs
      .readdirSync(badFixturesRoot)
      .filter(dir => /\.cocci$/.test(dir));

    testFileNames.forEach(badFileName => {
      it(`reports problems in ${badFileName}`, async () => {
        const cocciFile = path.join(badFixturesRoot, badFileName);
        const outcomeFile = path.join(badFixturesRoot, path.basename(cocciFile, '.cocci') + '.cson');

        const messages = await lintFile(cocciFile);
        const outcome = CSON.parse(fs.readFileSync(outcomeFile, 'utf8'));

        expect(messages.length).toBe(outcome.length);
        outcome.forEach((entry, idx) => {
          expect(messages[idx].severity).toBe(entry.severity);
          expect(messages[idx].excerpt).toBe(entry.excerpt);
          expect(messages[idx].location.file).toBe(cocciFile);
          expect(messages[idx].location.position).toEqual(entry.position);
        });
      });
    });
  });
});
