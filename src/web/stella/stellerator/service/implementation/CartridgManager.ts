/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import { Middleware, MiddlewareAPI, Action, Store } from 'redux';
import { push } from 'react-router-redux';
import * as JsZip from 'jszip';

import CartridgeManagerInterface from '../CartridgeManager';
import StorageManager from '../StorageManager';
import {
    actions,
    UploadNewCartridgeAction,
    SelectCartridgeAction,
    ConfirmLoadAction,
    ConfirmSelectAction,
    SelectRomFromZipfileAction
} from '../../actions/cartridgeManager';
import { saveCurrentCartride, registerNewCartridge, selectCartridge, types as rootActions } from '../../actions/root';
import {
    setMode,
    openLoadPendingChangesModal,
    openSelectPendingChangesModal,
    closeLoadPendingChangesModal,
    closeSelectPendingChangesModal
} from '../../actions/guiState';
import { set as setZipfile, clear as clearZipfile, setError as setZipfileError } from '../../actions/zipfile';
import { start as startEmulation } from '../../actions/emulation';
import { GuiMode } from '../../model/types';
import State from '../../state/State';
import Cartride from '../../model/Cartridge';
import { calculateFromUint8Array as md5sum } from '../../../../../tools/hash/md5';

class CartridgeManager implements CartridgeManagerInterface {
    constructor(private _storage: StorageManager) {}

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
        const reader = new FileReader(),
            fileContent = await new Promise<Uint8Array>(r => {
                reader.addEventListener('load', () => r(new Uint8Array(reader.result as ArrayBuffer)));
                reader.readAsArrayBuffer(action.file);
            });

        if (action.file.name.match(/\.zip$/i)) {
            return this._handleZipfile(action.file.name, fileContent);
        } else {
            return this._handleCartridge(action.file.name, fileContent);
        }
    }

    private async _handleCartridge(name: string, content: Uint8Array) {
        const state = this._store.getState(),
            changes =
                !!state.currentCartridge &&
                !Cartride.equals(state.currentCartridge, state.cartridges[state.currentCartridge.hash]);

        if (changes) {
            await this._store.dispatch(openLoadPendingChangesModal(content, name));
        } else {
            await this._storage.saveImage(md5sum(content), content);
            await this._store.dispatch(registerNewCartridge(name, content));
        }
    }

    private async _handleZipfile(name: string, content: Uint8Array): Promise<void> {
        const zipfile = new JsZip();

        try {
            await zipfile.loadAsync(content);

            const files = zipfile.file(/\.(bin|a26)$/i);

            if (files.length === 0) {
                this._store.dispatch(setZipfileError('No ROM images in ZIP file.'));
            } else if (files.length === 1) {
                const file = files[0],
                    deflatedImage = await file.async('uint8array');

                this._handleCartridge(file.name.replace(/^.*\//, ''), deflatedImage);
            } else {
                await this._store.dispatch(setZipfile(content, files.map(f => f.name).sort()));
            }
        } catch (e) {
            await this._store.dispatch(clearZipfile());
            await this._store.dispatch(setZipfileError('Unable to read ZIP.'));
        }
    }

    private async _onSelectRomFromZipfile(action: SelectRomFromZipfileAction): Promise<void> {
        const zipfile = new JsZip(),
            state = this._store.getState();

        try {
            await zipfile.loadAsync(state.zipfile.content);

            const file = zipfile.file(action.filename);

            if (!file) {
                throw new Error('no such file in archive');
            }

            const deflatedImage = await file.async('uint8array');

            await this._handleCartridge(action.filename.replace(/^.*\//, ''), deflatedImage);
            await this._store.dispatch(clearZipfile());
        } catch (e) {
            await this._store.dispatch(clearZipfile());
            await this._store.dispatch(setZipfileError(`Unable to read '${action.filename}' from ZIP.`));
        }
    }

    private async _onConfirmLoad(action: ConfirmLoadAction): Promise<void> {
        if (!action.discardChanges) {
            await this._store.dispatch(saveCurrentCartride());
        }

        const cartridgeData = this._store.getState().guiState.pendingLoad;

        await this._storage.saveImage(md5sum(cartridgeData), cartridgeData);
        await this._store.dispatch(registerNewCartridge());
        await this._store.dispatch(closeLoadPendingChangesModal());
    }

    private async _onSelectCartridge(action: SelectCartridgeAction): Promise<void> {
        const state = this._store.getState(),
            changes =
                !!state.currentCartridge &&
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

    private _onDeleteCurrentCartridge(): Promise<void> {
        return this._storage.deleteImage(this._store.getState().currentCartridge.hash);
    }

    private _middleware = ((api: MiddlewareAPI) => (next: (a: Action) => any) => async (
        action: Action
    ): Promise<void> => {
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

            case actions.selectRomFromZipfile:
                await next(action);
                return this._onSelectRomFromZipfile(action as SelectRomFromZipfileAction);

            case rootActions.deleteCurrentCartridge:
                await this._onDeleteCurrentCartridge();
                return next(action);
        }

        return next(action);
    }) as Middleware;

    private _store: Store<State>;
}

export { CartridgeManager as default };
