	processor 6502
	include vcs.h
	include macro.h

    seg.u vars
    org $80
hours   DS.B 1
minutes DS.B 1
seconds DS.B 1
frames  DS.B 1
    seg code_main
    org $F000

Start
	SEI
	CLD

;;; Clear Page0
	LDX #$FF
	TXS
	LDA #0
ClearMem
	STA 0,X
	DEX
	BNE ClearMem
InitComplete

;;; Setup time
    LDA #23
    STA hours
    LDA #58
    STA minutes
    LDA #50
    STA seconds

;;; Setup Players
	LDA #$00
	STA COLUBK
	LDA #$57
	STA COLUP0

    LDA #$67
    STA NUSIZ0

    STA WSYNC

    Sleep 20

    NOP
    NOP

    Sleep 12

    STA RESP0
MainLoop

    LDA #$02
    STA VSYNC

    STA WSYNC
    STA WSYNC
    STA WSYNC

    LDA #0
    STA VSYNC

    LDX #45 ;; 48 - 3
    LDA #$02
    STA VBLANK
VBankLoop
    STA WSYNC
    DEX
    BNE VBankLoop

    LDA #$00
    STA VBLANK

    LDA #$67
    STA COLUP0
    LDA #$FF
    STA GRP0
    STA WSYNC
    STA WSYNC
    STA WSYNC

    LDA #$57
    STA COLUP0
    LDA hours
    STA GRP0

    LDX #75 ;; (228 - 3 ) / 3
DisplayHour
    STA WSYNC
    DEX
    BNE DisplayHour

    LDA #$47
    STA COLUP0
    LDA minutes
    STA GRP0

    LDX #75 ;; (228 - 3 ) / 3
DisplayMinute
    STA WSYNC
    DEX
    BNE DisplayMinute

    LDA #$87
    STA COLUP0
    LDA seconds
    STA GRP0

    LDX #75 ;; (228 - 3 ) / 3
DisplaySecond
    STA WSYNC
    DEX
    BNE DisplaySecond

    LDA #$02
    STA VBLANK

    ;; overscan 36
    LDA #43 ;; 42 * 64 cycles = 35.something lines
    STA TIM64T

AdvanceClock

    LDA frames
    CLC
    ADC #1
    STA frames
    CMP #50 ; PAL has 50 frames / sec
    BNE Exit
    LDA #0
    STA frames
    LDA seconds
    CLC
    ADC #1
    CMP #60
    STA seconds
    BNE Exit
    LDA #0
    STA seconds
    LDA minutes
    CLC
    ADC #1
    STA minutes
    CMP #60
    BNE Exit
    LDA #0
    STA minutes
    LDA hours
    CLC
    ADC #1
    STA hours
    CMP #24
    BNE Exit
    LDA #0
    STA hours

ClockIncrementDone

Exit
    LDA INTIM
    BNE Exit

    ;; somewhere in line 35 and a few cycles left
    STA WSYNC

    JMP MainLoop

    org $FFFC
	.word Start
	.word Start
