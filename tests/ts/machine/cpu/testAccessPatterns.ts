import Runner from './Runner';
import AccessLog from './AccessLog';

export function run() {
    suite('addressing patterns', function() {

        test('absolute,X via LDA', () => Runner
            .create([0xBD, 0x00, 0xA0], 0xE000)
            .setState({
                x: 0x05
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0xE002)
                .read(0xA005)
            )
        );

        test('absolute,X via LDA (page crossing)', () => Runner
            .create([0xBD, 0xFF, 0xA0], 0xE000)
            .setState({
                x: 0x05
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0xE002)
                .read(0xA004)
                .read(0xA104)
            )
        );

        test('absolute,Y via LDA', () => Runner
            .create([0xB9, 0x00, 0xA0], 0xE000)
            .setState({
                y: 0x05
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0xE002)
                .read(0xA005)
            )
        );

        test('absolute,Y via LDA (page crossing)', () => Runner
            .create([0xB9, 0xFF, 0xA0], 0xE000)
            .setState({
                y: 0x05
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0xE002)
                .read(0xA004)
                .read(0xA104)
            )
        );

        test('zeropage,X via LDA', () => Runner
            .create([0xB5, 0x01], 0xE000)
            .setState({
                x: 0x05
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0x0001)
                .read(0x0006)
            )
        );

        test('zeropage,Y via LDX', () => Runner
            .create([0xB6, 0x01], 0xE000)
            .setState({
                y: 0x05
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0x0001)
                .read(0x0006)
            )
        );

        test('indexed,X via LDA', () => Runner
            .create([0xA1,0x01], 0xE000)
            .setState({
                x: 0x05
            })
            .poke({
                '0x06': 0x03,
                '0x07': 0xA0
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0x0001)
                .read(0x0006)
                .read(0x0007)
                .read(0xA003)
            )
        );

        test('indexed,Y via LDA', () => Runner
            .create([0xB1, 0x02], 0xE000)
            .setState({
                y: 0x05
            })
            .poke({
                '0x0002': 0x13,
                '0x0003': 0xB0
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0x0002)
                .read(0x0003)
                .read(0xB018)
            )
        );

    test('indexed,Y via LDA (page crossing)', () => Runner
            .create([0xB1, 0x02], 0xE000)
            .setState({
                y: 0xFF
            })
            .poke({
                '0x0002': 0x13,
                '0x0003': 0xB0
            })
            .run()
            .assertAccessLog(AccessLog
                .create()
                .read(0xE000)
                .read(0xE001)
                .read(0x0002)
                .read(0x0003)
                .read(0xB012)
                .read(0xB112)
            )
        );

    });
}