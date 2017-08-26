#!/usr/bin/env node

const fs = require('fs');

function dumpChar(rom, offset) {
    const lines = [];

    lines.push('\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510');

    for (let row = 0; row < 8; row++) {
        const byte = rom[offset + row];

        let charString = '\u2502';

        charString += ((byte & 0x80) ? 'F' : '.'); 

        for (let i = 6; i >= 0; i--) {
            charString += ((byte & (1 << i)) ? '\u2593' : '\u2591');
        }

        charString += '\u2502';

        lines.push(charString);
    }

    lines.push('\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518');

    return lines;
}

function characterClass(index) {
    if (index < 0x40) {
        return 'inverse';
    }

    if (index < 0x80) {
        return 'flashing';
    }

    if (index < 0xa0) {
        return 'control';
    }

    if (index < 0xe0) {
        return 'normal';
    }

    return 'lower';
}

function padLine(line) {
    while (line.length < 20) {
        line += ' ';
    }

    return line;
}

function usage() {
    [
        'usage: dump_character_rom.js rom.bin',
        '',
        'Dump the characters within the Apple II character ROM'
    ].map(x => console.log(x));
}

function main() {
    const romfile = process.argv[2];
    if (!romfile) {
        throw new Error('no ROM specified');
    }

    const rom = fs.readFileSync(process.argv[2]);

    if (rom.length !== 0x800) {
        throw new Error('not a character ROM: invalid length');
    }

    let lines = [];

    for (let i = 255; i >= 0; i--) {
        let hex = i.toString(16);

        hex = hex.length < 2 ? ('0x0' + hex) : ('0x' + hex);

        lines = [
            ...lines,
            `${hex} (${characterClass(i)})`,
            ...dumpChar(rom, i * 8)
        ];
    }

    for (let row = 0; row < 64; row++) {
        const offset = row * 4 * 11;

        for (let i = 0; i < 11; i++) {
            let line = '';

            for (let j = 0; j < 4; j++) {
                line += padLine(lines[offset + j * 11 + i]);
            }

            console.log(line);
        }

        console.log();
    }
}

try {
    main();
} catch (e) {
    console.log(e.message);
    console.log();
    usage();
}