    PROCESSOR 6502

OVERSCAN_LINES = 36
COLOR_P0_PAL = $BE
COLOR_P0_NTSC = $8E
COLOR_P1 = $04
DELAY = 2

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS_MAIN
    ORG $A0

BurnLines   DS.B 1
TestTarget  DS.W 1

    SEG CODE_MAIN
    ORG $F000

    MAC IndirectJSR
.base
    LDA #(.base + 8) >> 8
    PHA
    LDA #(.base + 8) & $FF
    PHA
    JMP ({1})
    ENDM

Delay SUBROUTINE

    PHA
    TXA

    LDX #DELAY
.wait
    DEX
    BNE .wait

    TAX
    PLA

Noop
    RTS

Start SUBROUTINE
    SEI
    CLD
    LDX #$FF
    TXS
    LDA #0
.clearMem
    STA 0,X
    DEX
    BNE .clearMem

    LDA #COLOR_P1
    STA COLUP1

.mainLoop

.vsync
    LDA #2
    STA VSYNC
    STA VBLANK
    STA WSYNC
    STA WSYNC
    STA WSYNC

.vblank
    LDA #56
    STA TIM64T
    LDA #0
    STA VSYNC
    STA ENAM0
    STA ENAM1

    LDA #$80
    BIT SWCHB
    BNE .tvmodeNtsc
.tvmodePal
    LDA #BURN_LINES_PAL
    STA BurnLines
    LDA #COLOR_P0_PAL
    STA COLUP0
    JMP .afterTvMode

.tvmodeNtsc
    LDA #(BURN_LINES_PAL - 50)
    STA BurnLines
    LDA #COLOR_P0_NTSC
    STA COLUP0

.afterTvMode
    LDA #$08
    BIT SWCHB
    BNE .prepareTest2

.prepareTest1
    LDA #Test1 & $FF
    STA TestTarget
    LDA #Test1 >> 8
    STA TestTarget + 1
    JMP .afterPrepareTest

.prepareTest2
    LDA #Test2 & $FF
    STA TestTarget
    LDA #Test2 >> 8
    STA TestTarget + 1

.afterPrepareTest

.burnVblank
    LDA INTIM
    BNE .burnVblank

    LDA #0
    STA VBLANK

    STA WSYNC

.kernal

    LDA #$40
    BIT SWCHB
    BNE .test2

.test1

    LDA #$30
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    LDA #$20
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    JMP .afterTest

.test2

    LDA #$10
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    LDA #0
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

.afterTest
    LDX BurnLines
.burnLines
    STA WSYNC
    DEX
    BNE .burnLines

    LDA #2
    STA VBLANK
    LDX #OVERSCAN_LINES

.burnOverscan
    STA WSYNC
    DEX
    BNE .burnOverscan

    JMP  .mainLoop