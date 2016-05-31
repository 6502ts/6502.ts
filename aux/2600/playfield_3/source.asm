	processor 6502
	include ../vcs.h

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

	LDA #%10100000
	STA PF0
	LDA #%01010101
	STA PF1
	LDA #%10101010
	STA PF2

	LDA #$1C
	STA COLUP0
	LDA #$BA
	STA COLUP1

	LDA #$86
	STA COLUPF

	LDA #$02
	STA CTRLPF
	STA CtrlpfContents

	LDA #61
	STA FrameCounter

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

HandleFrameCounter
	LDY FrameCounter
	DEY
	BNE AfterHandleFrameCounter

	LDA CtrlpfContents
	EOR #$02
	STA CTRLPF
	STA CtrlpfContents
	LDA #61
	TAY

AfterHandleFrameCounter
	STY FrameCounter

WaitForVblankEnd
	LDA INTIM
	BNE WaitForVblankEnd

	; Somewhere in line 39
	STA WSYNC

	; Line 40
	STA WSYNC

	; Line 41
	STA VBLANK
	LDY #191
ScanLoop
	STA WSYNC
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
