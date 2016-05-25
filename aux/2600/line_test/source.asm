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
	LDA #2
	STA VSYNC
	STA WSYNC
	STA WSYNC
	STA WSYNC
	LDA  #43
	STA  TIM64T
	LDA #0
	STA  VSYNC

WaitForVblankEnd
	LDA INTIM
	BNE WaitForVblankEnd
	LDY #191

	STA WSYNC
	STA HMOVE
	STA VBLANK
ScanLoop
	STA WSYNC
	DEY
	BNE ScanLoop

	LDA #2
	STA WSYNC
	STA VBLANK
	LDX #30
OverScanWait
	STA WSYNC
	DEX
	BNE OverScanWait
	JMP  MainLoop

	org $FFFC
	.word Start
	.word Start
