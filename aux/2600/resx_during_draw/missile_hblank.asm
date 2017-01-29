BURN_LINES_PAL = 100
SEPARATION = 10

    INCLUDE main.inc

    SEG.U VARS_TEST
    ORG $80

Counter DS.B 1

    SEG CODE_TEST
    ORG $F200

Test1 SUBROUTINE

    CLC
    LDA #12
    STA Counter
    LDA #$A0
    LDX #0
    LDY #02

.loop

    STA HMM0
    STA HMM1

    STX WSYNC
    STX ENAM0
    STX ENAM0
    STX ENAM1
    REPEAT 5
        JSR Noop
    REPEND
    NOP
    STX RESM0
    NOP

    STX ENAM0
    STX ENAM0
    STX ENAM1
    REPEAT 5
        JSR Noop
    REPEND
    NOP
    STX RESM1
    NOP

    STY HMOVE
    REPEAT 5
        JSR Noop
    REPEND
    NOP
    NOP
    STY ENAM0
    STY ENAM1
    STY RESM0

    SLEEP 30
    STX ENAM0
    STX ENAM1
    EOR #$80
    ADC #$10
    EOR #$80

    DEC Counter
    BNE .loop

    LDX #SEPARATION
.skipline
    STX WSYNC
    DEX
    BNE .skipline

    RTS

Test2 SUBROUTINE

    CLC
    LDA #12
    STA Counter
    LDA #$A0
    LDX #0
    LDY #02

.loop

    STA HMM0
    STA HMM1

    STX WSYNC
    STX ENAM0
    STX ENAM0
    STX ENAM1
    REPEAT 5
        JSR Noop
    REPEND
    NOP
    STX RESM0
    NOP

    STX ENAM0
    STX ENAM0
    STX ENAM1
    REPEAT 5
        JSR Noop
    REPEND
    NOP
    STX RESM1
    NOP

    STY HMOVE
    REPEAT 5
        JSR Noop
    REPEND
    NOP
    NOP
    STY ENAM0
    STY ENAM0
    STY RESM0

    SLEEP 30
    STX ENAM0
    STX ENAM1
    EOR #$80
    ADC #$10
    EOR #$80

    DEC Counter
    BNE .loop

    LDX #SEPARATION
.skipline
    STX WSYNC
    DEX
    BNE .skipline

    RTS

    ORG $FFFC
    .WORD Start
    .WORD Start