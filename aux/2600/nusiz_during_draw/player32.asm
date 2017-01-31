    PROCESSOR 6502

OVERSCAN_LINES = 36
BURN_LINES = 90
COLOR_P0 = $FE
HRULE_COLOR = $06
VRULE_COLOR = $64
PLAYER_BITMAP_1 = %10101010
PLAYER_BITMAP_2 = %01010101

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS_MAIN
    ORG $80
PlayerBitmap    DS.B 1
TargetNusiz     DS.B 1

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
    BNE .setupNusiz16

.setupNusiz8
    LDA #0
    STA TargetNusiz
    JMP .afterSetupNusiz

.setupNusiz16
    LDA #$05
    STA TargetNusiz

.afterSetupNusiz
    STA WSYNC
    JSR Noop
    JSR Noop
    JSR Noop
    STA RESBL

    STA WSYNC
    JSR Noop
    JSR Noop
    JSR Noop
    STA RESM1
    LDA #$40
    STA HMBL
    LDA #$F0
    STA HMM1

    STA WSYNC
    STA HMOVE
    LDA #$02
    STA ENABL
    STA ENAM1
    LDA #$80
    STA HMBL
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
    JSR Noop
    JSR Noop
    JSR Noop
    STA RESP0
    LDA PlayerBitmap
    STA GRP0
    LDA #$90
    STA HMP0
    LDX TargetNusiz
    LDY #$07
    LDA #HRULE_COLOR
    STA WSYNC

    REPEAT 42

    STY NUSIZ0
    LDA #HRULE_COLOR
    STA COLUBK
    JSR Noop
    JSR Noop
    SLEEP 4
    STX NUSIZ0      ; 36
    STA WSYNC

    STY NUSIZ0
    LDA #0
    STA COLUBK
    JSR Noop
    JSR Noop
    SLEEP 4
    STX NUSIZ0      ; 36
    STA WSYNC

    STY NUSIZ0
    JSR Noop
    JSR Noop
    SLEEP 9
    STX NUSIZ0      ; 36
    STA WSYNC

    STY NUSIZ0
    JSR Noop
    JSR Noop
    SLEEP 9
    STX NUSIZ0      ; 36
    JSR Noop        ; 39
    JSR Noop        ; 51
    SLEEP 8         ; 63
    STA HMOVE       ; 71
    NOP             ; 74

    REPEND

    LDA #0
    STA GRP0

    LDX #BURN_LINES
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