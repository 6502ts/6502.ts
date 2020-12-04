import fs from 'fs';
import dasm from 'dasm';
import CartridgeFactory from '../machine/stella/cartridge/CartridgeFactory';
import CartridgeInterface from '../machine/stella/cartridge/CartridgeInterface';
import CartridgeInfo from '../machine/stella/cartridge/CartridgeInfo';
import Config from '../machine/stella/Config';
import Board from '../machine/stella/Board';
import CpuInterface from '../machine/cpu/CpuInterface';

class VcsRunner {
    private constructor() {}

    static async fromSource(source: string): Promise<VcsRunner> {
        const self = new VcsRunner();

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

    static async fromFile(fileName: string): Promise<VcsRunner> {
        return this.fromSource(fs.readFileSync(fileName, 'utf-8'));
    }

    boot(): this {
        return this.runUntil((board) => board.getCpu().executionState !== CpuInterface.ExecutionState.boot);
    }

    cld(): this {
        this.getBoard().getCpu().state.flags &= ~CpuInterface.Flags.d;
        return this;
    }

    runUntil(condition: (board: Board) => boolean, maxCycles = 500000): this {
        for (let i = 0; i < maxCycles; i++) {
            this._board.tick(3);

            this._clocks++;

            if (condition(this._board)) {
                return this;
            }
        }

        throw new Error(`break condition not met after ${maxCycles} cycles`);
    }

    hasReachedLabel(label: string): boolean {
        return (
            this._board.getCpu().executionState === CpuInterface.ExecutionState.fetch &&
            (this._board.getCpu().state.p & 0x1fff) === (this._resolveLabel(label) & 0x1fff)
        );
    }

    jumpTo(label: string): this {
        this.getBoard().getCpu().state.p = this._resolveLabel(label) & 0xffff;

        return this;
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
        this.getBoard().getBus().write(this._resolveLabel(label), value);
        return this;
    }

    readMemoryAt(label: string): number {
        return this.getBoard().getBus().read(this._resolveLabel(label));
    }

    private _resolveLabel(label: string): number {
        if (!this._symbols.has(label)) {
            throw new Error(`invalid label ${label}`);
        }

        return this._symbols.get(label);
    }

    private _assembly: Uint8Array;
    private _symbols: Map<string, number>;
    private _cartridge: CartridgeInterface;
    private _board: Board;
    private _clocks = 0;
}

export default VcsRunner;
