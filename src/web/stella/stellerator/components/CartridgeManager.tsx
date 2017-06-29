/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2017 Christian Speckner & contributors
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

import * as React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';

import CartridgeInfo from '../../../../machine/stella/cartridge/CartridgeInfo';
import StellaConfig from '../../../../machine/stella/Config';

import CartridgeControls from './cartridge-manager/CartridgeControls';
import CartridgeList from './cartridge-manager/CartridgeList';
import CartridgeSettings from './cartridge-manager/CartridgeSettings';
import PendingChangesModal from './cartridge-manager/PendingChangesModal';

import Cartridge from '../model/Cartridge';

export interface DataProps {
    cartridges: {[key: string]: Cartridge};
    pendingChanges: boolean;
    currentCartridge: Cartridge;

    showSelectPendingChangesModel: boolean;
    showLoadPendingChangesModel: boolean;
}

export interface HandlerProps {
    onDelete: () => void;
    onSave: () => void;
    onRun: () => void;
    onCartridgeUploaded: (file: File) => void;

    onCartridgeSelected: (key: string) => void;

    onCartridgeNameChange: (value: string) => void;
    onTvModeChanged: (tvMode: StellaConfig.TvMode) => void;
    onTogglePaddleEmulation: (state: boolean) => void;
    onToggleAudioEnabled: (state: boolean) => void;
    onCartridgeTypeChange: (t: CartridgeInfo.CartridgeType) => void;
    onChangeSeedStrategy: (auto: boolean) => void;
    onChangeSeedValue: (seed: number) => void;

    onSelectPendingChangesClose: () => void;
    onSelectPendingChangesSave: () => void;
    onSelectPendingChangesDiscard: () => void;

    onLoadPendingChangesClose: () => void;
    onLoadPendingChangesSave: () => void;
    onLoadPendingChangesDiscard: () => void;
}

export interface Props extends DataProps, HandlerProps {}

export default function CartridgeManager(props: Props) {
    return (
        <Grid fluid>
            <Row>
                <Col md={5}>
                    <CartridgeList
                        cartridges={props.cartridges}
                        selectedCartridgeKey={props.currentCartridge && props.currentCartridge.hash}

                        onClick={props.onCartridgeSelected}
                    />
                </Col>
                <Col md={5} mdOffset={1}>
                    <CartridgeSettings
                        cartridge={props.currentCartridge}

                        onCartridgeNameChange={props.onCartridgeNameChange}
                        onTvModeChanged={props.onTvModeChanged}
                        onSave={props.onSave}
                        onTogglePaddleEmulation={props.onTogglePaddleEmulation}
                        onToggleAudioEnabled={props.onToggleAudioEnabled}
                        onCartridgeTypeChange={props.onCartridgeTypeChange}
                        onChangeSeedStrategy={props.onChangeSeedStrategy}
                        onChangeSeedValue={props.onChangeSeedValue}
                    />
                </Col>
            </Row>
            <Row>
                <Col sm={5}>
                    <CartridgeControls
                        active={!!props.currentCartridge}
                        changes={props.pendingChanges}

                        onDelete={props.onDelete}
                        onSave={props.onSave}
                        onRun={props.onRun}
                        onCartridgeUploaded={props.onCartridgeUploaded}
                    />
                </Col>
            </Row>
            <PendingChangesModal
                show={props.showSelectPendingChangesModel}

                onHide={props.onSelectPendingChangesClose}
                onContinueAndSave={props.onSelectPendingChangesSave}
                onContinueAndDiscard={props.onSelectPendingChangesDiscard}
            >
                <p>
                    There are unsaved changes in the currently selected cartridge.
                    Selecting another cartridge will discard these changes.
                </p>
                <p>
                    Do you want to continue?
                </p>
            </PendingChangesModal>
            <PendingChangesModal
                show={props.showLoadPendingChangesModel}

                onHide={props.onLoadPendingChangesClose}
                onContinueAndSave={props.onLoadPendingChangesSave}
                onContinueAndDiscard={props.onLoadPendingChangesDiscard}
            >
                <p>
                    There are unsaved changes in the currently selected cartridge.
                    Loading a cartridge will discard these changes.
                </p>
                <p>
                    Do you want to continue?
                </p>
            </PendingChangesModal>
        </Grid>
    );
}
