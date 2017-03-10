    PROCESSOR 6502

OVERSCAN_LINES = 36
BURN_LINES_PAL = 89
COLOR_P0 = $0E
HRULE_COLOR = $06
VRULE_COLOR = $64
PLAYER_BITMAP_1 = %10101010
PLAYER_BITMAP_2 = %01010101

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS_MAIN
    ORG $80
PlayerBitmap    DS.B 1
NusizTo         DS.B 1
BurnLines       DS.B 1

    SEG CODE_MAIN
    ORG $F000

Noop SUBROUTINE
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

    LDA #COLOR_P0
    STA COLUP0

    LDA #VRULE_COLOR
    STA COLUPF
    STA COLUP1

    LDA #%01010101
    STA GRP0

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
    STA GRP0

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
    SBC #50
    STA BurnLines

.afterSetupTvMode
    LDA #$08
    BIT SWCHB
    BNE .setupBitmap2

.setupBitmap1
    LDA #PLAYER_BITMAP_1
    STA PlayerBitmap
    JMP .afterSetupBitmap

.setupBitmap2
    LDA #PLAYER_BITMAP_2
    STA PlayerBitmap

.afterSetupBitmap
    LDA #$40
    BIT SWCHB
    BNE .setupNusizTo2

.setupNusizTo1
    LDA #NUSIZ_TO_1
    STA NusizTo
    JMP .afterSetupNusiz

.setupNusizTo2
    LDA #NUSIZ_TO_2
    STA NusizTo

.afterSetupNusiz
    STA WSYNC
    STA RESM1
    LDA #$F0
    STA HMM1

    STA WSYNC
    STA HMOVE
    JSR Noop
    JSR Noop
    LDA #$02
    STA ENAM1
    LDA #$80
    STA HMM1

.burnVblank
    LDA INTIM
    BNE .burnVblank

    LDA #0
    STA COLUBK
    STA VBLANK

    STA WSYNC

.kernel

    STA WSYNC
    STA RESP0
    LDA PlayerBitmap
    STA GRP0
    LDA #$90
    STA HMP0
    LDX NusizTo
    LDY #NUSIZ_FROM
    LDA #HRULE_COLOR
    STY NUSIZ0
    STA WSYNC

    REPEAT 42

    STY $FF
    STX NUSIZ0
    STA COLUBK
    JSR Noop
    JSR Noop
    SLEEP 4
    STY NUSIZ0
    LDA #0
    STA WSYNC

    STY $FF
    STX NUSIZ0
    STA COLUBK
    JSR Noop
    JSR Noop
    SLEEP 4
    STY NUSIZ0
    LDA #HRULE_COLOR
    STA WSYNC

    STY $FF
    STX NUSIZ0
    JSR Noop
    JSR Noop
    SLEEP 7
    STY NUSIZ0
    STA WSYNC

    STY $FF
    STX NUSIZ0
    JSR Noop
    JSR Noop
    SLEEP 7
    STY NUSIZ0      ; 37
    JSR Noop        ; 40
    JSR Noop        ; 52
    SLEEP 7         ; 64
    STA HMOVE       ; 71
    NOP

    REPEND

    LDA #0
    STA GRP0

    LDX BurnLines
.burnLines
    STA WSYNC
    DEX
    BNE .burnLines

    LDA #$02
    STA VBLANK
    LDX #OVERSCAN_LINES
.overscan
    DEX
    BNE .overscan

    JMP .vsync

    ORG $FFFC
    .WORD Start
    .WORD Start