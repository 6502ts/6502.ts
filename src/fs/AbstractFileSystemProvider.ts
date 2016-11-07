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

import * as pathlib from 'path';

abstract class AbstractFileSystemProvider {

    pushd(path?: string): void {
        this._directoryStack.unshift(this._cwd);

        if (typeof(path) !== 'undefined') this.chdir(path);
    }

    popd(): string {
        if (this._directoryStack.length === 0) return;

        const targetDir = this._directoryStack.shift();

        this.chdir(targetDir);

        return targetDir;
    }

    cwd(): string {
        return this._cwd;
    }

    chdir(path: string): void {
        this._cwd = this._resolvePath(path);
    }

    protected _resolvePath(path: string): string {
        return pathlib.resolve(this._cwd, path);
    }

    protected _directoryStack: Array<string> = [];
    protected _cwd = '/';
}

export default AbstractFileSystemProvider;
