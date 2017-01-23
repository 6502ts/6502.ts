    PROCESSOR 6502

OVERSCAN_LINES = 36
COLOR_P0 = $0C
COLOR_BL = $48
THICKNESS = 2
DELAY = 2

	INCLUDE vcs.h
	INCLUDE macro.h

	SEG.U VARS
	ORG $E0
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

Test SUBROUTINE

    STA WSYNC
    STY ENAM0
    STY ENABL
    JSR Delay
    STA RESBL

    STA WSYNC
    STY ENAM0
    STY ENABL
    JSR Delay
    STA RESM0

    REPEAT THICKNESS
    STA WSYNC
    STX ENAM0
    STX ENABL
    REPEND

    REPEAT 12

    STA WSYNC
    STA HMOVE
    STY ENAM0
    STY ENABL

    REPEAT THICKNESS - 1
    STA WSYNC
    REPEND

    REPEAT THICKNESS
    STA WSYNC
    STX ENAM0
    STX ENABL
    JSR Delay
    STY ENABL
    REPEND

    REPEND

    STA WSYNC
    STY ENAM0
    STY ENABL

    RTS

TestInverse SUBROUTINE

    STA WSYNC
    STY ENAM0
    STY ENABL
    JSR Delay
    STA RESBL

    STA WSYNC
    STY ENAM0
    STY ENABL
    JSR Delay
    STA RESM0

    REPEAT THICKNESS
    STA WSYNC
    STX ENAM0
    STX ENABL
    REPEND

    REPEAT 12

    STA WSYNC
    STA HMOVE
    STY ENAM0
    STY ENABL

    REPEAT THICKNESS - 1
    STA WSYNC
    REPEND

    REPEAT THICKNESS
    STA WSYNC
    STY ENABL
    STX ENAM0
    JSR Delay
    STX ENABL
    REPEND

    REPEND

    STA WSYNC
    STY ENAM0
    STY ENABL

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

    LDA #0
    STA PF0
    STA PF1
    STA PF2

    LDA #COLOR_P0
    STA COLUP0

    LDA #COLOR_BL
    STA COLUPF

    LDA #$10
    STA HMM0
    STA HMBL

    LDA #$04
    STA CTRLPF

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

    LDA SWCHB
    AND #$08
    BNE PrepareTestInverse

PrepareTest
    LDA #Test & $FF
    STA TestTarget
    LDA #Test >> 8
    STA TestTarget + 1
    JMP AfterPrepareTest

PrepareTestInverse
    LDA #TestInverse & $FF
    STA TestTarget
    LDA #TestInverse >> 8
    STA TestTarget + 1

AfterPrepareTest
    STA ENAM0
    STA ENABL

    LDX #$02
    LDY #0

BurnVblank
	LDA INTIM
	BNE BurnVblank

    LDA #0
    STA VBLANK

	STA WSYNC

Kernal

    LDA #$30
    STA NUSIZ0
    LDA #$34
    STA CTRLPF

    IndirectJSR TestTarget

    LDA #$20
    STA NUSIZ0
    LDA #$24
    STA CTRLPF

    IndirectJSR TestTarget

    LDA #$10
    STA NUSIZ0
    LDA $14
    STA CTRLPF

    IndirectJSR TestTarget

    LDA #0
    STA NUSIZ0
    LDA #$04
    STA CTRLPF

    IndirectJSR TestTarget

    LDX #14
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