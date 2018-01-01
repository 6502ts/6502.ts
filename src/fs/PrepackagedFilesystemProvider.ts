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

import * as util from 'util';
import AbstractFileSystemProvider from './AbstractFileSystemProvider';
import FilesystemProviderInterface from './FilesystemProviderInterface';

class PrepackagedFilesystemProvider extends AbstractFileSystemProvider implements FilesystemProviderInterface {
    constructor(private _blob: PrepackagedFilesystemProvider.BlobInterface) {
        super();
        this._cwd = '/';
    }

    readBinaryFileSync(name: string): Buffer {
        name = this._resolvePath(name);

        const content = this._lookup(name);

        if (typeof content === 'undefined') {
            throw new Error(util.format('%s not part of file bundle', name));
        }

        if (!Buffer.isBuffer(content)) {
            throw new Error(util.format('%s is a directory, not a file', name));
        }

        return content;
    }

    readTextFileSync(name: string): string {
        const buffer = this.readBinaryFileSync(name);

        return buffer.toString();
    }

    readDirSync(name: string): Array<string> {
        name = this._resolvePath(name);

        const content = this._lookup(name);

        if (typeof content === 'undefined') {
            throw new Error(util.format('%s not part of file bundle', name));
        }

        if (typeof content === 'string' || Buffer.isBuffer(content)) {
            throw new Error(util.format('%s is a file, not a directory', name));
        }

        return Object.keys(content);
    }

    getTypeSync(name: string): FilesystemProviderInterface.FileType {
        name = this._resolvePath(name);

        const content = this._lookup(name);

        if (typeof content === 'undefined') {
            throw new Error(util.format('%s not part of file bundle', name));
        }

        if (Buffer.isBuffer(content)) {
            return FilesystemProviderInterface.FileType.FILE;
        } else {
            return FilesystemProviderInterface.FileType.DIRECTORY;
        }
    }

    private _lookup(path: string): any {
        const atoms: Array<string> = path.split('/'),
            natoms = atoms.length;

        let i: number,
            scope = this._blob;

        const name = atoms[natoms - 1];

        for (i = 0; i < natoms - 1; i++) {
            if (atoms[i] === '') {
                continue;
            } else if (scope.hasOwnProperty(atoms[i])) {
                scope = scope[atoms[i]];
            } else {
                return undefined;
            }
        }

        if (name && typeof scope[name] === 'string') {
            scope[name] = new Buffer(scope[name], 'base64');
        }

        return name ? scope[name] : scope;
    }
}

namespace PrepackagedFilesystemProvider {
    export interface BlobInterface {
        [index: string]: any;
    }
}

export { PrepackagedFilesystemProvider as default };
