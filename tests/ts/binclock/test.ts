import assert from 'assert';
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
            assert.strictEqual(runner.readMemory(i), 0, `located at 0x${i.toString(16).padStart(4, '0')}`);
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

        assert.strictEqual(runner.readMemoryAt('hours'), 0);
        assert.strictEqual(runner.readMemoryAt('minutes'), 0);
        assert.strictEqual(runner.readMemoryAt('seconds'), 0);
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

        assert.strictEqual(runner.readMemoryAt('hours'), 0);
        assert.strictEqual(runner.readMemoryAt('minutes'), 0);
        assert.strictEqual(runner.readMemoryAt('seconds'), 0);
        assert.strictEqual(runner.readMemoryAt('frames'), 0);
    });

    test('frame size is 312 lines / PAL', () => {
        let cyclesAtFrameStart = -1;

        runner
            .runTo('MainLoop')
            .trapAt('MainLoop', () => {
                if (cyclesAtFrameStart > 0) {
                    assert.strictEqual(runner.getCpuCycles() - cyclesAtFrameStart, 312 * 76);
                }

                cyclesAtFrameStart = runner.getCpuCycles();
            })
            .runTo('MainLoop')
            .runTo('MainLoop');
    });

    test('frame size is 312 lines / PAL with overflow', () => {
        let cyclesAtFrameStart = -1;

        runner
            .runTo('MainLoop')
            .trapAt('MainLoop', () => {
                if (cyclesAtFrameStart > 0) {
                    assert.strictEqual(runner.getCpuCycles() - cyclesAtFrameStart, 312 * 76);
                }

                cyclesAtFrameStart = runner.getCpuCycles();
            })
            .runTo('MainLoop')
            .writeMemoryAt('hours', 23)
            .writeMemoryAt('minutes', 59)
            .writeMemoryAt('seconds', 59)
            .writeMemoryAt('frames', 49)
            .runTo('MainLoop');
    });

    test('it takes 50 frames to count one second', () => {
        let frameNo = 1;

        runner
            .runTo('MainLoop')
            .writeMemoryAt('hours', 0)
            .writeMemoryAt('minutes', 0)
            .writeMemoryAt('seconds', 0)
            .writeMemoryAt('frames', 0)
            .trapAt('MainLoop', () => frameNo++)
            .runUntil(() => runner.readMemoryAt('seconds') === 1, 100 * 312 * 76);

        assert.strictEqual(frameNo, 50);
    });
});
