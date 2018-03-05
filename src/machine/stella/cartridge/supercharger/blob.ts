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

import { decode } from '../../../../tools/base64';

export const bios = decode(
    'pfqFgEwY+HjYqQCi/5qqqJUA6ND7TBj4ogCtBvCN+P+gAKIolATKEPuiHJSByhD7qQCFG4UchR2FHoUfhRmFGoUIhQGpEIUhhQKiB8rK0P2pAIUghRCFEYUChSqpBYUKqf+FDYUOhQ+FhIWFqfCFg6l0hQmpDIUVqR+FF4WCqQeFGaIIoACFAojQ+4UChQKpAoUChQCFAoUChQKpAIUAyhDkBoNmhCaFpYOFDaWEhQ6lhYUPpoLKhoKGF+AK0MOpAoUBohygAIQZhAmUgcoQ+6IArADw6rwA9+jQ9qILvRL5lfDKEPilgEzwAKIGvR35lfDKEPiu8P+GgLwA8K3x/67y/4b0rvP/hvWi/6AAmkzwAI35/637/9D7TOv4jfj/TAAA'
);
