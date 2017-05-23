import CartridgeModel from '../model/Cartridge';
import SettingsModel from '../model/Settings';

interface StorageManager {

    getAllCartridges(): Promise<Array<CartridgeModel>>;

    saveCartridge(cartridge: CartridgeModel): Promise<void>;

    deleteCartridge(cartridge: CartridgeModel): Promise<void>;

    getSettings(): Promise<SettingsModel>;

    saveSettings(settings: SettingsModel): Promise<void>;

}

export default StorageManager;
