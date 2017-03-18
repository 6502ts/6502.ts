    PROCESSOR 6502

OVERSCAN_LINES = 36
BURN_LINES_PAL = 226

COLOR_M0 = $0E
COLOR_PF = $02
COLOR_HRULE = $02

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS_MAIN
    ORG $80
BurnLines       DS.B 1
HruleMask       DS.B 1

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

	LDA #%10100000
	STA PF0
	LDA #%01010101
	STA PF1
	LDA #%10101010
	STA PF2
    LDA #COLOR_PF
    STA COLUPF

    LDA #$07
    STA HruleMask


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

    LDA #$80
    BIT SWCHB
    BNE .setupTvModeNTSC

.setupTvModePAL
    LDA #BURN_LINES_PAL
    STA BurnLines
    JMP .afterSetupTvMode

.setupTvModeNTSC
    SEC
    LDA #BURN_LINES_PAL
    SBC #48
    STA BurnLines

.afterSetupTvMode
    LDA #$02
    STA ENAM0
    LDA #COLOR_M0
    STA COLUP0
    STA COLUP1

    STA WSYNC;
    STA RESM1

    STA WSYNC
    STA RESM0

    LDA #$70
    STA HMM0

    STA WSYNC
    STA HMOVE
    LDA #$90
    STA HMM0

.burnVblank
    LDA INTIM
    BNE .burnVblank

    LDA #0
    STA VBLANK

    STA WSYNC

.kernel

    LDX BurnLines
.burnLines
    TXA
    LDY #0
    STA WSYNC
    BIT HruleMask
    BNE .norule
    LDY #COLOR_HRULE
.norule
    STY COLUBK
    DEX
    BNE .burnLines

    LDA #$02
    STA VBLANK
    LDX #OVERSCAN_LINES
.overscan
    STA WSYNC
    DEX
    BNE .overscan

    JMP .vsync

    ORG $FFFC
    .WORD Start
    .WORD Start