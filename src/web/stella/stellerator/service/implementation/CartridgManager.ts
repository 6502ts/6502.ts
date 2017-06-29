import {Middleware, MiddlewareAPI, Action, Store} from 'redux';
import {push} from 'react-router-redux';

import CartridgeManagerInterface from '../CartridgeManager';
import {
    actions,
    UploadNewCartridgeAction,
    SelectCartridgeAction,
    ConfirmLoadAction,
    ConfirmSelectAction
} from '../../actions/cartridgeManager';
import {
    saveCurrentCartride,
    registerNewCartridge,
    selectCartridge
} from '../../actions/root';
import {
    setMode,
    openLoadPendingChangesModal,
    openSelectPendingChangesModal,
    closeLoadPendingChangesModal,
    closeSelectPendingChangesModal
} from '../../actions/guiState';
import {start as startEmulation} from '../../actions/emulation';
import {GuiMode} from '../../model/types';
import State from '../../state/State';
import Cartride from '../../model/Cartridge';

class CartridgeManager implements CartridgeManagerInterface {

    setStore(store: Store<State>): void {
        this._store = store;
    }

    getMiddleware(): Middleware {
        return this._middleware;
    }

    private async _onRunCurrentCartridge(): Promise<void> {
        await this._store.dispatch(saveCurrentCartride());
        await this._store.dispatch(setMode(GuiMode.run));
        await this._store.dispatch(startEmulation());
        await this._store.dispatch(push('/emulation'));
    }

    private async _onUpload(action: UploadNewCartridgeAction): Promise<void> {
        const state = this._store.getState(),
            name = action.file.name,
            changes = !!state.currentCartridge &&
                !Cartride.equals(state.currentCartridge, state.cartridges[state.currentCartridge.hash]);

        const reader = new FileReader(),
            cartridgeData = await new Promise<Uint8Array>(
                r => {
                    reader.addEventListener('load', () => r(new Uint8Array(reader.result)));
                    reader.readAsArrayBuffer(action.file);
                }
            );

        if (changes) {
            await this._store.dispatch(openLoadPendingChangesModal(cartridgeData, name));
        } else {
            await this._store.dispatch(registerNewCartridge(name, cartridgeData));
        }
    }

    private async _onConfirmLoad(action: ConfirmLoadAction): Promise<void> {
        if (!action.discardChanges) {
            await this._store.dispatch(saveCurrentCartride());
        }

        await this._store.dispatch(registerNewCartridge());
        await this._store.dispatch(closeLoadPendingChangesModal());
    }

    private async _onSelectCartridge(action: SelectCartridgeAction): Promise<void> {
        const state = this._store.getState(),
            changes = !!state.currentCartridge &&
                !Cartride.equals(state.currentCartridge, state.cartridges[state.currentCartridge.hash]);

        if (changes) {
            await this._store.dispatch(openSelectPendingChangesModal(action.key));
        } else {
            await this._store.dispatch(selectCartridge(action.key));
        }
    }

    private async _onConfirmSelect(action: ConfirmSelectAction): Promise<void> {
        if (!action.discardChanges) {
            await this._store.dispatch(saveCurrentCartride());
        }

        await this._store.dispatch(selectCartridge());
        await this._store.dispatch(closeSelectPendingChangesModal());
    }

    private _middleware =
        (api: MiddlewareAPI<State>) => (next: (a: Action) => any) => async (action: Action): Promise<void> =>
    {
        switch (action.type) {
            case actions.runCurrentCartridge:
                await next(action);
                return this._onRunCurrentCartridge();

            case actions.uploadNewCartridge:
                await next(action);
                return this._onUpload(action as UploadNewCartridgeAction);

            case actions.confirmLoad:
                await next(action);
                return this._onConfirmLoad(action as ConfirmLoadAction);

            case actions.selectCartridge:
                await next(action);
                return this._onSelectCartridge(action as SelectCartridgeAction);

            case actions.confirmSelect:
                await next(action);
                return this._onConfirmSelect(action as ConfirmSelectAction);
        }

        return next(action);
    }

    private _store: Store<State>;

}

export default CartridgeManager;
