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
        return this.runUntil(() => this._board.getCpu().executionState !== CpuInterface.ExecutionState.boot);
    }

    cld(): this {
        this.getBoard().getCpu().state.flags &= ~CpuInterface.Flags.d;
        return this;
    }

    runUntil(
        condition: (runner: this) => boolean,
        maxCycles = 500000,
        stepping = VcsRunner.Stepping.instruction
    ): this {
        for (let i = 0; i < maxCycles; i++) {
            switch (stepping) {
                case VcsRunner.Stepping.colorClock:
                    this._tick();

                    break;

                case VcsRunner.Stepping.cpuClock:
                    do {
                        this._tick();
                    } while (this._board.getSubclock() !== 0);

                    break;

                case VcsRunner.Stepping.instruction:
                    do {
                        this._tick();
                    } while (
                        this._board.getSubclock() !== 0 ||
                        this._board.getCpu().executionState !== CpuInterface.ExecutionState.fetch
                    );

                    break;
            }

            this._traps.forEach((trap) => trap.condition(this) && trap.handler());

            if (condition(this)) {
                return this;
            }
        }

        throw new Error(`break condition not met after ${maxCycles} cycles`);
    }

    runTo(label: string, maxCycles = 500000): this {
        return this.runUntil(() => this.hasReachedLabel(label), maxCycles, VcsRunner.Stepping.instruction);
    }

    hasReachedLabel(label: string): boolean {
        return (this._board.getCpu().state.p & 0x1fff) === (this._resolveLabel(label) & 0x1fff);
    }

    jumpTo(label: string): this {
        this.getBoard().getCpu().state.p = this._resolveLabel(label) & 0xffff;

        return this;
    }

    getBoard(): Board {
        return this._board;
    }

    getCpuCycles(): number {
        return this._cpuClocks;
    }

    getColorClocks(): number {
        return this._colorClocks;
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

    trap(condition: VcsRunner.Trap['condition'], handler: VcsRunner.Trap['handler']) {
        this._traps.push({ condition, handler });

        return this;
    }

    trapAt(label: string, handler: VcsRunner.Trap['handler']): this {
        return this.trap(() => this.hasReachedLabel(label), handler);
    }

    trapAlways(handler: VcsRunner.Trap['handler']): this {
        return this.trap(() => true, handler);
    }

    private _resolveLabel(label: string): number {
        if (!this._symbols.has(label)) {
            throw new Error(`invalid label ${label}`);
        }

        return this._symbols.get(label);
    }

    private _tick(): void {
        this._board.tick(1);

        this._colorClocks++;
        if (this._board.getSubclock() === 0) {
            this._cpuClocks++;
        }
    }

    private _assembly: Uint8Array;
    private _symbols: Map<string, number>;
    private _cartridge: CartridgeInterface;
    private _board: Board;

    private _traps: Array<VcsRunner.Trap> = [];
    private _cpuClocks = 0;
    private _colorClocks = 0;
}

namespace VcsRunner {
    export enum Stepping {
        instruction,
        cpuClock,
        colorClock,
    }

    export interface Trap {
        condition: (runner: VcsRunner) => boolean;
        handler: () => void;
    }
}

export default VcsRunner;
