/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2016  Christian Speckner & contributors
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


// tslint:disable-next-line
import * as React from 'react';

import Navbar from './Navbar';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

function App(emulationService: EmulationServiceInterface) {
    class App
        extends React.Component<App.Props, {}>
        implements React.ChildContextProvider<App.Context>
    {
        getChildContext(): App.Context {
            return {
                emulationService
            };
        }

        render() {
            return <div>
                <Navbar/>

                {this.props.children}
            </div>;
        }

        static childContextTypes: React.ValidationMap<any> = {
            emulationService: React.PropTypes.object
        };
    }

    return App;
}

module App {

    export interface Props {
        children: Array<React.ReactNode>;
    }

    export interface Context {
        emulationService: EmulationServiceInterface;
    }

}

export default App;
