'use babel';

import * as path from 'path';

const { lint } = require('../lib/main.js').provideLinter();

describe('Coccinelle provider for Linter', () => {
  beforeEach(async () => {
    atom.workspace.destroyActivePaneItem();
    await atom.packages.activatePackage('linter-coccinelle');
  });

  it('finds nothing wrong with a valid file', async () => {
    const goodFile = path.join(__dirname, 'fixtures', 'good.cocci');
    const editor = await atom.workspace.open(goodFile);
    const messages = await lint(editor);

    expect(messages.length).toBe(0);
  });

  it('does not report anything for an empty file', async () => {
    const emptyFile = path.join(__dirname, 'fixtures', 'empty.cocci');
    const editor = await atom.workspace.open(emptyFile);
    const messages = await lint(editor);

    expect(messages.length).toBe(0);
  });
});
