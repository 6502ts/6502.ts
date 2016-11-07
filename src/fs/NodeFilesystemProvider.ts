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


import * as fs from 'fs';
import FilesystemProviderInterface from './FilesystemProviderInterface';
import AbstractFileSystemProvider from './AbstractFileSystemProvider';

class NodeFilesystemProvider extends AbstractFileSystemProvider
    implements FilesystemProviderInterface
{
    constructor() {
        super();
        this._cwd = process.cwd();
    }

    readBinaryFileSync(name: string): Buffer {
        return fs.readFileSync(this._resolvePath(name));
    }

    readTextFileSync(name: string): string {
        return this.readBinaryFileSync(name).toString('utf8');
    }

    readDirSync(name: string): Array<string> {
        return fs.readdirSync(this._resolvePath(name));
    }

    getTypeSync(name: string): FilesystemProviderInterface.FileType {
        if (fs.statSync(this._resolvePath(name)).isDirectory()) {
            return FilesystemProviderInterface.FileType.DIRECTORY;
        } else {
            return FilesystemProviderInterface.FileType.FILE;
        }
    }
}

export default NodeFilesystemProvider;
