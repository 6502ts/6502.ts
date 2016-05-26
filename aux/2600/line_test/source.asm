; thin red line by Kirk Israel

	processor 6502
	include ../vcs.h

	SEG.U VARS
	ORG $80
NusizCopies 		ds 1
FrameCounter 		ds 1
WidthStart			ds 1
Color0 				ds 1
Color0Pre			ds 1
Color1				ds 1
Color1Pre			ds 1
ColorBk 			ds 1

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
	LDA #33
	STA Color0
	LDA #$F0
	STA HMM0
	LDA #$74
	STA Color1
	LDA #$10
	STA HMM1
	LDA #2
	STA ENAM0
	STA ENAM1

	STA WSYNC
	STA RESM0
	STA RESM1

	LDX #0

MainLoop
	; line 1
	LDA #2
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

	LDA FrameCounter
	CMP #160
	BNE IncrementFrameCounter

	LDA #0
	STA FrameCounter
	LDA NusizCopies
	CLC
	ADC #1
	AND #$07
	STA NUSIZ0
	STA NUSIZ1
	STA NusizCopies
	JMP WaitForVblankEnd

IncrementFrameCounter
	CLC
    ADC #1
	STA FrameCounter

	LDA WidthStart
	CLC
	ADC #$02
	STA WidthStart
	TAX

	LDA Color0Pre
	CLC
	ADC #80
	STA Color0Pre
	LDA Color0
	STA COLUP0
	ADC #0
	STA Color0

	LDA Color1Pre
	CLC
	ADC #80
	STA Color1Pre
	LDA Color1
	STA COLUP1
	ADC #0
	STA Color1

	LDA #$00
	STA ColorBk
	STA COLUBK

WaitForVblankEnd
	LDA INTIM
	BNE WaitForVblankEnd

	; Somewhere in line 39
	STA WSYNC

	; Line 40
	STA HMOVE
	LDY #191
	STA WSYNC

	; Line 41
	STA VBLANK
ScanLoop
	STA WSYNC
	INX
	TXA
	AND #$30
	ORA NusizCopies
	STA NUSIZ0
	EOR #$30
	STA NUSIZ1

	LDA ColorBk
	STA COLUBK
	CLC
	ADC #1
	STA ColorBk

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
