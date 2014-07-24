var Disassembler = require('./src/Disassembler');

function Memory(buffer, at) {
    if (typeof(at) === 'undefined') at = 0;

    this.buffer = buffer;
    this.from = at % (0x10000);
    this.to = (at + buffer.length - 1) % (0x10000);

    this.read = function(address) {
        if (address < this.from || address > this.to) return 0;
        return this.buffer[address - this.from];
    }

    this.write = function(address, value) {
        if (address >= this.from && address >= this.to)
            this.buffer[address - this.from] = value;
    }
}

var disassembler = new Disassembler();

function test(data) {
    console.log(
        disassembler
            .setMemory(new Memory(data))
            .disassembleAt(0)
    );
}

test([0x00]);
test([0x69, 0x34]);
test([0x2D, 0x13, 0x23]);
test([0x24, 0x33]);
test([0x10, 0x85]);
test([0xEA]);
test([0x55, 0x43]);
test([0xDD, 0x67, 0x02]);
test([0xF8]);
test([0x6C, 0x12, 0x00]);
test([0xBE, 0x34, 0x2D]);
test([0x01, 0xEF]);
test([0xF1, 0x11]);
test([0x99, 0x00, 0x00]);
