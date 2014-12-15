var Cpu = require('../../src/cpu/Cpu'),
    SimpleMemory = require('../../src/machine/SimpleMemory'),
    hex = require('../../src/tools/hex'),
    binary = require('../../src/tools/binary'),
    _ = require('lodash'),
    util = require('util');

function Runner(code, base) {
    if (typeof(base) === 'undefined') base = 0xE000;

    this._memory = new SimpleMemory();
    this._cpu = new Cpu(this._memory);
    this._code = code;
    this._cycles = 0;
    this._base = base;
    this._originalState = null;

    var codeLength = code.length;
    for (var i = 0; i < codeLength; i++)
        this._memory.poke(base + i, code[i]);

    this._memory.poke(0xFFFC, base & 0xFF);
    this._memory.poke(0xFFFD, base >> 8);

    this._cpu.reset();
    while (this._cpu.executionState !== Cpu.ExecutionState.fetch) {
        this._cpu.cycle();
    }
}

Runner.prototype.setState = function(state) {
    var me = this;

    ['a', 'x', 'y', 's', 'flags'].forEach(function(property) {
        if (state.hasOwnProperty(property)) me._cpu.state[property] = state[property];
    });

    return this;
};

Runner.prototype.poke = function(peeks) {
    var me = this;

    Object.keys(peeks).forEach(function(address) {
        me._memory.poke(hex.decode(address), peeks[address]);
    });

    return this;
};

Runner.prototype.run = function(maxCycles) {
    if (typeof(maxCycles) === 'undefined') maxCycles = 100;

    var codeEnd = this._base + this._code.length,
        pBeforeExecute = this._cpu.state.p;

    this._originalState = _.clone(this._cpu.state);

    this._cpu.setInvalidInstructionCallback(function() {
        throw new Error('invalid instruction!');
    });

    while (pBeforeExecute !== codeEnd && this._cycles <= maxCycles) {
        do {
            pBeforeExecute = this._cpu.state.p;
            this._cpu.cycle();
            this._cycles++;
        } while (this._cpu.executionState !== Cpu.ExecutionState.fetch);
    }

    if (this._cycles > maxCycles)
        throw new Error('maximum execution cycles exceeded');

    return this;
};

Runner.prototype.assertCycles = function(cycles) {
    if (this._cycles !== cycles) throw new Error(
        util.format('Cycle count mismatch, expected %s, got %s', cycles, this._cycles));

    return this;
};

Runner.prototype.assertState = function(state) {
    if (typeof(state) === 'undefined') state = {};

    var me = this,
        reference;

    ['a', 'x', 'y', 's'].forEach(function(property) {
        var reference = state.hasOwnProperty(property) ?
            state[property] : me._originalState[property];

        if (reference !== me._cpu.state[property]) throw new Error(
            util.format('expected %s to be %s, got %s', 
                property.toUpperCase(),
                hex.encode(reference, 2),
                hex.encode(me._cpu.state[property], 2)
            ));
    });

    if ((reference = state.hasOwnProperty('flags') ?
            state.flags : me._originalState.flags
        ) !== me._cpu.state.flags)
    {
        throw new Error(util.format('expected flags to be %s, got %s',
            binary.encode(reference, 8), binary.encode(me._cpu.state.flags, 8)));
    }

    if (state.hasOwnProperty('p') && state.p !== me._cpu.state.p) {
        throw new Error(util.format('expected P to be %s, got %s',
            hex.encode(state.p, 4), hex.encode(me._cpu.state.p, 4)));
    }

    return this;
};

Runner.prototype.assertMemory = function(checks) {
    var me = this;

    Object.keys(checks).forEach(function(address) {
        if (checks[address] !== me._memory.peek(hex.decode(address)))
            throw new Error(util.format('memory corrupt at %s: expected %s, got %s',
                address,
                hex.encode(checks[address], 2),
                hex.encode(me._memory.peek(hex.decode(address)), 2)
            ));
    });
};

Runner.prototype.getCpu = function() {
    return this._cpu;
};

function create(code, base) {
    return new Runner(code, base);
}

module.exports = {
    Runner: Runner,
    create: create
};
