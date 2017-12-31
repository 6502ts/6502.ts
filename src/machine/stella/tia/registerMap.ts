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

export enum registerMapWrite {
    vsync = 0x00,
    vblank = 0x01,
    wsync = 0x02,
    rsync = 0x03,
    nusiz0 = 0x04,
    nusiz1 = 0x05,
    colup0 = 0x06,
    colup1 = 0x07,
    colupf = 0x08,
    colubk = 0x09,
    ctrlpf = 0x0a,
    refp0 = 0x0b,
    refp1 = 0x0c,
    pf0 = 0x0d,
    pf1 = 0x0e,
    pf2 = 0x0f,
    resp0 = 0x10,
    resp1 = 0x11,
    resm0 = 0x12,
    resm1 = 0x13,
    resbl = 0x14,
    audc0 = 0x15,
    audc1 = 0x16,
    audf0 = 0x17,
    audf1 = 0x18,
    audv0 = 0x19,
    audv1 = 0x1a,
    grp0 = 0x1b,
    grp1 = 0x1c,
    enam0 = 0x1d,
    enam1 = 0x1e,
    enabl = 0x1f,
    hmp0 = 0x20,
    hmp1 = 0x21,
    hmm0 = 0x22,
    hmm1 = 0x23,
    hmbl = 0x24,
    vdelp0 = 0x25,
    vdelp1 = 0x26,
    vdelbl = 0x27,
    resmp0 = 0x28,
    resmp1 = 0x29,
    hmove = 0x2a,
    hmclr = 0x2b,
    cxclr = 0x2c
}
