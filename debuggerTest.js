var fs = require('fs'),
    Debugger = require('./src/Debugger');

var dbg = new Debugger(),
    data = fs.readFileSync('./ehbasic.bin');

dbg.loadBlock(data, 0xC000);

console.log(dbg.disassembleAt(0xFF80, 50));
console.log();
console.log(dbg.disassembleAt(0xE0EA, 20));
console.log();
console.log(dbg.disassembleAt(0xE0ED, 20));
