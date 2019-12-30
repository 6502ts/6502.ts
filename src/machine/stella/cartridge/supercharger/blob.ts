/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import { decode } from '../../../../tools/base64';

export const bios = decode(
    'pfqFgEwY+HjYqQCi/5qqqJUA6ND7TBj4ogCtBvCN+P+gAKIolATKEPuiHJSByhD7qQCFG4UchR2FHoUfhRmFGoUIhQGpEIUhhQKiB8rK0P2pAIUghRCFEYUChSqpBYUKqf+FDYUOhQ+FhIWFqfCFg6l0hQmpDIUVqR+FF4WCqQeFGaIIoACFAojQ+4UChQKpAoUChQCFAoUChQKpAIUAyhDkBoNmhCaFpYOFDaWEhQ6lhYUPpoLKhoKGF+AK0MOpAoUBohygAIQZhAmUgcoQ+6IArADw6rwA9+jQ9qILvRL5lfDKEPilgEzwAKIGvR35lfDKEPiu8P+GgLwA8K3x/67y/4b0rvP/hvWi/6AAmkzwAI35/637/9D7TOv4jfj/TAAA'
);
