import Board from './Board';
import Bus from './Bus';

const REPORT_INTERVAL_CYCLES = 2000000;

export default class ProfilingProbe {
    constructor(board: Board) {
        this.bus = board.getBus();

        board.cpuClock.addHandler(ProfilingProbe.onCycle, this);
        this.bus.event.read.addHandler(ProfilingProbe.onAccess, this);
        this.bus.event.write.addHandler(ProfilingProbe.onAccess, this);
    }

    reset(): void {
        this.cycles = this.busTransitions = this.busTransitionsCartridge = 0;
        this.lastBusAddress = -1;
    }

    private report(): void {
        console.log(
            `${this.cycles} cycles total, ${Math.round(
                (this.busTransitions / this.cycles) * 100
            )}% transitions, ${Math.round(
                (this.busTransitionsCartridge / this.cycles) * 100
            )}% transitions in cart space`
        );
    }

    private static onCycle(cycles: number, self: ProfilingProbe): void {
        const cyclesBefore = self.cycles;
        self.cycles += cycles;

        if (((self.cycles / REPORT_INTERVAL_CYCLES) | 0) > ((cyclesBefore / REPORT_INTERVAL_CYCLES) | 0)) self.report();
    }

    private static onAccess(accessType: Bus.AccessType, self: ProfilingProbe): void {
        const lastBusAddress = self.lastBusAddress;
        self.lastBusAddress = self.bus.getLastAddresBusValue();

        if (lastBusAddress === self.lastBusAddress) return;

        self.busTransitions++;
        if (accessType === Bus.AccessType.cartridge) self.busTransitionsCartridge++;
    }

    private cycles = 0;
    private busTransitions = 0;
    private busTransitionsCartridge = 0;

    private lastBusAddress = -1;
    private bus: Bus;
}
