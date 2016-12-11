	processor 6502
	include ../vcs.h

SwitchPeriod = 121

	SEG.U VARS
	ORG $80
CtrlpfContents 			ds 1
FrameCounter 			ds 1

	SEG CODE
	org $F000

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

MainLoop
	; line 1
	LDA #2
	STA VBLANK
	STA VSYNC
	STA WSYNC

	; line 2
	STA WSYNC

	; line 3
	STA WSYNC
	LDA  #42
	STA  TIM64T
	LDA #0
	STA  VSYNC

    LDX #96
    LDY #0
    STY COLUBK

WaitForVblankEnd
	LDA INTIM
	BNE WaitForVblankEnd

	; Somewhere in line 39
    LDA #0
    STA VBLANK
	STA WSYNC

Frame
    STA WSYNC
    LDA #$1A
    STA COLUBK
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    STA VBLANK
    STY VBLANK
    STA VBLANK
    STY VBLANK
    STA VBLANK
    STY VBLANK
    STA VBLANK
    STY VBLANK
    STA VBLANK
    STY VBLANK
    STA VBLANK
    STY VBLANK
    STA VBLANK
    STY VBLANK
    STA WSYNC

    LDA #$43
    STA COLUBK
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    NOP
    STY COLUBK
    STA COLUBK
    STY COLUBK
    STA COLUBK
    STY COLUBK
    STA COLUBK
    STY COLUBK
    STA COLUBK
    STY COLUBK
    STA COLUBK
    STY COLUBK
    STA COLUBK
    STY COLUBK
    STA COLUBK

    DEX
    BNE Frame

	; line 233
	STA VBLANK
    STA WSYNC
	LDX #30
OverScanWait
	STA WSYNC
	DEX
	BNE OverScanWait

	; line 263 = line 1
	JMP  MainLoop
	org $FFFC
	.word Start
	.word Start
