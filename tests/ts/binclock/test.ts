import { strictEqual } from 'assert';
import path from 'path';
import VcsRunner from '../../../src/test/VcsRunner';

suite('binclock', () => {
    let runner: VcsRunner;

    setup(async () => {
        runner = await VcsRunner.fromFile(path.join(__dirname, 'bitclock.asm'));
    });

    test('memory is initialized', () => {
        runner.runUntil(() => runner.hasReachedLabel('InitComplete'));

        for (let i = 0xff; i >= 0x80; i--) {
            strictEqual(runner.readMemory(i), 0, `located at 0x${i.toString(16).padStart(4, '0')}`);
        }
    });

    test('handles day-change properly (via mainloop)', () => {
        runner
            .runUntil(() => runner.hasReachedLabel('AdvanceClock'))
            .writeMemoryAt('hours', 23)
            .writeMemoryAt('minutes', 59)
            .writeMemoryAt('seconds', 59);

        for (let i = 0; i < 50; i++) {
            runner.runUntil(() => runner.hasReachedLabel('AdvanceClock'));
        }

        strictEqual(runner.readMemoryAt('hours'), 0);
        strictEqual(runner.readMemoryAt('minutes'), 0);
        strictEqual(runner.readMemoryAt('seconds'), 0);
    });

    test('handles day-change properly (unit test)', () => {
        runner
            .boot()
            .cld()
            .jumpTo('AdvanceClock')
            .writeMemoryAt('hours', 23)
            .writeMemoryAt('minutes', 59)
            .writeMemoryAt('seconds', 59)
            .writeMemoryAt('frames', 49)
            .runUntil(() => runner.hasReachedLabel('ClockIncrementDone'));

        strictEqual(runner.readMemoryAt('hours'), 0);
        strictEqual(runner.readMemoryAt('minutes'), 0);
        strictEqual(runner.readMemoryAt('seconds'), 0);
        strictEqual(runner.readMemoryAt('frames'), 0);
    });
});
