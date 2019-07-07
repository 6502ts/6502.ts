import { injectable, inject } from 'inversify';
import JSZip from 'jszip';

import { Ports, TvMode } from '../../elm/Stellerator/Main.elm';
import { calculateFromUint8Array as md5sum } from '../../../tools/hash/md5';
import CartridgeDetector from '../../../machine/stella/cartridge/CartridgeDetector';
import Storage, { CartridgeWithImage } from './Storage';

@injectable()
class AddCartridge {
    constructor(@inject(Storage) private _storage: Storage) {}

    init(ports: Ports): void {
        this._ports = ports;

        ports.addCartridge_.subscribe(this._addCartridge);
    }

    private _addCartridge = (): void => {
        if (this._input) {
            this._input.removeEventListener('change', this._onCartridgeAdded);
        }

        this._input = document.createElement('input');
        this._input.type = 'file';
        this._input.accept = '.bin, .a26, .zip';
        this._input.multiple = true;

        this._input.addEventListener('change', this._onCartridgeAdded);

        this._input.click();
    };

    private _onCartridgeAdded = async (e: Event): Promise<void> => {
        const target: HTMLInputElement = e.target as any;

        const cartridges = (await Promise.all(Array.prototype.map.call(target.files, (f: File) =>
            this._processFile(f)
        ) as Array<Promise<Array<CartridgeWithImage>>>)).reduce((acc, x) => acc.concat(x), []);

        const cartridgesDeduped = Array.from(new Map(cartridges.map(c => [c.cartridge.hash, c])).values());

        await this._storage.insertCartridges(cartridgesDeduped);

        this._ports.onNewCartridges_.send(Array.from(cartridgesDeduped.map(c => c.cartridge)));
    };

    private async _processFile(file: File): Promise<Array<CartridgeWithImage>> {
        try {
            const content = await new Promise<Uint8Array>((resolve, reject) => {
                const reader = new FileReader();

                reader.addEventListener('load', () => resolve(new Uint8Array(reader.result as ArrayBuffer)));
                reader.addEventListener('error', () => reject(reader.error));

                reader.readAsArrayBuffer(file);
            });

            if (file.name.match(/.zip$/i)) {
                const zip = new JSZip();

                await zip.loadAsync(content);

                return await Promise.all(
                    zip
                        .file(/\.(bin|a26)$/i)
                        .filter(f => !f.dir)
                        .map(f => f.async('uint8array').then(c => this._createCartridge(f.name.replace(/.*\//, ''), c)))
                );
            } else {
                return [this._createCartridge(file.name, content)];
            }
        } catch (_) {
            return [];
        }
    }

    private _createCartridge(filename: string, content: Uint8Array): CartridgeWithImage {
        const hash = md5sum(content);
        const name = filename.replace(/\.[^\.]*$/, '');
        const tvMode = this._tvModeFromName(name);
        const cartridgeType = this._detector.detectCartridgeType(content);

        return {
            cartridge: {
                hash,
                name,
                tvMode,
                cartridgeType,
                emulatePaddles: false,
                volume: 100
            },
            image: content
        };
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

    private _input: HTMLInputElement = null;
    private _ports: Ports;
    private _detector = new CartridgeDetector();
}

export default AddCartridge;
