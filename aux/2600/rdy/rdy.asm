    PROCESSOR 6502

TIMER_PAL = 56
OVERSCAN_LINES_PAL = 36
BURN_LINES_PAL = 123

TIMER_NTSC = 47
OVERSCAN_LINES_NTSC = 30

COLOR = $0E

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS_MAIN
    ORG $80
burnLines       DS.B 1
overscanLines   DS.B 1
timer           DS.B 1

    MAC BAR_SIMPLE
    LDA #COLOR      ; 2
    STA COLUBK      ; 5
    SLEEP 30        ; 35
    LDA #0          ; 37
    STA COLUBK      ; 40 -> pixel 52
    STA WSYNC
    ENDM

    MAC BAR_RMW
    LDA #COLOR      ; 2
    STA COLUBK      ; 5
    SLEEP 30        ; 35
    LDA #0          ; 37
    STA COLUBK      ; 40 -> pixel 52
    INC WSYNC
    ENDM

    SEG CODE_MAIN
    ORG $F000

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

.vsync
    LDA #2
    STA VSYNC
    STA VBLANK
    STA WSYNC

    LDA #$08
    BIT SWCHB
    BNE .setupTvModeNTSC

.setupTvModePAL
    LDA #TIMER_PAL
    STA timer
    LDA #OVERSCAN_LINES_PAL
    STA overscanLines
    LDA #BURN_LINES_PAL
    STA burnLines
    JMP .afterSetupTvMode

.setupTvModeNTSC
    LDA #TIMER_NTSC
    STA timer
    LDA #OVERSCAN_LINES_NTSC
    STA overscanLines
    LDA #BURN_LINES_PAL
    SEC
    SBC #50
    STA burnLines

.afterSetupTvMode

    STA WSYNC
    STA WSYNC

.vblank
    LDA timer
    STA TIM64T
    LDA #0
    STA VSYNC
    LDA #0
    STA COLUBK

.burnVblank
    LDA INTIM
    BNE .burnVblank

    STA VBLANK
    STA WSYNC

.kernel
    REPEAT 50
    BAR_SIMPLE
    REPEND

    REPEAT 5
    BAR_RMW
    REPEND

    REPEAT 50
    BAR_SIMPLE
    REPEND

    LDX burnLines
.burnKernel
    STA WSYNC
    DEX
    BNE .burnKernel

    LDA #2
    STA VBLANK

    LDX overscanLines
.overscan
    STA WSYNC
    DEX
    BNE .overscan

    JMP .vsync

    org $FFFC
	.word Start
	.word Start
