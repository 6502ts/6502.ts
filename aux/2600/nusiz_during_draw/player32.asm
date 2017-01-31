    PROCESSOR 6502

OVERSCAN_LINES = 36
BURN_LINES = 90
COLOR_P1 = $FE
HRULE_COLOR = $06
PLAYER_BITMAP_1 = %10101010
PLAYER_BITMAP_2 = %01010101

    INCLUDE vcs.h
    INCLUDE macro.h

    SEG.U VARS_MAIN
    ORG $80
PlayerBitmap DS.B 1

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

    LDA #COLOR_P1
    STA COLUP0

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
.burnVblank
    LDA INTIM
    BNE .burnVblank

    LDA #0
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
    LDX #0
    LDY #$07
    STX NUSIZ0
    LDA #HRULE_COLOR
    STA WSYNC

    REPEAT 42

    STY NUSIZ0
    STA COLUBK
    JSR Noop
    JSR Noop
    SLEEP 6
    STX NUSIZ0      ; 36
    STA WSYNC

    STY NUSIZ0
    STX COLUBK
    JSR Noop
    JSR Noop
    SLEEP 6
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

    STX GRP0

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