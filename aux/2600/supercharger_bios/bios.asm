;;   ==========================================================================
;;   This file is part of 6502.ts, an emulator for 6502 based systems built
;;   in Typescript
;;
;;   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
;;
;;   Permission is hereby granted, free of charge, to any person obtaining a copy
;;   of this software and associated documentation files (the "Software"), to deal
;;   in the Software without restriction, including without limitation the rights
;;   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
;;   copies of the Software, and to permit persons to whom the Software is
;;   furnished to do so, subject to the following conditions:
;;
;;   The above copyright notice and this permission notice shall be included in all
;;   copies or substantial portions of the Software.
;;
;;   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
;;   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
;;   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
;;   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
;;   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
;;   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
;;   SOFTWARE.
;;   ==========================================================================
;;   Interface:
;;
;;   * The BIOS code should be relocated to the beginning of the ROM bank
;;   * The entry vector ($F807) must be patched into the last four bytes of the
;;     ROM bank
;;   * A canary value of zero must be placed at $FFFB
;;   * The BIOS triggers the actual load by writing the requested multiload ID
;;     $FFF9. The write originates from page zero.
;;   * After loading, the following values must be patched into the ROM:
;;       - $FFF0: control word
;;       - $FFF1: a random value for A
;;       - $FFF2 -- $FFF3: entry point
;;   ==========================================================================
        processor 6502

VBLANK  equ  $01

        SEG code
; ===
; Entry point for multi-load reading
; ===
        org $F800

; Load the target bank and jump
        LDA $FA
        JMP load

; ===
; System reset
; ===

        org $F807
start:
        SEI
        CLD

        LDA #0
        LDX #$FF
        TXS
        TAX
        TAY

clearmem:
; the regular init dance
        STA $00,X
        INX
        BNE clearmem

        JMP load

load:
; Blank the screen
        LDX #2
        STX VBLANK

; Configure banking and enable RAM writes
        LDX $F006
        STX $FFF8

; Clear TIA registers
        LDY #$00
        LDX #$28
tiaclr:
        STY $04,X
        DEX
        BPL tiaclr

; Clear memory (skip $80 though as it still contains the requested multiload ID)
        LDX #$80
        LDY #0
clear:
        STY $0,X
        INX
        BNE clear

; Copy wait-for-load snipped to RIOT RAM (11 bytes)
        LDX #11
copywaitforload:
        LDY waitforload,X
        STY $F0,X
        DEX
        BPL copywaitforload

; Jump to wait-for-load
        JMP $F0

; The load is done; copy the trampoline to RIOT RAM (6 bytes)
prepareexec:
        LDX #6
copyexec:
        LDA execute,X
        STA $F0,X
        DEX
        BPL copyexec

; The cartridge emulation will provide the load parameters at 0xfff0 -- 0xfff3
; Prepare the control byte
        LDX $FFF0
        STX $80
        LDY $F000,X
; Load random value for A
        LDA $FFF1
; The entry point comes next; patch it into the trampoline
        LDX $FFF2
        STX $F4
        LDX $FFF3
        STX $F5

; Setup the registers (we have randomized A above)
        LDX #$FF
        LDY #0
        TXS

; jump into the trampoline and continue execution
        JMP $F0

; ===
; Wait for the cartridge emulation to load the new multiload into RAM.
; This will be executed from RIOT RAM.
; ===
waitforload:
; Write the load ID to $FFF9. This will cause the cartridge emulation to
; copy in the new multiload
        STA $FFF9
wait:
; As long as the cartridge is busy, the data bus will be undriven, and the canary
; load will return $FB
        LDA $FFFB
        BNE wait
; We got 0? The cartridge is driving the bus again, so the load is finished, and
; we can continue
        JMP prepareexec

; ===
; Trampoline
;
; Setup the control register and jump back into the code. This will be
; executed from RIOT RAM.
; ===
execute:
; Trigger the write to the control register...
        STA $FFF8
; ... and jump. The address will be patched in.
        JMP $0000
