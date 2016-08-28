	processor 6502
	include ../vcs.h

	SEG.U VARS
	ORG $80

	SEG CODE
	org $F000

    MAC DRAW

    LDX #$00
    LDY #$05

.WAIT SET 2

    REPEAT 66

.CYCLES SET .WAIT

            IF .CYCLES & 1
                BIT VSYNC
.CYCLES SET .CYCLES - 3
            ENDIF

            REPEAT .CYCLES / 2
                NOP
            REPEND

        STY NUSIZ0
        STA RESP0
        STX NUSIZ0

        STA WSYNC
        STA WSYNC
        STA WSYNC

.WAIT SET .WAIT + 1

    REPEND

    ENDM

Start
	SEI
	CLD
	LDX #$FF
	TXS
	LDA #0
ClearMem
	STA 0,X
	DEX
	BNE ClearMem

	LDA #%10100000
	STA PF0
	LDA #%01010101
	STA PF1
	LDA #%10101010
	STA PF2

    LDA #$04
    STA COLUPF
    LDA #$00
    STA COLUBK

    LDA #$00
    STA NUSIZ0

    LDA #$2A
    STA COLUP0

    LDA #$80
    STA GRP0

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
	LDA  #53
	STA  TIM64T
	LDA #0
	STA  VSYNC

BurnVblank
	LDA INTIM
	BNE BurnVblank

    LDA #0
    STA VBLANK

    LDA #2
	STA WSYNC

Kernal

    DRAW

    LDX #34
BurnKernal
    STA WSYNC
    DEX
    BNE BurnKernal

Overscan
	STA VBLANK

	LDX #1
BurnOverscan
	STA WSYNC
	DEX
	BNE BurnOverscan

	JMP  MainLoop

	org $FFFC
	.word Start
	.word Start
