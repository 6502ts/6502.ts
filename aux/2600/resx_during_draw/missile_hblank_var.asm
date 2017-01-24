    PROCESSOR 6502

OVERSCAN_LINES = 36
COLOR_P0 = $48
COLOR_P1 = $0C
DELAY = 2
SEPARATION = 5
BURN_LINES = 78

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS
    ORG $A0
TestTarget DS.W

    SEG CODE
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
    RTS

Test1 SUBROUTINE

    CLC
    LDA #0
    LDX #0
    LDY #02

    REPEAT 8

    STA HMM0
    STA HMM1

    STX WSYNC
    STX ENAM0
    STX ENAM0
    STX ENAM1
    SLEEP 64
    STX RESM0

    STX ENAM0
    STX ENAM0
    STX ENAM1
    SLEEP 64
    STX RESM1

    STY HMOVE
    SLEEP 64
    STY ENAM0
    STY ENAM0
    SLEEP 10
    STY RESM0

    SLEEP 20
    STX ENAM0
    STX ENAM1
    ADC #$10

    REPEND

    LDX #SEPARATION
.skipline
    STX WSYNC
    DEX
    BNE .skipline

    RTS

Test2 SUBROUTINE

    CLC
    LDA #0
    LDX #0
    LDY #02

    REPEAT 8

    STA HMM0
    STA HMM1

    STX WSYNC
    STX ENAM0
    STX ENAM0
    STX ENAM1
    SLEEP 64
    STX RESM0

    STX ENAM0
    STX ENAM0
    STX ENAM1
    SLEEP 64
    STX RESM1

    STY HMOVE
    SLEEP 64
    STY ENAM0
    STY ENAM0
    STY RESM0

    SLEEP 30
    STX ENAM0
    STX ENAM1
    ADC #$10

    REPEND

    LDX #SEPARATION
.skipline
    STX WSYNC
    DEX
    BNE .skipline

    RTS

Start SUBROUTINE
    SEI
    CLD
    LDX #$FF
    TXS
    LDA #0
ClearMem
    STA 0,X
    DEX
    BNE ClearMem

    LDA #COLOR_P0
    STA COLUP0

    LDA #COLOR_P1
    STA COLUP1

MainLoop

Vsync
    ; line 1
    LDA #2
    STA VSYNC
    STA VBLANK
    STA WSYNC

    ; line 2
    STA WSYNC

    ; line 3
    STA WSYNC

Vblank
    LDA #56
    STA TIM64T
    LDA #0
    STA VSYNC
    STA ENAM0
    STA ENAM1

    LDA SWCHB
    AND #$08
    BNE PrepareTest2

PrepareTest1
    LDA #Test1 & $FF
    STA TestTarget
    LDA #Test1 >> 8
    STA TestTarget + 1
    JMP AfterPrepareTest

PrepareTest2
    LDA #Test2 & $FF
    STA TestTarget
    LDA #Test2 >> 8
    STA TestTarget + 1

AfterPrepareTest

BurnVblank
    LDA INTIM
    BNE BurnVblank

    LDA #0
    STA VBLANK

    STA WSYNC

Kernal

    LDA #$30
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    LDA #$20
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    LDA #$10
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    LDA #0
    STA NUSIZ0
    STA NUSIZ1

    IndirectJSR TestTarget

    LDX #BURN_LINES
BurnLines
    STA WSYNC
    DEX
    BNE BurnLines

    LDA #2
    STA VBLANK
    LDX #OVERSCAN_LINES

BurnOverscan
    STA WSYNC
    DEX
    BNE BurnOverscan

    JMP  MainLoop

    ORG $FFFC
    .WORD Start
    .WORD Start