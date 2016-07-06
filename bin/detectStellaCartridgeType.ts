import * as fs from 'fs';
import Detector from '../src/machine/stella/cartridge/CartridgeDetector';
import CartridgeInfo from '../src/machine/stella/cartridge/CartridgeInfo';

function usage(): void {
    console.log(`detectStellaCartridgeType.js <cartridge file>`);
    process.exit(1);
}

if (process.argv.length <= 2) {
    usage();
}

try {
    const buffer = fs.readFileSync(process.argv[2]),
        detector = new Detector(),
        cartridgeType = detector.detectCartridgeType(buffer);

    console.log(CartridgeInfo.describeCartridgeType(cartridgeType));

} catch (e) {
    console.log(e.message);
    process.exit(1);
}
