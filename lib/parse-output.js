'use babel';

import * as helpers from 'atom-linter';
import matchAll from 'string.prototype.matchall';

const ERROR_PATTERNS = [
  // NOTE: Some parse errors don't have the description line, this can
  // be confusing if warnings are also generated.
  /(?:^(?<!warning):\s*(?<errorDescription>[^:\n]*):\s*(?<errorExtra>[^:\n]*)$)?\s*File "(?<fileName>[^"]*)", line (?<line>\d+), column (?<column>\d+), charpos = \d+$/mg,
  /^ERROR: (?<errorDescription>[^\r\n]*)$/mg,
  /^(?<errorDescription>invalid minus) starting on line (?<line>\d+)$/mg,
  /^(?<errorDescription>invalid iso name \S+) in rule starting on line (?<line>\d+)$/mg,
  // NOTE: no position for named rules :(
  /^(?<errorDescription>invalid iso name \S+ in \S+)$/mg
];

const WARNING_PATTERNS = [
  // NOTE: This does not work for named rules
  /^warning: (?:rule starting on )?line (?<line>\d+): (?<errorDescription>[^\r\n]*)$/mg
];

/*
 * NOTE: spatch reports errors with inconsistent capitalization.
 * This function is used to capitalize first letters of errorDescription or
 * errorExtra captures.
 */
function capitalizeFirst(s) {
  return s.replace(/^\w/, c => c.toUpperCase());
}

function checkPattern(re, severity, editor, stderr, result) {
  let found = false;

  for (const m of matchAll(stderr, re)) {
    const {errorDescription, errorExtra, fileName, line, column} = m.groups;
    let description = 'Parse error';

    const lineNo = line ? parseInt(line) - 1 : 0;
    const columnNo = column ? parseInt(column) - 1 : 0;

    if (errorDescription) {
      if (errorExtra) {
        description = `${capitalizeFirst(errorDescription)}: ${capitalizeFirst(errorExtra)}`;
      } else {
        description = capitalizeFirst(errorDescription);
      }
    }

    result.push({
      severity: severity,
      location: {
        file: fileName ? fileName : editor.getPath(),
        position: helpers.generateRange(editor, lineNo, columnNo),
      },
      excerpt: description
    });
    found = true;
  }

  return found;
}

export default function parseOutput(editor, stderr, result) {
  let foundErrors = false;

  ERROR_PATTERNS.forEach(re => {
    if (checkPattern(re, 'error', editor, stderr, result)) {
      foundErrors = true;
    }
  });

  WARNING_PATTERNS.forEach(re => {
    checkPattern(re, 'warning', editor, stderr, result);
  });

  return foundErrors;
}
