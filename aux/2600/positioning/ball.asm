	processor 6502
	include ../vcs.h

	SEG.U VARS
	ORG $80

	SEG CODE
	org $F000

    MAC DRAW

.WAIT SET 2

    REPEAT 68

.CYCLES SET .WAIT

            IF .CYCLES & 1
                BIT VSYNC
.CYCLES SET .CYCLES - 3
            ENDIF

            REPEAT .CYCLES / 2
                NOP
            REPEND

        STA RESBL
        STA RESP0
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

    LDA #$2A
    STA COLUPF
    LDA #$00
    STA COLUBK

    LDA #$78
    STA COLUP0

    LDA #$80
    STA GRP0

    LDA #$02
    STA ENABL

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

    LDX #30
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
