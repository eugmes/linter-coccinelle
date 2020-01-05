'use babel';

import { CompositeDisposable } from 'atom';
import * as helpers from 'atom-linter';
import parseOutput from './parse-output';
import packageConfig from './config-schema.json';

let executablePath;
let additionalArguments;

export default {
  config: packageConfig,

  activate() {
    if (!atom.inSpecMode()) {
      require('atom-package-deps').install('linter-coccinelle');
    }

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-coccinelle.executablePath', value => {
        executablePath = value;
      })
    );

    this.subscriptions.add(
      atom.config.observe('linter-coccinelle.additionalArguments', value => {
        if (value) {
          additionalArguments = value.split(/\s+/);
        } else {
          additionalArguments = [];
        }
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'Coccinelle',
      scope: 'file',
      lintsOnChange: false,
      grammarScopes: ['source.coccinelle'],

      lint: async(editor) => {
        const editorPath = editor.getPath();
        const args = [...additionalArguments, '--parse-cocci', editorPath];

        const output = helpers.exec(executablePath, args, {
          uniqueKey: `coccinelle:${editorPath}`,
          stream: 'both'
        });

        if (output == null) {
          return null;
        }

        return output.then(both => {
          const {stderr, exitCode} = both;
          let result = [];

          const foundErrors = parseOutput(editor, stderr, result);

          if ((exitCode != 0) && !foundErrors) {
            let escapedStderr = stderr.replace(/^/gm, s => `    ${s}`);

            result.push({
              severity: 'error',
              location: {
                file: editorPath,
                position: helpers.generateRange(editor),
              },
              excerpt: `Unknown error: spatch returned ${exitCode}`,
              description: escapedStderr
            });
          }

          return result;
        }).catch(error => {
          // TODO: add button to change the path
          atom.notifications.addError('linter-coccinelle', {
            description: error.message,
          });
          return null;
        });
      }
    };
  }
};
