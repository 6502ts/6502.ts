const fs = require('fs');

const licenseHeader = `
This file is part of 6502.ts, an emulator for 6502 based systems built
in Typescript

Copyright (c) 2014 -- 2020 Christian Speckner and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`.trim();

const fileTypes = new Map([
    [
        /\.(js|ts|scss)$/,
        {
            patternBlockCommentStart: /^\s*\/\*/,
            patternBlockCommentEnd: /\*\//,
            blockCommentStart: '/*',
            blockCommentEnd: ' */',
            blockCommentPrefix: ' *   '
        }
    ],
    [
        /\.(elm)$/,
        {
            patternBlockCommentStart: /^\s*{-/,
            patternBlockCommentEnd: /-}/,
            blockCommentStart: '{-',
            blockCommentEnd: '-}\n',
            blockCommentPrefix: '   '
        }
    ]
]);

function die(message) {
    console.error(`ERROR: ${message}`);

    process.exit(1);
}

const filename = process.argv[2];

if (!filename) {
    die('no file specified');
}

let fileType;

for (const [pattern, f] of fileTypes) {
    if (pattern.test(filename)) {
        fileType = f;
    }
}

if (!fileType) {
    die(`${filename}: unhandled file type`);
}

let license = [
    fileType.blockCommentStart,
    ...licenseHeader.split('\n').map(x => (fileType.blockCommentPrefix + x).trimRight()),
    fileType.blockCommentEnd,
    ''
];

let fileContent;

try {
    fileContent = fs.readFileSync(filename, { encoding: 'utf8' }).split('\n');
} catch (e) {
    die(`${filename}: unable to read file`);
}

lines = [];
let i = 0;

if (fileContent[0].match(/^#!/)) lines.push(fileContent[i++]);

let state = 'scanForCommentStart';

for (const l of fileContent) {
    switch (state) {
        case 'scanForCommentStart':
            if (/^\s*$/.test(l)) continue;

            if (fileType.patternBlockCommentStart.test(l)) {
                state = 'scanForCommentEnd';
                continue;
            }

            lines = [...lines, ...license, l];
            state = 'passthrough';

            continue;

        case 'scanForCommentEnd':
            if (fileType.patternBlockCommentEnd.test(l)) state = 'scanForStart';

            continue;

        case 'scanForStart':
            if (/^\s*$/.test(l)) continue;

            lines = [...lines, ...license, l];
            state = 'passthrough';

            continue;

        case 'passthrough':
            lines.push(l);
            continue;

        default:
            throw new Error(`illegal state ${state}`);
    }
}

fs.writeFileSync(filename, lines.join('\n'), { encoding: 'utf8' });

console.log(`updated license header for ${filename}`);
