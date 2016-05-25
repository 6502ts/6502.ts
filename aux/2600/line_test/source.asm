; thin red line by Kirk Israel

	processor 6502
	include ../vcs.h
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
	LDA #$00
	STA COLUBK
	LDA #33
	STA COLUP0
	LDA #$F0
	STA HMM0
	LDA #$74
	STA COLUP1
	LDA #$10
	STA HMM1
	LDA #2
	STA ENAM0
	STA ENAM1

	STA WSYNC
	STA RESM0
	STA RESM1

MainLoop
	; line 1
	LDA #2
	STA VSYNC
	STA WSYNC

	; line 2
	STA WSYNC

	; line 3
	STA WSYNC
	LDA  #43
	STA  TIM64T
	LDA #0
	STA  VSYNC

WaitForVblankEnd
	LDA INTIM
	BNE WaitForVblankEnd

	; Somewhere in line 39
	STA WSYNC

	; Line 40
	STA HMOVE
	LDY #191
	LDX #0
	STA WSYNC

	; Line 41
	STA VBLANK
ScanLoop
	STA WSYNC
	inx
	txa
	and #$30
	sta NUSIZ0
	eor #$30
	sta NUSIZ1
	DEY
	BNE ScanLoop

	; line 232
	LDA #2
	STA WSYNC

	; line 233
	STA VBLANK
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
