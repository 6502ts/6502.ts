import fs from 'fs';
import path from 'path';
import dasm from 'dasm';
import CartridgeFactory from '../../../src/machine/stella/cartridge/CartridgeFactory';
import CartridgeInterface from '../../../src/machine/stella/cartridge/CartridgeInterface';
import CartridgeInfo from '../../../src/machine/stella/cartridge/CartridgeInfo';
import Config from '../../../src/machine/stella/Config';
import Board from '../../../src/machine/stella/Board';
import CpuInterface from '../../../src/machine/cpu/CpuInterface';
import { strictEqual } from 'assert';

class Runner {
    private constructor() { }

    static async fromSource(source: string): Promise<Runner> {
        const self = new Runner();

        const result = dasm(source, {
            format: 3,
            machine: 'atari2600',
        });

        if (!result.success) {
            throw new Error(`assembly failed: ${result.output}`);
        }

        self._assembly = result.data;

        self._symbols = new Map<string, number>();
        result.symbols.forEach((s) => self._symbols.set(s.name, s.value | (s.isLabel ? 0xf000 : 0)));

        const factory = new CartridgeFactory();

        self._cartridge = await factory.createCartridge(self._assembly, CartridgeInfo.CartridgeType.vanilla_4k);
        self._board = new Board(Config.create(), self._cartridge);

        return self;
    }

    runUntil(condition: (board: Board) => boolean, maxCycles = 500000): this {
        for (let i = 0; i < maxCycles; i++) {
            this._board.tick(3);

            this._clocks++;

            if (this._board.getCpu().executionState === CpuInterface.ExecutionState.fetch && condition(this._board)) {
                return this;
            }
        }

        throw new Error(`break condition not met after ${maxCycles} cycles`);
    }

    atReachedLabel(label: string): boolean {
        if (!this._symbols.has(label)) {
            throw new Error(`invalid label ${label}`);
        }

        return (this._board.getCpu().state.p & 0x1fff) === (this._symbols.get(label) & 0x1fff);
    }

    getBoard(): Board {
        return this._board;
    }

    getClocks(): number {
        return this._clocks;
    }

    readMemory(address: number): number {
        return this.getBoard().getBus().read(address);
    }

    writeMemoryAt(label: string, value: number): this {
        if (!this._symbols.has(label)) {
            throw new Error(`invalid label ${label}`);
        }

        this.getBoard().getBus().write(this._symbols.get(label), value)

        return this
    }

    readMemoryAt(label: string): number {
        if (!this._symbols.has(label)) {
            throw new Error(`invalid label ${label}`);
        }

        return this.getBoard().getBus().read(this._symbols.get(label))
    }

    private _assembly: Uint8Array;
    private _symbols: Map<string, number>;
    private _cartridge: CartridgeInterface;
    private _board: Board;
    private _clocks = 0;
}

suite('binclock', () => {
    test('memory is initialized', async () => {
        const runner = await Runner.fromSource(fs.readFileSync(path.join(__dirname, 'bitclock.asm'), 'utf-8'));

        runner.runUntil(() => runner.atReachedLabel('InitComplete'));

        for (let i = 0xff; i >= 0x80; i--) {
            strictEqual(runner.readMemory(i), 0, `located at 0x${i.toString(16).padStart(4, '0')}`);
        }
    });

    test('handles day-change properly', async () => {
        const runner = await Runner.fromSource(fs.readFileSync(path.join(__dirname, 'bitclock.asm'), 'utf-8'));

        runner.runUntil(() => runner.atReachedLabel('NextFrame'))
            .writeMemoryAt('hours', 23)
            .writeMemoryAt('minutes', 59)
            .writeMemoryAt('seconds', 59);

        for (let i = 0; i < 50; i++) {
            runner.runUntil(() => runner.atReachedLabel('NextFrame'));
        }

        strictEqual(runner.readMemoryAt('hours'), 0);
        strictEqual(runner.readMemoryAt('minutes'), 0);
        strictEqual(runner.readMemoryAt('seconds'), 0);
    });
});
