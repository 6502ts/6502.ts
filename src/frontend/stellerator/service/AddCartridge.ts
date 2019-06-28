import { injectable } from 'inversify';
import { Ports, Cartridge, TvMode } from '../../elm/Stellerator/Main.elm';
import { calculateFromUint8Array as md5sum } from '../../../tools/hash/md5';
import CartridgeDetector from '../../../machine/stella/cartridge/CartridgeDetector';

@injectable()
class AddCartridge {
    constructor() {
        this._input.type = 'file';
        this._input.accept = '.bin, .a26';
        this._input.multiple = true;

        this._input.addEventListener('change', this._onCartridgeAdded);
    }

    init(ports: Ports): void {
        this._ports = ports;

        ports.addCartridge_.subscribe(this._addCartridge);
    }

    private _addCartridge = (): void => {
        this._input.click();
    };

    private _onCartridgeAdded = async (e: Event): Promise<void> => {
        const target: HTMLInputElement = e.target as any;

        const cartridges = await Promise.all<Cartridge | undefined>(
            Array.prototype.map.call(target.files, (file: File) => this._processCartridge(file))
        );

        this._ports.onNewCartridges_.send(cartridges.filter(c => !!c));
    };

    private async _processCartridge(file: File): Promise<Cartridge | undefined> {
        try {
            const content = await new Promise<Uint8Array>((resolve, reject) => {
                const reader = new FileReader();

                reader.addEventListener('load', () => resolve(new Uint8Array(reader.result as ArrayBuffer)));
                reader.addEventListener('error', () => reject(reader.error));

                reader.readAsArrayBuffer(file);
            });

            const hash = md5sum(content);
            const name = file.name.replace(/\..*?$/, '');
            const tvMode = this._tvModeFromName(name);
            const cartridgeType = this._detector.detectCartridgeType(content);

            return {
                hash,
                name,
                tvMode,
                cartridgeType,
                emulatePaddles: false,
                volume: 100
            };
        } catch (_) {
            return undefined;
        }
    }

    private _tvModeFromName(name: string): TvMode {
        if (name.match(/[\W\-_]pal\d*[\W\-_]/i)) {
            return TvMode.pal;
        }

        if (name.match(/[\W\-_]secam\d*[\W\-_]/i)) {
            return TvMode.secam;
        }

        return TvMode.ntsc;
    }

    private _input = document.createElement('input');
    private _ports: Ports;
    private _detector = new CartridgeDetector();
}

export default AddCartridge;
