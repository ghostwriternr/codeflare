import { type ControlOperator, parse, type ParseEntry } from 'shell-quote';

const SINGLE_QUOTE = '__SINGLE_QUOTE__';
const DOUBLE_QUOTE = '__DOUBLE_QUOTE__';

export function splitCommand(command: string): string[] {
    const parts: ParseEntry[] = [];

    // 1. Collapse adjacent strings
    for (const part of parse(
        command
            .replaceAll('"', `"${DOUBLE_QUOTE}`) // parse() strips out quotes :P
            .replaceAll("'", `'${SINGLE_QUOTE}`), // parse() strips out quotes :P
        (varName) => `$${varName}` // Preserve shell variables
    )) {
        if (typeof part === 'string') {
            if (
                parts.length > 0 &&
                typeof parts[parts.length - 1] === 'string'
            ) {
                parts[parts.length - 1] += ' ' + part;
                continue;
            }
        }
        parts.push(part);
    }

    // 2. Map tokens to strings
    const stringParts = parts
        .map((part) => {
            if (typeof part === 'string') {
                return part;
            }
            if ('comment' in part) {
                // TODO: make this less hacky
                return '#' + part.comment;
            }
            if ('op' in part && part.op === 'glob') {
                return part.pattern;
            }
            if ('op' in part) {
                return part.op;
            }
            return null;
        })
        .filter((_) => _ !== null);

    // 3. Map quotes back to their original form
    const quotedParts = stringParts.map((part) => {
        return part
            .replaceAll(`${SINGLE_QUOTE}`, "'")
            .replaceAll(`${DOUBLE_QUOTE}`, '"');
    });

    // 4. Filter out separators
    return quotedParts.filter(
        (part) => !(COMMAND_LIST_SEPARATORS as Set<string>).has(part)
    );
}

const COMMAND_LIST_SEPARATORS = new Set<ControlOperator>([
    '&&',
    '||',
    ';',
    ';;',
]);
