;Mrch 10
;--bug fix --- it was totally screwed when used on a real atari

;;changed two lda BALL_FUDGE_SPEED to lda #BALL_FUDGE_SPEED
; switch to CLEAN_START macro for stack clearing
;removed extraneous clc before cmps;;temporarilyish cleared up problem.....
;fixed capitalization of instructions
;(back to no illegal opcodes)
;fixed blatant score graphic pointer problem

;
;cleaned up reset behavior (twice)
;

; check/fix wall bounce bug
; make computer show its wingdown graphic for longer


; bug w/ stellax, jsut doesn't work
; bug w/ Z26: game select during game makes sound and shown frame rate go nuts, though plays ok

;decided not to tweak the UI



;----------------------




; JoustPong by Kirk Israel
	
	processor 6502
	include vcs.h
	include macro.h



  mac CHECKPAGE
    IF >. != >{1}
      ECHO ""
      ECHO "ERROR: different pages! (", {1}, ",", ., ")"
      ECHO ""
      err

    ENDIF
  ENDM


NO_ILLEGAL_OPCODES = 1

;--------------------------------------
;CONSTANTS
;--------------------------------------

P0COLOR = #$7C; #$18;paul suggests #$18
P1COLOR = #$4D;paul suggests #$C8
SCOREBKCOLOR = #$06
GAMEPFCOLOR = #$9F
PFMODE = #1 ; 3 = "score" mode, 1 = regular (ball/PF same color)

PTERRYCOLOR = #$28

CEILING_HEIGHT = #88 ;???

CEILING_HALF = #44

;-16
;SLOW_GRAV_LO_BYTE = #%11110000
;SLOW_GRAV_HI_BYTE = #%11111111


;-11
SLOW_GRAV_LO_BYTE = #%11110101
SLOW_GRAV_HI_BYTE = #%11111111



SLOW_REBOUND_LO_BYTE = #%00000000
SLOW_REBOUND_HI_BYTE = #%11111111



PTERRY_HIT_PUSH_LO_BYTE = #%00000000
PTERRY_HIT_PUSH_HI_BYTE = #%11111111





SLOW_FLAP_LO_BYTE = #%11001000
SLOW_FLAP_HI_BYTE = #%00000000


CPU_FLAP_LO_BYTE = #%11001000
CPU_FLAP_HI_BYTE = #%00000000


;SLOW BALL SPEED *WAS* 192


;170
SLOW_BALL_RIGHT_SPEED_LO_BYTE = #%10101010
SLOW_BALL_RIGHT_SPEED_HI_BYTE = #%00000000

SLOW_BALL_LEFT_SPEED_LO_BYTE = #%01010110
SLOW_BALL_LEFT_SPEED_HI_BYTE = #%11111111

;210
FAST_BALL_RIGHT_SPEED_LO_BYTE = #%11111010
FAST_BALL_RIGHT_SPEED_HI_BYTE = #%00000000

FAST_BALL_LEFT_SPEED_LO_BYTE = #%00000110
FAST_BALL_LEFT_SPEED_HI_BYTE = #%11111111


MAX_BALL_SPEED_BOOST = #250


MIN_COMPUTER_REST_TIME_EASY = #15 ; was #15
MIN_COMPUTER_REST_TIME_HARD = #0



GAMEFIELD_HEIGHT_IN_BRICKS = #22

SPRITEHEIGHT = #8
;floor heights are different, because heights are actually
;relative to the 'top' of the player or ball, but we want to
;make sure that the bottoms are hitting the floor
FLOOR_HEIGHT_FOR_BALL = #1
FLOOR_HEIGHT_FOR_PLAYERS = #10

STRENGTH_OF_CEILING_REBOUND = #3;


SCORE_KERNAL_LENGTH = #5
GAME_KERNAL_LENGTH = #88

LENGTH_OF_FLAPSOUND = #15
PITCH_OF_FLAPSOUND = #15
;2!,8-,15 all kind of worked
TYPE_OF_FLAPSOUND = #2






VOLUME_OF_PONGHIT = #7
PITCH_OF_PONGHIT = #7
PITCH_OF_GOAL = #15
PITCH_OF_PONG_WALL_HIT = #25


;was 6 pixel height, 6 scanlines per

; 74 - 36 = 38

PIXEL_HEIGHT_OF_TITLE = #35
PIXEL_HEIGHT_OF_TITLE_PONG = #7

SCANLINES_PER_TITLE_PIXEL = #2
WINNING_SCORE = #10
WINNING_SCORE_POORLORDS = #3



BALLPOS_LEFT = #5  ;had to hack so it didn't show up on right side before reset...
BALLPOS_CENTER = #80 
BALLPOS_RIGHT = #160


PTERRY_LEFT_BOUNDARY = #10
PTERRY_RIGHT_BOUNDARY = #138



MUSICRIFF_NOTECOUNT = #16
MUSICBEAT_NOTECOUNT = #12

PTERRYVOICE_NOTECOUNT = #10


PTERRY_LENGTH_OF_WINGCHANGE = #10


PTERRY_LENGTH_TIL_BOREDOM = #40


;511 (largest value under $0200)
BALL_MAX_POS_SPEED_LO = #%11111111
BALL_MAX_POS_SPEED_HI = #%00000001

;-511
BALL_MAX_NEG_SPEED_LO = #%00000001
BALL_MAX_NEG_SPEED_HI = #%11111110



WINGSHOWNDOWNTIME = #15

BALL_MIN_NEG_SPEED_LO = $E0
BALL_MIN_NEG_SPEED_HI = $FF
BALL_MIN_POS_SPEED_LO = #32
BALL_MIN_POS_SPEED_HI = #0


BALL_FUDGE_SPEED = #%00100000





VOICE_FOR_MUSIC = #10
	;12 orig
	;#3 is good enginey
	;6 is good low tone, 10
	;9 ok, fartyish
VOICE_FOR_BEAT = #8


BALL_FREEZE_TIME = #96


;--------------------------------------
;VARIABLES
;--------------------------------------

	SEG.U VARS 
	org $80


slowP0YCoordFromBottom ds 2
slowP0YSpeed ds 2

slowP1YCoordFromBottom ds 2
slowP1YSpeed ds 2



p0VisibleLine ds 1
p0DrawBuffer ds 1
p1VisibleLine ds 1
p1DrawBuffer ds 1



but0WasOn ds 1
but1WasOn ds 1


slowBallYSpeed ds 2
slowBallYCoordFromBot ds 2
ballVisibleLine ds 1

ballBuffer ds 1

p0score ds 1
p1score ds 1

pointerP0Score ds 2
pointerP1Score ds 2

pointerP0Graphic ds 2
pointerP1Graphic ds 2




varHowMuchTimeComputerNeedsToRest ds 1


booleanBallRight ds 1
flapsoundRemaining ds 1
booleanGameIsTwoPlayers ds 1
variableGameMode ds 1
booleanSelectSwitchIsDown ds 1
booleanResetWasNOTDownLastFrame ds 1
booleanGameOver ds 1
;--booleanOverrideSelectChangeThisTime  ds 1



bufferPFLeft ds 1;;WALL;;
bufferPFRight ds 1;;WALL;;


playfieldMatrixLeft ds 22;;WALL;;
playfieldMatrixRight ds 22;;WALL;;




;musicRiffNotePointer ds 2
musicRiffNoteCounter ds 1
musicRiffNoteTimeLeft ds 1

;musicBeatNotePointer ds 2
musicBeatNoteCounter ds 1
musicBeatNoteTimeLeft ds 1

winningScore ds 1




PS_temp ds 1



ballXposition ds 2



booleanPterryGoesRight ds 1

booleanPterryWingIsUp ds 1
counterPterryWingChange ds 1

pointerPterryGraphic ds 2

pterryHorizPosition ds 1



varPterryVerticalPos ds 1
varPterryBoredCounter ds 1
varPterryBehavior ds 1


varPterryWasHitWithBall ds 1

tempVar ds 2
anotherTempVar ds 1


saveStack ds 2

booleanIsOnTitleScreen ds 1


varTimeComputerResting ds 1
;MIN_COMPUTER_REST_TIME


varScoreColorP0 ds 1
varScoreColorP1 ds 1
varScoreColorFlasherP0 ds 1
varScoreColorFlasherP1 ds 1


pterryVoiceNoteCounter ds 1
pterryVoiceNoteTimeLeft ds 1
flagPterryMakeNoise ds 1

varTimeBeforeBallMoves ds 1


varPseudoRandomCounter ds 1



varComputerWingShownDownTimer ds 1





msgVar ds 1

Zero ds 1   ; must contain zero (for kernel)

 echo "----",($100 - *) , "bytes of RAM left"



	seg CODE
	org $F000
;MAXIMUM_SPEED = #6

;--------------------------------------
;BOILER PLATE STARTUP
;--------------------------------------
Start
	CLEAN_START

;--------------------------------------
;OTHER INITIALIZATIONS
;--------------------------------------
	lda #0		
	sta COLUBK	
	sta GRP0
	sta GRP1
	sta PF0
	sta PF1
	sta PF2

	;lda #1 
	;sta variableGameMode 

	lda #1
	sta booleanResetWasNOTDownLastFrame



	lda #>GraphicsPage ;grab the hight byte of the graphic location for score graphics....
	sta pointerP0Graphic+1	;2 byte memory lookup
	sta pointerP1Graphic+1	
	sta pointerP0Score+1
	sta pointerP1Score+1
	sta pointerPterryGraphic+1


	
	
	

	


;--------------------------------------
;START THE TITLE SCREEN
;--------------------------------------
TitleStart

	lda #230
	sta slowBallYCoordFromBot+1
	lda #0
	sta slowBallYCoordFromBot



	lda #14
	sta slowP0YCoordFromBottom+1

	lda #14
	sta slowP1YCoordFromBottom+1

	lda #14
	sta varPterryVerticalPos

	lda #0
	sta booleanBallRight ;start ball moving right

	lda #BALLPOS_CENTER
	sta pterryHorizPosition

	

	lda #<PterryWingDownGraphic

	sta pointerPterryGraphic
	

;ok, now we're getting the usual 'just hit reset stuff'

	lda #$1F
	sta COLUPF  ;colored playfield for title


	lda #0
	sta CTRLPF	;playfield ain't reflected


	;sta AUDV0 
	;sta AUDV1 

	; position and setup players
	sta WSYNC
	sta RESM1
	ldx #7
posDelay
	dex
	bne posDelay
	nop
	nop
	sta RESP1
	sta RESBL
	ldx #3
posDelay2
	dex
	bne posDelay2
	sta RESP0
	nop
	sta RESM0
	lda #%00010000
	sta HMP0
	lda #%10000000
	sta HMM0

	sta WSYNC
	sta HMOVE
	lda #$88
	sta COLUP0
	lda #PTERRYCOLOR
	sta COLUP1
	lda #2
	sta NUSIZ0
	lda #5
	sta NUSIZ1

	; setup stack for PHP trick
	tsx
	stx saveStack
	ldx #ENAM1-1
	txs 



	lda #0
	sta HMP0



;	lda booleanOverrideSelectChangeThisTime
;	bne TitleMainLoopPrelude
	jmp TitleSelectIsDownNow

;TitleMainLoopPrelude
;	lda #123
;	sta COLUBK

;--------------------------------------
;--------------------------------------
; TITLE SCREEN
;--------------------------------------
;--------------------------------------


	

TitleMainLoop








;MainLoop starts with usual VBLANK code,
;and the usual timer seeding
	lda  #2
	sta  VSYNC	
	sta  WSYNC	
	sta  WSYNC 	
	sta  WSYNC	
	lda  #43	
	sta  TIM64T	
	lda #0		
	sta  VSYNC 	


	inc varPseudoRandomCounter

	
	
	lda SWCHA
	eor #%11111111
	beq NoJoystick


	lda booleanSelectSwitchIsDown
	beq doneAbortJoystick
	jmp TitleDoneCheckingSelect ; we already did it...
doneAbortJoystick

	;DO JOYSTICK SELECTING GAME- GOES UP OR DOWN (or right or left)

	lda #%00010000	;Up
	bit SWCHA 
	bne DoneJoyUp
	dec variableGameMode
	jmp SelectOrJoystickChangedGameMode
DoneJoyUp
	lda #%10000000	;Right
	bit SWCHA 
	bne DoneJoyRight
	dec variableGameMode
	jmp SelectOrJoystickChangedGameMode
DoneJoyRight
	lda #%00100000	;Down
	bit SWCHA 
	bne DoneJoyDown
	inc variableGameMode
	jmp SelectOrJoystickChangedGameMode
DoneJoyDown

	lda #%01000000	;Left
	bit SWCHA 
	bne DoneJoyLeft
	inc variableGameMode
	jmp SelectOrJoystickChangedGameMode
DoneJoyLeft







;	LDA #%01000000	;Left?
;	BIT SWCHA 
;	BNE DoneJoyLeft
;	;inc variableGameMode
;	jmp SelectOrJoystickChangedGameMode
;
;DoneJoyLeft


NoJoystick

CheckingResetinTitle
	lda SWCHB 		;read console switches
	and #%00000001 		;is game reset?

	tay

	beq DoneTitleReset
	lda booleanResetWasNOTDownLastFrame
	bne DoneTitleReset
	tya
	sta booleanResetWasNOTDownLastFrame

	jmp MainGameStart	;yes, go to start of game
DoneTitleReset
	tya
	sta booleanResetWasNOTDownLastFrame



TitleDoneWithReset
	
	lda SWCHB			;read console switches again
	and #%00000010 			;is game select?
	bne TitleSelectIsNotDownNow	;(no, skip next jump)


TitleSelectIsDownNow


	lda booleanSelectSwitchIsDown
	bne TitleDoneCheckingSelect ; we already did it...
	

;--	lda booleanOverrideSelectChangeThisTime 	;we don't change anything if they 
;--	bne TitleDoneCheckingSelect		;pressed select to get out of normal gamplay.


	;go down to next game mode (7 through 0), reset to 5 if -1
	dec variableGameMode
	


SelectOrJoystickChangedGameMode
	lda #1
	sta booleanSelectSwitchIsDown

	
	
	lda variableGameMode
	bpl doneResetingGameModeTooLow
	lda #5
	sta variableGameMode
doneResetingGameModeTooLow


	lda #5
	cmp variableGameMode
	bcs doneResetingGameModeTooHigh
	lda #0
	sta variableGameMode
doneResetingGameModeTooHigh



DoEffectssOfCurrentGameSelection


	lda variableGameMode
	and #%00000001
	
	

; <= 1, change to two player
	lda #1
	cmp variableGameMode
	bcc DoneSettingToTwoPlayer



	lda #1
	sta booleanGameIsTwoPlayers
	
	lda #<WingUpGraphicRight
	sta pointerP1Graphic



	jmp DoneSettingAllGameMode
DoneSettingToTwoPlayer


	lda #0
	sta booleanGameIsTwoPlayers
	

; <= 3, it's easy mode!
	lda #3
	cmp variableGameMode
	bcc DoneSettingToEasyMode

	lda #MIN_COMPUTER_REST_TIME_EASY

	sta varHowMuchTimeComputerNeedsToRest



	lda #<TeddyGraphic

	sta pointerP1Graphic
	jmp DoneSettingAllGameMode
DoneSettingToEasyMode	

;must be normal mode 1 player
	lda #MIN_COMPUTER_REST_TIME_HARD
	sta varHowMuchTimeComputerNeedsToRest



	lda #<SimpleFuji
	sta pointerP1Graphic
	


DoneSettingAllGameMode


	lda variableGameMode
	and #%00000001

	bne fillBricksEmpty
	
	lda #WINNING_SCORE_POORLORDS-1
	sta winningScore
	
	lda #%00100000 ; for wall...
	
	jmp doneFillBricks
fillBricksEmpty
	lda #WINNING_SCORE-1
	sta winningScore

	lda #%00000000 ; for wall...
	
doneFillBricks

	ldx #GAMEFIELD_HEIGHT_IN_BRICKS-1
InitTheBricksLoopBySelect
	sta playfieldMatrixLeft,X
	sta playfieldMatrixRight,X;
	dex;
	bne InitTheBricksLoopBySelect

	
	jmp TitleDoneCheckingSelect
TitleSelectIsNotDownNow
	lda #0
	sta booleanSelectSwitchIsDown


;--	lda #0
;--	sta booleanOverrideSelectChangeThisTime


TitleDoneCheckingSelect



;let fire button start 

	lda INPT4
	bmi NoButton0ToStartGame
	jmp MainGameStart
NoButton0ToStartGame

;	lda INPT5
;	bmi NoButton1ToStartGame
;	jmp MainGameStart
;NoButton1ToStartGame

















;music!
	lda #1
	sta booleanIsOnTitleScreen
	jmp makeminemusic
doneWithMusicOutOfGame







	
	




TitleWaitForVblankEnd	
	lda INTIM	
	bne TitleWaitForVblankEnd	
	sta VBLANK  	


	lda #0
	sta CTRLPF	;playfield ain't reflected



;just burning scanlines....you could do something else
	ldy #23		;20 scanlines

;FIRST WE DO JOUST
TitlePreLoop
	sta WSYNC	;wait for sync for each one...
	dey
	bne TitlePreLoop


	;lda #$1E
	lda #$34
	sta COLUPF

;diagnostic
;	lda variableGameMode ;#%00001101; msgVar
;	sta PF1


	ldx #PIXEL_HEIGHT_OF_TITLE 	; X will hold what letter pixel we're on
	ldy #SCANLINES_PER_TITLE_PIXEL	; Y will hold which scan line we're on for each pixel
;
;the next part is careful cycle counting from those 
;who have gone before me to get full non-reflected playfield

TitleShowLoop
	sta WSYNC 	
	lda PFDataTitleJoust0Left-1,X           ;[0]+4
	sta PF0                 ;[4]+3 = *7*   < 23	;PF0 visible
	lda PFDataTitleJoust1Left-1,X           ;[7]+4
	sta PF1                 ;[11]+3 = *14*  < 29	;PF1 visible
	lda PFDataTitleJoust2Left-1,X           ;[14]+4
	sta PF2                 ;[18]+3 = *21*  < 40	;PF2 visible
	nop			;[21]+2
	nop			;[23]+2
	nop			;[25]+2
	;six cycles available  Might be able to do something here
	lda PFDataTitleJoust0Right-1,X          ;[27]+4
	;PF0 no longer visible, safe to rewrite
	sta PF0                 ;[31]+3 = *34* 
	lda PFDataTitleJoust1Right-1,X		;[34]+4
	;PF1 no longer visible, safe to rewrite
	sta PF1			;[38]+3 = *41*  
	lda PFDataTitleJoust2Right-1,X		;[41]+4
	;PF2 rewrite must begin at exactly cycle 45!!, no more, no less
	sta PF2			;[45]+2 = *47*  ; >

	dey ;ok, we've drawn one more scaneline for this 'pixel'
	bne NotChangingWhatTitlePixel ;go to not changing if we still have more to do for this pixel
	dex ; we *are* changing what title pixel we're on...

	beq DoneWithTitle ; ...unless we're done, of course
	
	ldy #SCANLINES_PER_TITLE_PIXEL ;...so load up Y with the count of how many scanlines for THIS pixel...
NotChangingWhatTitlePixel


	jmp TitleShowLoop

DoneWithTitle	
	nop
	nop
	nop

;	lda #$7C
;	sta COLUPF


;	ldx #PIXEL_HEIGHT_OF_TITLE_PONG ; X will hold what letter pixel we're on
;	ldy #SCANLINES_PER_TITLE_PIXEL ; Y will hold which scan line we're on for each pixel
;;
;;THEN WE DO PONG
;
;PongTitleShowLoop
;	sta WSYNC 	
;	lda PFDataTitlePong0Left-1,X           ;[0]+4
;	sta PF0                 ;[4]+3 = *7*   < 23	;PF0 visible
;	lda PFDataTitlePong1Left-1,X           ;[7]+4
;	sta PF1                 ;[11]+3 = *14*  < 29	;PF1 visible
;	lda PFDataTitlePong2Left-1,X           ;[14]+4
;	sta PF2                 ;[18]+3 = *21*  < 40	;PF2 visible
;	nop			;[21]+2
;	nop			;[23]+2
;	nop			;[25]+2
;	;six cycles available  Might be able to do something here
;	lda PFDataTitlePong0Right-1,X          ;[27]+4
;	;PF0 no longer visible, safe to rewrite
;	sta PF0                 ;[31]+3 = *34* 
;	lda PFDataTitlePong1Right-1,X		;[34]+4
;	;PF1 no longer visible, safe to rewrite
;	sta PF1			;[38]+3 = *41*  
;	lda PFDataTitlePong2Right-1,X		;[41]+4
;	;PF2 rewrite must begin at exactly cycle 45!!, no more, no less
;	sta PF2			;[45]+2 = *47*  ; >
;
;
;
;	dey ;ok, we've drawn one more scaneline for this 'pixel'
;	bne NotChangingWhatPongTitlePixel ;go to not changing if we still have more to do for this pixel
;	dex ; we *are* changing what title pixel we're on...
;
;	beq DoneWithPongTitle ; ...unless we're done, of course
;	
;	ldy #SCANLINES_PER_TITLE_PIXEL ;...so load up Y with the count of how many scanlines for THIS pixel...
;NotChangingWhatPongTitlePixel
;
;
;
;
;
;	jmp PongTitleShowLoop
;
;
;
;DoneWithPongTitle	

	;clear out the playfield registers for obvious reasons	
	lda #0
	sta PF2 ;clear out PF2 first, I found out through experience
	sta PF0
	sta PF1

;just burning scanlines....
	ldy #24
TitlePostLoop
	sta WSYNC
	dey
	bne TitlePostLoop

	lda #1
	sta CTRLPF	;playfield ain't reflected


	

	lda #<WingUpGraphicLeft;;!!!-1 ;add in the low byte of the graphic location	

	sta pointerP0Graphic

;	lda #<WingUpGraphicRight;;!!!-1 ;add in the low byte of the graphic location	
;	sta pointerP1Graphic

;	lda booleanGameIsTwoPlayers
;	beq doneChangingToFuji
;	lda #<SimpleFuji
;	sta pointerP1Graphic
;doneChangingToFuji

wasteselecter	
	jmp kernalselecter
	align 256
kernalselecter



























	sta WSYNC

	ldx #10
kernelDlySelector
	dex
	bne kernelDlySelector
	ldx #16

	SLEEP 6

	jmp scanLoopSelector              ;3
	;---------------------------------------------------------------------------


	;-------------------------------------
	; skip draw outside kernal routines

skipDrawLeftSelector         ; 3 from BCC
	lda Zero          ; 2 load for GRP0
	beq continueLeftSelector  ; 3 Return... 

skipDrawRightSelector        ; 3 from BCC
	lda Zero          ; 2 load for GRP0
	beq continueRightSelector ; 3 Return...

skipDrawPterySelector        ; 3 from BCC
	lda Zero          ; 2 load for GRP0
	beq continuePterySelector ; 3 Return...

	; --------------- start of main loop
scanLoopSelector:
	; skipDraw routine for left player
	txa                          ; 2 A-> Current scannline
	sec                          ; 2 new
	sbc slowP0YCoordFromBottom+1 ; 3 copyint
	adc #SPRITEHEIGHT+1          ; 2 calc if sprite is drawn

	sty GRP1                     ; 3 Execute Write for ptery here
	ldy #P0COLOR                 ; 2

	; --------------- line 1
;	sta WSYNC                    ; WSYNC *** removed ***
	sty COLUP0                   ; 3
	bcc skipDrawLeftSelector             ; 2/3 To skip or not to skip?
	tay                          ; 2 not necessary when Y holds scannline
	lda (pointerP0Graphic),y     ; 5 Select shape
continueLeftSelector:
	sta GRP0                     ; 3 Execute Write here!
	sta p0DrawBuffer             ; 3 save for next line
	
	lda #0                       ; 2 blank out playfield for this line
	sta PF0                      ; 3 

	; skipDraw routine for right player
	txa                          ; 2 A-> Current scannline
	sec                          ; 2 Clearing instead of setting lines up players
	sbc slowP1YCoordFromBottom+1 ; 3 copyIntegerCoordP1             ; 3 
	adc #SPRITEHEIGHT+1          ; 2 calc if sprite is drawn
	bcc skipDrawRightSelector            ; 2/3 To skip or not to skip?
	tay                          ; 2 not necessary when Y holds scannline
	lda (pointerP1Graphic),y     ; 5 Select shape
continueRightSelector:
	sta GRP0                     ; 3 Execute Write here!

	ldy #P1COLOR                 ; 2
	sty COLUP0                   ; 3

	sta p1DrawBuffer             ; 3 save for next line

	; draw ball
	pla                          ; 4 
	cpx slowBallYCoordFromBot+1           ; 3
	php                          ; 3 

	; set up playfield index
	txa                          ; 2
	lsr                          ; 2

	sta COLUPF;......3


	lsr                          ; 2

	tay                          ; 2
	lda playfieldMatrixLeft,Y    ; 4

	nop
	nop
	;sleep 4

	; --------------- line 2
					;	sta WSYNC                    ; WSYNC *** removed *** between 2 and 5

;	dec $2D                      ; 5 free cycles

	sta PF0                      ; 3

	; draw left player
	lda p0DrawBuffer             ; 3
	sta GRP0                     ; 3 

	lda #P0COLOR                 ; 2
	sta COLUP0                   ; 3

	sec                          ; 2 for upcoming ptery skipDraw

	; draw right PF
	lda playfieldMatrixRight,Y   ; 4
	sta PF0                      ; 3 


	lda #P1COLOR                 ; 2
	sta COLUP0                   ; 3

	; draw right player
	lda p1DrawBuffer             ; 3 
	sta GRP0                     ; 3

	; skipDraw routine for ptery
	txa                          ; 2 A-> Current scannline
	sbc varPterryVerticalPos     ; 3 
	adc #SPRITEHEIGHT            ; 2 calc if sprite is drawn
	bcc skipDrawPterySelector            ; 2/3 To skip or not to skip?
	tay                          ; 2 not necessary when Y holds scannline
	lda (pointerPterryGraphic),Y ; 5 Select shape
continuePterySelector:
	tay                          ; 2

	dex                          ; 2
	bne scanLoopSelector                 ; 3
	; --------------- end of kernel

	stx PF0
	stx ENAM1


	sta WSYNC  	
	stx GRP0
	stx GRP1

	sta WSYNC
	sta WSYNC

endkernalSelector



;just burning scanlines....you could do something else
	ldy #40
TitlePostPostLoop
	sta WSYNC
	dey
	bne TitlePostPostLoop


; usual vblank
	lda #2		
	sta VBLANK 	
	ldx #30		
TitleOverScanWait
	sta WSYNC
	dex
	bne TitleOverScanWait
	jmp  TitleMainLoop      


;--------------------------------------
;--------------------------------------
; MAIN GAME
;--------------------------------------
;--------------------------------------

MainGameStart
	lda #%00010001
	sta CTRLPF 

	lda #CEILING_HALF 
	sta slowP0YCoordFromBottom + 1 	;44 in integer part of players position
	sta slowP1YCoordFromBottom + 1 	;('bout half way up)


;move pterry for counter
	lda #CEILING_HALF+5
	sta varPterryVerticalPos

	lda #BALLPOS_CENTER-5
	sta pterryHorizPosition



	lda #0
	sta varPterryBoredCounter 
	sta varPterryBehavior

	lda #0
	sta AUDV0
	sta AUDV1


	sta slowP0YCoordFromBottom ;0 in fractional part of players position
	sta slowP1YCoordFromBottom 

	;0 in all player's speed, integer and fractional

	sta slowP0YSpeed + 1
	sta slowP0YSpeed 	
	sta slowP1YSpeed + 1
	sta slowP1YSpeed 

	;zero out scores and game being over
	sta p0score
	sta p1score
	sta booleanGameOver


	;temp! sta varBallExtraSpeed


	lda #BALL_FREEZE_TIME 
	sta varTimeBeforeBallMoves
	

	

	lda #>GraphicsPage ;grab the high byte of the graphic location
	sta pointerP0Graphic+1	;2 byte memory lookup
	sta pointerP1Graphic+1	
	sta pointerPterryGraphic+1	


	lda variableGameMode
	and #%00000001
	bne fillBricksEmptyOnStart
	lda #%00100000 ; for wall...
	jmp doneFillBricksOnStart
fillBricksEmptyOnStart
	lda #%00000000 ; for wall...
doneFillBricksOnStart

	ldx #GAMEFIELD_HEIGHT_IN_BRICKS-1
InitTheBricksLoopByStart
	sta playfieldMatrixLeft,X
	sta playfieldMatrixRight,X;
	dex;
	bne InitTheBricksLoopByStart



;--------------------------------------
;SETTING UP PLAYFIELD AND BALL ETC
;--------------------------------------
	lda #GAMEPFCOLOR
	sta COLUPF
	;color here
	


	
	lda #38
	sta slowBallYCoordFromBot+1
	lda #0
	sta slowBallYCoordFromBot

	lda #BALLPOS_CENTER+5
	sta ballXposition+1

	



;double player graphic
;	lda #%00000100
;	sta NUSIZ0 


;seed the sound buffers
	
	lda #TYPE_OF_FLAPSOUND
	sta AUDC0 ;type of sound for flaps
	lda #PITCH_OF_FLAPSOUND
	sta AUDF0 ;pitch

	lda #4
	sta AUDC1 ;type of sound for pings
	







;--------------------------------------
;--------------------------------------
;START MAIN LOOP W/ VSYNC
;--------------------------------------
;--------------------------------------
MainLoop

	inc varPseudoRandomCounter


;old reset stuff.....

CheckingResetinGame
	lda SWCHB 		;read console switches
	and #%00000001 		;is game reset?

	tay

	beq DoneGameReset
	lda booleanResetWasNOTDownLastFrame
	bne DoneGameReset
	tya
	sta booleanResetWasNOTDownLastFrame

	jmp MainGameStart	;yes, go to start of game
DoneGameReset
	tya
	sta booleanResetWasNOTDownLastFrame




	lda SWCHB
	and #%00000010 ;is game select hit?
	bne SelectWasNotHit ;if so jump to the title screen

SelectWasHitDuringGame
	;hopefully these are the only initialzations we have to perform? 
	;might need to change logic if not...	
	lda #0
	sta CTRLPF	;playfield ain't reflected

	lda #VOICE_FOR_MUSIC
	sta AUDC0

	lda #VOICE_FOR_BEAT;8
	sta AUDC1


	;we might have to reset playfield...
	lda variableGameMode
	and #%00000001
	bne fillBricksEmptyOnSelectInGame
	lda #%00100000 ; for wall...
	jmp doneFillBricksOnSelectInGame
fillBricksEmptyOnSelectInGame
	lda #%00000000 ; for wall...
doneFillBricksOnSelectInGame

	ldx #GAMEFIELD_HEIGHT_IN_BRICKS-1
InitTheBricksLoopBySelectInGame
	sta playfieldMatrixLeft,X
	sta playfieldMatrixRight,X;
	dex;
	bne InitTheBricksLoopBySelectInGame



	lda #0
	sta musicRiffNoteCounter
	sta musicRiffNoteTimeLeft
	sta musicBeatNoteCounter
	sta musicBeatNoteTimeLeft




	inc variableGameMode
;--	lda #1
;--	sta booleanOverrideSelectChangeThisTime 

	jmp TitleStart
	;jmp TitleSelectIsDownNow
SelectWasNotHit



	lda  #2
	sta  VSYNC	
	sta  WSYNC	
	sta  WSYNC 	
	sta  WSYNC	
	lda  #43	
	sta  TIM64T	
	lda #0		
	sta  VSYNC 	


	

	lda flagPterryMakeNoise
	bne DoneCancellingPingNoise; abort noise...


	sta AUDV1 ;volume for dinger

DoneCancellingPingNoise








;
; for now assume wings are up
;






;--------------------------------------
;SEE IF BUTTON 0 IS NEWLY PRESSED
;--------------------------------------




CheckButton0
	lda INPT4
	bmi NoButton0


	;buttons down, graphic is down...
	lda #<WingDownGraphicLeft;;;-1 ;add in the low byte of the graphic location
	sta pointerP0Graphic


	;Check to see if the button was already down
	lda but0WasOn
	bne Button0WasAlreadyDown


	;this is a new button press...
	;time to flap!  do 16 bit math
	;to get integer and fractional speed
	clc
	lda slowP0YSpeed
	adc #SLOW_FLAP_LO_BYTE 
	sta slowP0YSpeed
	lda slowP0YSpeed+1            
	adc #SLOW_FLAP_HI_BYTE 
	sta slowP0YSpeed+1



	lda #1
	sta but0WasOn
	
	
	lda #LENGTH_OF_FLAPSOUND 
	sta flapsoundRemaining 




	
Button0WasAlreadyDown
	jmp EndButton0
NoButton0	;button wasn't pressed, remember that
	lda #0
	sta but0WasOn

	lda #<WingUpGraphicLeft;;!!!-1 ;add in the low byte of the graphic location	
	sta pointerP0Graphic
EndButton0


;--------------------------------------
;PLAYER 1  CONTROL, JOYSTICK OR AI?
;--------------------------------------

	lda booleanGameIsTwoPlayers
	beq Player1AI


;--------------------------------------
;SEE IF BUTTON 1 IS NEWLY PRESSED
;--------------------------------------


CheckButton1
	lda INPT5
	bmi NoButton1

	;buttons down, graphic is down...
	lda #<WingDownGraphicRight;;;!!!-1 ;add in the low byte of the graphic location
	sta pointerP1Graphic



	;Check to see if the button was already down
	lda but1WasOn
	bne Button1WasAlreadyDown

	;this is a new button press...
	;time to flap!  do 16 bit math
	;to get integer and fractional speed
	clc
	lda slowP1YSpeed
	adc #SLOW_FLAP_LO_BYTE ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowP1YSpeed
	lda slowP1YSpeed+1          
	adc #SLOW_FLAP_HI_BYTE 
	sta slowP1YSpeed+1
	
	lda #1
	sta but1WasOn
	
	
	lda #LENGTH_OF_FLAPSOUND 
	sta flapsoundRemaining 
		
	lda #<WingDownGraphicRight;;;;-1 ;add in the low byte of the graphic location
	sta pointerP1Graphic

	
Button1WasAlreadyDown
	jmp EndButton1
NoButton1	;button wasn't pressed, remember that
	lda #0
	sta but1WasOn
	
	lda #<WingUpGraphicRight;add in the low byte of the graphic location	
	sta pointerP1Graphic


EndButton1

	jmp AllDoneWithPlayer1


;--------------------------------------
;AI for Player 1
;--------------------------------------

	


Player1AI
;don't do anything if game is over


	lda #<WingUpGraphicRight ;add in the low byte of the graphic location	
	sta pointerP1Graphic

	lda booleanGameOver
	bne AllDoneWithPlayer1 ;on your way 

	lda varTimeBeforeBallMoves
	bpl AllDoneWithPlayer1



GameAintOverSoThinkAndFlap
	lda varTimeComputerResting
	beq ComputerAllRested
	
	dec varTimeComputerResting
	jmp DoneCheckingP1BeneathBall;too tired to flap, don't care that we're all done

ComputerAllRested


;don't do anything if ball is heading away
	lda booleanBallRight
	beq DoneCheckingP1BeneathBall


;is p1 lower than the ball?
	lda slowP1YCoordFromBottom+1
	cmp slowBallYCoordFromBot+1
	bcs AllDoneWithPlayer1
	;P1 is lower, give it a flap

	;time to flap!  do 16 bit math
	;to get integer and fractional speed
	clc
	lda slowP1YSpeed
	adc #CPU_FLAP_LO_BYTE ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowP1YSpeed
	lda slowP1YSpeed+1          
	adc #CPU_FLAP_HI_BYTE 
	sta slowP1YSpeed+1

	lda varHowMuchTimeComputerNeedsToRest
	sta varTimeComputerResting



	lda #LENGTH_OF_FLAPSOUND 
	sta flapsoundRemaining 
	
	lda #WINGSHOWNDOWNTIME
	sta varComputerWingShownDownTimer

	
DoneCheckingP1BeneathBall



	lda varComputerWingShownDownTimer
	beq notShowingWingDown

	dec varComputerWingShownDownTimer

	lda #<WingDownGraphicRight ;add in the low byte of the graphic location	
	sta pointerP1Graphic
notShowingWingDown





AllDoneWithPlayer1

	


;SLOW....

;add in gravity constant to speed....16 bit math..

	clc
	lda slowP0YSpeed
	adc #SLOW_GRAV_LO_BYTE ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowP0YSpeed
	lda slowP0YSpeed+1          
	adc #SLOW_GRAV_HI_BYTE 
	sta slowP0YSpeed+1


;add speed to coordinate....

	clc
	lda slowP0YCoordFromBottom
	adc slowP0YSpeed        ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowP0YCoordFromBottom
	lda slowP0YCoordFromBottom+1          
	adc slowP0YSpeed+1
	sta slowP0YCoordFromBottom+1

;add in gravity constant to speed....16 bit math..

	clc
	lda slowP1YSpeed
	adc #SLOW_GRAV_LO_BYTE ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowP1YSpeed
	lda slowP1YSpeed+1
	adc #SLOW_GRAV_HI_BYTE 
	sta slowP1YSpeed+1


;add speed to coordinate....

	clc
	lda slowP1YCoordFromBottom
	adc slowP1YSpeed        ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowP1YCoordFromBottom
	lda slowP1YCoordFromBottom+1          
	adc slowP1YSpeed+1
	sta slowP1YCoordFromBottom+1









;--------------------------------------
;SEE IF BALL HIT PLAYER
;--------------------------------------
	lda #%10000000
	bit CXM1P 		
	bne IsCollisionBallP0	;skip if not hitting...
	jmp NoCollisionBallP0
IsCollisionBallP0
;temp!ballspeedup thing goes here
;	LDA varBallExtraSpeed
;	CMP #MAX_BALL_SPEED_BOOST
;	bcs DoneMakingSureNotOverBoosting
;	
;	inc varBallExtraSpeed
;	inc varBallExtraSpeed
;
;DoneMakingSureNotOverBoosting
	


;we have a hit - if ball is positioned 
; on left side, it goes right. On right,
; it goes left.
	lda #BALLPOS_CENTER
	cmp ballXposition+1
	bcc BallHitPlayerOnRight
BallHitPlayerOnLeft
	lda #1
	sta booleanBallRight



;;new ball speed is old speed pluys player hit speed
;	clc
;	lda slowBallYSpeed
;	adc slowP0YSpeed        ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
;	sta slowBallYSpeed
;	lda slowBallYSpeed+1          
;	adc slowP0YSpeed+1
;	sta slowBallYSpeed+1


;this was just speed copy
	lda slowP0YSpeed+1
	sta slowBallYSpeed+1
	lda slowP0YSpeed
	sta slowBallYSpeed
	
	;fudge factor: if player is on floor, bounce ball angle up	
	lda #FLOOR_HEIGHT_FOR_PLAYERS	;10 is floor
	cmp slowP0YCoordFromBottom+1
	bcc DoneCheckingFudgeAngleUpP0
	lda #BALL_FUDGE_SPEED
	sta slowBallYSpeed
	lda #0
	sta slowBallYSpeed+1
DoneCheckingFudgeAngleUpP0	
	
	
	jmp DoneBallHitPlayer
BallHitPlayerOnRight
	lda #0
	sta booleanBallRight

;;new ball speed is old speed pluys player hit speed
;	clc
;	lda slowBallYSpeed
;	adc slowP1YSpeed        ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
;	sta slowBallYSpeed
;	lda slowBallYSpeed+1          
;	adc slowP1YSpeed+1
;	sta slowBallYSpeed+1
;

	lda slowP1YSpeed+1
	sta slowBallYSpeed+1
	lda slowP1YSpeed
	sta slowBallYSpeed


	lda #FLOOR_HEIGHT_FOR_PLAYERS	;10 is floor
	cmp slowP1YCoordFromBottom+1
	bcc DoneCheckingFudgeAngleUpP1
	
	lda #BALL_FUDGE_SPEED
	sta slowBallYSpeed
	lda #0
	sta slowBallYSpeed+1

DoneCheckingFudgeAngleUpP1


DoneBallHitPlayer



;;  	cmp #$80 ;preserves sign via carry...thanks Thomas
;;nerd  	ror
;	lda slowBallYSpeed+1
;
;	bne doneHackBallSpeedUnzero ;if its zero, we want to set it to 1 or -1
;				   ;based on its previous pos or neg speed
;	txa
;
;	and #%10000000
;	bne prevBallSpeedNeg;was negative
;prevBallSpeedPos
;	lda #1
;	jmp doneHackBallSpeedUnzero
;prevBallSpeedNeg
;	lda #-1 ;don't let ball vert speed be zero...
;doneHackBallSpeedUnzero
;	sta slowBallYSpeed+1


;making sure ball speed isnt to extreme (abs(speed) not too big)

	









	;comparison to make sure speed
	;isn't too slow; it's much easier to 
	;do comparisons w/ positive values,
	;and also we know it's a small positive 
	;value, so once it's positive, if the 
	;hi byte is not zero, it MUST be big enough
	;so we make a copy into temp, and then
	;change the original if we see the guaranteed
	;positive version is too small

	lda slowBallYSpeed
	sta tempVar
	lda slowBallYSpeed+1
	sta tempVar+1


	lda #0
	sta anotherTempVar 

	;YohY ;LDY #0 ; Y is boolean, 0 = postive

	lda tempVar+1	
	bpl ThisAintNegativeSpeed

	lda #1

	sta anotherTempVar
	;YohY LDY #1 ;remember that this is negative

	;negate what's in temp
	sec
	lda #0
	sbc tempVar
	sta tempVar
	lda #0
	sbc tempVar+1
	sta tempVar+1
	
ThisAintNegativeSpeed

	;we know tempvar is 16 bit, positive value


	lda #BALL_MAX_POS_SPEED_HI 
	cmp tempVar+1
	bcc needToSlowDownBall
	jmp doneSlowingDownBall
needToSlowDownBall



	lda anotherTempVar ;YohY tya
	beq ChangeBallSpeedToMaxPositive
ChangeBallSpeedToMaxNegative	
	lda #BALL_MAX_NEG_SPEED_LO
	sta slowBallYSpeed
	lda #BALL_MAX_NEG_SPEED_HI
	sta slowBallYSpeed+1
	jmp doneDoingAnyBallSpeedChange
ChangeBallSpeedToMaxPositive
	lda #BALL_MAX_POS_SPEED_LO
	sta slowBallYSpeed
	lda #BALL_MAX_POS_SPEED_HI
	sta slowBallYSpeed+1
	jmp doneDoingAnyBallSpeedChange




doneSlowingDownBall

	;we know tempvar is 16 bit, positive value
	
	lda tempVar+1
	bne DoneSeeingBallSpeedIsBigEnough
	
	lda tempVar
	cmp #BALL_MIN_POS_SPEED_LO
	bcs DoneSeeingBallSpeedIsBigEnough
;	
	lda anotherTempVar

	;YohY ;tya
	beq ChangeBallSpeedToMinPositive
ChangeBallSpeedToMinNegative	
	lda #BALL_MIN_NEG_SPEED_LO
	sta slowBallYSpeed
	lda #BALL_MIN_NEG_SPEED_HI
	sta slowBallYSpeed+1
	jmp DoneSeeingBallSpeedIsBigEnough
ChangeBallSpeedToMinPositive
	lda #BALL_MIN_POS_SPEED_LO
	sta slowBallYSpeed
	lda #BALL_MIN_POS_SPEED_HI
	sta slowBallYSpeed+1
DoneSeeingBallSpeedIsBigEnough





doneDoingAnyBallSpeedChange







	lda flagPterryMakeNoise
	bne NoCollisionBallP0 ; abort noise...
	lda #PITCH_OF_PONGHIT
	sta AUDF1 ;pitch
	lda #VOLUME_OF_PONGHIT
	sta AUDV1 ;volume for dinger



NoCollisionBallP0







;--------------------------------------
;SEE IF BALL HIT PTERRY
;--------------------------------------
	lda #%01000000
	bit CXM1P  		
	beq NoCollisionBallP1	;skip if not hitting...
;we have a hit

;	lda booleanBallRight
;	eor #$FF
;	sta booleanBallRight


	lda varPterryWasHitWithBall
	bne DoneWithCollisionBallP1

	lda #1
	sta varPterryWasHitWithBall



	lda booleanBallRight
	beq hitPterryGoRight
	lda #0
	sta booleanBallRight
	jmp doneHittingPterry
hitPterryGoRight
	lda #1
	sta booleanBallRight
doneHittingPterry

	lda flagPterryMakeNoise
	bne DoneWithCollisionBallP1 ; abort noise...


	lda #PITCH_OF_PONGHIT
	sta AUDF1 ;pitch
	lda #VOLUME_OF_PONGHIT
	sta AUDV1 ;volume for dinger

	jmp DoneWithCollisionBallP1
NoCollisionBallP1
	lda #0
	sta varPterryWasHitWithBall
DoneWithCollisionBallP1






;--------------------------------------
;SEE IF PLAYER HIT PTERRY
;--------------------------------------
	lda #%10000000
	bit CXPPMM
	beq DoneCollisionPterryAndPlayer	;


	lda #-1 ;flag for starting...
	sta flagPterryMakeNoise


	lda #BALLPOS_CENTER
	cmp pterryHorizPosition
	bcc PterryHitP1

PterryHitP0
	clc
	lda slowP0YSpeed
	adc #PTERRY_HIT_PUSH_LO_BYTE 
	sta slowP0YSpeed
	lda slowP0YSpeed+1          
	adc #PTERRY_HIT_PUSH_HI_BYTE 
	sta slowP0YSpeed+1
	jmp DoneCollisionPterryAndPlayer
PterryHitP1
	clc
	lda slowP1YSpeed
	adc #PTERRY_HIT_PUSH_LO_BYTE 
	sta slowP1YSpeed
	lda slowP1YSpeed+1          
	adc #PTERRY_HIT_PUSH_HI_BYTE 
	sta slowP1YSpeed+1


DoneCollisionPterryAndPlayer

;--------------------------------------
;SEE IF BALL HIT WALL
;--------------------------------------

	lda #%10000000
	bit CXM1FB  
	beq NoBallPlayfieldCollision


	lda flagPterryMakeNoise
	bne DoneSettingNoiseForWallHit ; abort noise...


	lda #PITCH_OF_PONG_WALL_HIT
	sta AUDF1 ;pitch
	lda #VOLUME_OF_PONGHIT
	sta AUDV1 ;volume for dinger
DoneSettingNoiseForWallHit



	;fixer dec slowBallYCoordFromBot+1 ;need to adjust, ball not quite aligned
	
	;dive ball coordinate by 4...
	lda slowBallYCoordFromBot+1
	lsr
	lsr
	tay
	
	;fixer inc slowBallYCoordFromBot+1  ;undo previous adjustment






	lda #BALLPOS_CENTER
	cmp ballXposition+1
	bcc WallHitOnRight
WallHitOnLeft
	;if ball hits between bricks, higher brick is removed
	;however, if ball hit top of brick with blank space above,
	;this math was trying to remove the blank space!
	;so if the space is already blank, we Decrement Y and remove
	;the brick below

	;fixer lda playfieldMatrixLeft,Y
	;fixer bne noNeedToAdjustWallHitOnLeft
	;fixer dey


noNeedToAdjustWallHitOnLeft

	lda #0
	sta playfieldMatrixLeft,Y;;WALL;;
	
	lda #1
	sta booleanBallRight 

	jmp DoneWithWallHits

WallHitOnRight
	;if ball hits between bricks, higher brick is removed
	;however, if ball hit top of brick with blank space above,
	;this math was trying to remove the blank space!
	;so if the space is already blank, we Decrement Y and remove
	;the brick below

	;fixer lda playfieldMatrixRight,Y
	;fixer bne noNeedToAdjustWallHitOnRight
	;fixer dey


noNeedToAdjustWallHitOnRight
	lda #0;;WALL;;
	sta playfieldMatrixRight,Y;;WALL;;

	lda #0
	sta booleanBallRight 

DoneWithWallHits





NoBallPlayfieldCollision





	sta CXCLR



;--------------------------------------
;SEE IF BALL GOT TO PLAYER GOAL
;--------------------------------------


	lda booleanGameOver
	bne DoneCheckingAllScores

	lda #BALLPOS_RIGHT
	cmp ballXposition+1
	bcs DoneCheckingP0Won



	;do dinger


	lda flagPterryMakeNoise
	bne DoneSettingNoiseForGoalP0 ; abort noise...


	lda #PITCH_OF_GOAL
	sta AUDF1 ;pitch
	lda #VOLUME_OF_PONGHIT
	sta AUDV1 ;volume for dinger
DoneSettingNoiseForGoalP0

	;going to flash point total
	lda #15
	sta varScoreColorFlasherP0

	;reset ball
	lda #BALLPOS_CENTER
	sta ballXposition+1

	inc p0score
	
	lda winningScore
	cmp p0score
	bcs DoneCheckingP0Won


;game over man, game over
	
	lda #1
	sta booleanGameOver



	lda #10
	sta p0score ;make it a W... 


	lda #0
	sta musicRiffNoteCounter
	sta musicRiffNoteTimeLeft
	sta musicBeatNoteCounter
	sta musicBeatNoteTimeLeft


DoneCheckingP0Won


	lda #BALLPOS_LEFT
	cmp ballXposition+1 
	bcc DoneCheckingP1Won


	lda flagPterryMakeNoise
	bne DoneSettingNoiseForGoalP1 ; abort noise...


	;do dinger
	lda #PITCH_OF_GOAL
	sta AUDF1 ;pitch
	lda #VOLUME_OF_PONGHIT
	sta AUDV1 ;volume for dinger

DoneSettingNoiseForGoalP1
	;going to flash point total
	lda #15
	sta varScoreColorFlasherP1


	;reset ball
	lda #BALLPOS_CENTER
	sta ballXposition+1

	inc p1score


	lda winningScore
	cmp p1score
	bcs DoneCheckingP1Won

;game over man, game over
	
	lda #1
	sta booleanGameOver

	lda #10
	sta p1score ;make it a W... 


	lda #0
	sta musicRiffNoteCounter
	sta musicRiffNoteTimeLeft
	sta musicBeatNoteCounter
	sta musicBeatNoteTimeLeft



	
DoneCheckingP1Won

DoneAddingToScore









DoneCheckingAllScores








	;ball is frozen for a certain amount of time 
	;at start of game

	lda varTimeBeforeBallMoves
	bmi BallIsInPlay

	dec varTimeBeforeBallMoves
	jmp doneAdjustingBallPosition



BallIsInPlay
;--------------------------------------
;ADJUST BALL VERTICAL POSITION
;--------------------------------------
;;add negative of ball speed to ball to "0"
;	lda #0
;	sec
;	sbc slowBallYSpeed+1
;;and add old psition to that
;	clc
;	adc slowBallYCoordFromBot+1
;	sta slowBallYCoordFromBot+1

	clc
	lda slowBallYCoordFromBot
	adc slowBallYSpeed        ; HIGH BYTE OF 16-BIT Y MOVEMENT SPEED
	sta slowBallYCoordFromBot
	lda slowBallYCoordFromBot+1          
	adc slowBallYSpeed+1
	sta slowBallYCoordFromBot+1




;--------------------------------------
;ADD OR SUBTRACT FROM BALL HORIZONTAL POSITION
;--------------------------------------



	lda SWCHB
	and #%01000000
	bne SetToProFastBallSpeeds

	
	lda booleanBallRight
	beq adjustBallToLeftSlow

adjustBallToRightSlow
	clc
	lda ballXposition
	adc #SLOW_BALL_RIGHT_SPEED_LO_BYTE 
	sta ballXposition
	lda ballXposition+1            
	adc #SLOW_BALL_RIGHT_SPEED_HI_BYTE 
	sta ballXposition+1

	jmp doneAdjustingBallPositionBasic



adjustBallToLeftSlow
	clc
	lda ballXposition
	adc #SLOW_BALL_LEFT_SPEED_LO_BYTE 
	sta ballXposition
	lda ballXposition+1            
	adc #SLOW_BALL_LEFT_SPEED_HI_BYTE 
	sta ballXposition+1
	jmp doneAdjustingBallPositionBasic


SetToProFastBallSpeeds

	lda booleanBallRight
	beq adjustBallToLeftFast

adjustBallToRightFast
	clc
	lda ballXposition
	adc #FAST_BALL_RIGHT_SPEED_LO_BYTE 
	sta ballXposition
	lda ballXposition+1            
	adc #FAST_BALL_RIGHT_SPEED_HI_BYTE 
	sta ballXposition+1

	jmp doneAdjustingBallPositionBasic



adjustBallToLeftFast
	clc
	lda ballXposition
	adc #FAST_BALL_LEFT_SPEED_LO_BYTE 
	sta ballXposition
	lda ballXposition+1            
	adc #FAST_BALL_LEFT_SPEED_HI_BYTE 
	sta ballXposition+1
	jmp doneAdjustingBallPositionBasic

doneAdjustingBallPositionBasic



;temp!
;;add in extra speed up
;
;	lda booleanBallRight
;	beq boostBallToLeft
;boostBallToRight
;	clc
;	lda ballXposition
;	adc varBallExtraSpeed
;	sta ballXposition
;	lda ballXposition+1            
;	adc #0
;	sta ballXposition+1
;
;	jmp doneAdjustingBallPosition
;
;boostBallToLeft
;	sec
;	lda ballXposition
;	sbc varBallExtraSpeed
;	sta ballXposition
;	lda ballXposition+1
;	sbc #0
;	sta ballXposition+1

doneAdjustingBallPosition







;--------------------------------------
;SEE IF BALL HIT FLOOR
;--------------------------------------


	lda slowBallYCoordFromBot+1
	cmp #FLOOR_HEIGHT_FOR_BALL
    	bpl DoneCheckingHitFloorBall

	;place ball on floor
    	lda #FLOOR_HEIGHT_FOR_BALL
	sta slowBallYCoordFromBot+1
;ball speed is negative of previous ball speed; negate
	sec
	lda #0
	sbc slowBallYSpeed
	sta slowBallYSpeed
	lda #0
	sbc slowBallYSpeed+1
	sta slowBallYSpeed+1


DoneCheckingHitFloorBall




;--------------------------------------
;SEE IF BALL HIT CEILING
;--------------------------------------





	lda #CEILING_HEIGHT ;#was 180 before 2 line kernal
	cmp slowBallYCoordFromBot+1
	bcs DoneCheckingHitCeilingBall

;ball speed is negative of previous ball speed


	sec
	lda #0
	sbc slowBallYSpeed
	sta slowBallYSpeed
	lda #0
	sbc slowBallYSpeed+1
	sta slowBallYSpeed+1



;place ball on ceiling
	lda #CEILING_HEIGHT ;#was 180
	sta slowBallYCoordFromBot+1
DoneCheckingHitCeilingBall



	;if the game is over, shove the ball out of the way. Out of site, out of mind, etc.
	lda booleanGameOver 
	beq doneSkippingBallWithGameOver
SkipBallWithGameOver
	lda #240
	sta slowBallYCoordFromBot+1

	;music!
	lda #0
	sta booleanIsOnTitleScreen
	jmp makeminemusic

doneWithMusicInGameScreen




doneSkippingBallWithGameOver








;--------------------------------------
;SET BALL HORIZONTAL POSITION
;--------------------------------------

BallExactPositioning
        sta HMCLR                       ; clear any previous movement 
        sta WSYNC 
        lda ballXposition+1
        tay 
        lsr    ; divide by 2 
        lsr    ; again 
        lsr    ; again 
        lsr    ; again 
        sta tempVar 
        tya 
        and #15 
        clc 
        adc tempVar 
        ldy tempVar 
        cmp #15 
        bcc NoBallHangover
        sbc #15 
        iny 
NoBallHangover
;do fine adjusment
        eor #7 
        asl 
        asl 
        asl 
        asl 
        sta HMM1
        sta WSYNC 
	SLEEP 15
DelayRoughPos  
	dey 
        bpl DelayRoughPos
        sta RESM1
;;;
;;; now, everything roughly positioned,
;;; apply the fine, fine movement...

        sta WSYNC 
        sta HMOVE 
        sta WSYNC 
	CHECKPAGE BallExactPositioning


























;--------------------------------------
;SEE IF PLAYER 0 HIT FLOOR 
;--------------------------------------

	
;check if player 0 hit floor
	lda #FLOOR_HEIGHT_FOR_PLAYERS	;10 is floor
	cmp slowP0YCoordFromBottom+1
	bcc DoneCheckingHitFloorP0
;cut downward speed by half and reverse it for nice rebound effect
;divide by 2, preserving negative
	lda slowP0YSpeed+1   ; HIGH byte!
	cmp #128
	ror slowP0YSpeed+1
	ror slowP0YSpeed    ; LOW byte!
;negate result
	sec
	lda #0
	sbc slowP0YSpeed
	sta slowP0YSpeed
	lda #0
	sbc slowP0YSpeed+1
	sta slowP0YSpeed+1


	lda #FLOOR_HEIGHT_FOR_PLAYERS
	sta slowP0YCoordFromBottom+1 ;putplayer on floor

	lda #%11000000
	sta slowP0YCoordFromBottom ;'sticky floor' fix



DoneCheckingHitFloorP0


;--------------------------------------
;SEE IF PLAYER 1 HIT FLOOR 
;--------------------------------------

;check if player 1 hit floor
	lda #FLOOR_HEIGHT_FOR_PLAYERS	;10 is floor
	cmp slowP1YCoordFromBottom+1
	bcc DoneCheckingHitFloorP1
;cut downward speed by half and reverse it for nice rebound effect
;divide by 2, preserving negative
	lda slowP1YSpeed+1   ; HIGH byte!
	cmp #128
	ror slowP1YSpeed+1
	ror slowP1YSpeed    ; LOW byte!
;negate result
	sec
	lda #0
	sbc slowP1YSpeed
	sta slowP1YSpeed
	lda #0
	sbc slowP1YSpeed+1
	sta slowP1YSpeed+1

	lda #FLOOR_HEIGHT_FOR_PLAYERS
	sta slowP1YCoordFromBottom+1 ;putplayer on floor

	lda #%11000000
	sta slowP1YCoordFromBottom ;'sticky floor' fix


DoneCheckingHitFloorP1




;--------------------------------------
;SEE IF PLAYER 0 HIT CEILING
;--------------------------------------

;check if player 0 hit ceiling - 
	lda #CEILING_HEIGHT 
	cmp slowP0YCoordFromBottom+1
	bcs DoneCheckingHitCeilingP0


	lda #SLOW_REBOUND_HI_BYTE
	sta slowP0YSpeed+1
	lda #SLOW_REBOUND_LO_BYTE
	sta slowP0YSpeed

	lda #CEILING_HEIGHT ;#was 180
	sta slowP0YCoordFromBottom+1

DoneCheckingHitCeilingP0

;--------------------------------------
;SEE IF PLAYER 1 HIT CEILING
;--------------------------------------

;check if player 1 hit ceiling - 
	lda #CEILING_HEIGHT 
	cmp slowP1YCoordFromBottom+1
	bcs DoneCheckingHitCeilingP1


	lda #SLOW_REBOUND_HI_BYTE
	sta slowP1YSpeed+1
	lda #SLOW_REBOUND_LO_BYTE
	sta slowP1YSpeed

	lda #CEILING_HEIGHT ;#was 180
	sta slowP1YCoordFromBottom+1

DoneCheckingHitCeilingP1




;--------------------------------------
;CALCULATE SCORE POINTERS
;--------------------------------------

;Erik Mooney 
;So, let's create a 16-bit value in memory that is the offset to the start
;of your digit.  After you've multiplied A by 5:
;Now we will create a 16-bit pointer in the memory location called
;TempPointer that points to your digit.  That odd-looking LDA means "load
;the high byte of the 16-bit hardcoded value Score0Graphic".  All of this
;you only need to do once, not for every line of the score.  From here it's
;simple:	




	lda p0score ;accumulator = score
	asl ;accumulator = score * 2
	asl ;accumulator = score * 4
	adc p0score  ;accumulator = (score * 4) + score = score * 5
	adc #<Score0Graphic ;add in the low byte of the graphic location
	sta pointerP0Score
;	lda #>Score0Graphic ;grab the hight byte of the graphic location
;	sta pointerP0Score+1


	lda p1score ;accumulator = score
	asl ;accumulator = score * 2
	asl ;accumulator = score * 4
	adc p1score  ;accumulator = (score * 4) + score = score * 5
	adc #<Score0Graphic ;add in the low byte of the graphic location

	sta pointerP1Score
;	lda #>Score0Graphic ;grab the hight byte of the graphic location
;	sta pointerP1Score+1

DoneSeeingIfWeDrawScores





;--------------------------------------
;DIMINISH FLAP SOUND
;--------------------------------------
	lda booleanGameOver
	bne NoFlapSound

	lda flapsoundRemaining
	bmi NoFlapSound
	sta AUDV0 ;volume
	dec flapsoundRemaining
NoFlapSound







	
	ldx #22;;WALL;;
	lda playfieldMatrixLeft,X;;WALL;;
	sta bufferPFLeft;;WALL;;
	lda playfieldMatrixRight,X;;WALL;;
	sta bufferPFRight;;WALL;;






	;lda slowP0YCoordFromBottom+1
	;sta copyIntegerCoordP0

	;lda slowP1YCoordFromBottom+1
	;sta copyIntegerCoordP1






;------------------------------------
;SET COLOR FOR SCORES
;------------------------------------

;score flashing logic:
;(repeat for each player)
;
;(previously: if point just scored then flasher = 15)
;
;set usual color
;if flasher is zero
;   if score is > 8
;        set flasher = 15
;   end if 
;if flasher != 0
;   set to flashing color
;end if
 

 

	lda #P0COLOR
	sta varScoreColorP0

	lda varScoreColorFlasherP0
	bne DoneCheckFlasherP0WarningFlash

;	
		
	dec winningScore
	lda winningScore
	inc winningScore
	
	cmp p0score
	bcs DoneCheckFlasherP0WarningFlash

	lda #15
	sta varScoreColorFlasherP0

DoneCheckFlasherP0WarningFlash
	
	lda varScoreColorFlasherP0
	beq NoP0Flash
	sta varScoreColorP0
	dec varScoreColorFlasherP0
NoP0Flash

 

	lda #P1COLOR
	sta varScoreColorP1

	lda varScoreColorFlasherP1
	bne DoneCheckFlasherP1WarningFlash

	dec winningScore
	lda winningScore
	inc winningScore

	cmp p1score
	bcs DoneCheckFlasherP1WarningFlash

	lda #15
	sta varScoreColorFlasherP1

DoneCheckFlasherP1WarningFlash
	
	lda varScoreColorFlasherP1
	beq NoP1Flash
	sta varScoreColorP1
	dec varScoreColorFlasherP1
NoP1Flash

 
 











;------------------------------------
;PTERRY PTIME!!!
;------------------------------------

;pterry voice...


	lda booleanGameOver
	bne DoneChangingAnyPterryNoise


	lda flagPterryMakeNoise
	beq DoneChangingAnyPterryNoise
	bpl DoneInitializingPterryNoise
	
	lda #1
	sta flagPterryMakeNoise
	
	lda #0
	sta pterryVoiceNoteTimeLeft

	lda #PTERRYVOICE_NOTECOUNT
	sta pterryVoiceNoteCounter
	lda #8 
	sta AUDV1
	lda #7
	sta AUDC1


DoneInitializingPterryNoise

	dec pterryVoiceNoteTimeLeft
	bpl DoneChangingAnyPterryNoise

	dec pterryVoiceNoteCounter
	bpl DoneCheckEndingPterryVoice
	lda #0
	sta flagPterryMakeNoise
	sta AUDV1
	
	lda #4
	sta AUDC1 ;type of sound for pings...

	
	jmp DoneChangingAnyPterryNoise

DoneCheckEndingPterryVoice
	ldy pterryVoiceNoteCounter
	
	lda PterryVoiceLengthData,Y
	sta pterryVoiceNoteTimeLeft
	
	dec pterryVoiceNoteTimeLeft

	lda PterryVoicePitchData,Y 
	sta AUDF1
	jmp DoneChangingAnyPterryNoise

DoneChangingAnyPterryNoise







InitialCounterThingy

;----------snip
	lda varTimeBeforeBallMoves
	
	bmi ItsTimeForPterry
	beq ItsTimeToEndCountDown


	;;;;;;;;;;;;;;;divide by 32 for the count, then multiply by 8 for the offset...	
	;divide (0-2) * 32 by 4 to get 0 -2 * 8, then use AND to hide extraneous bits
	lsr


	tax

	lsr

	and #%11111000




;	lsr 	
;	lsr 	
;	lsr

;	asl

;	asl
;	asl

	clc
	adc #<PterryCount1Graphic ;add in the low byte of the graphic location

	
	sta pointerPterryGraphic

	lda #1
	sta booleanPterryGoesRight

	txa 
	and #%00001111

	ora #%00100001
	sta COLUP1

	jmp DoneMovingPterry


;----------snip


ItsTimeToEndCountDown

	lda #PTERRYCOLOR
	sta COLUP1

	lda #CEILING_HALF - 10
	sta varPterryVerticalPos



;use pseudo randomness for initial left right up down ball speed
	lda varPseudoRandomCounter
	and #%00000001
	sta booleanBallRight ; ball goes right or left...
	

	lda #0
	sta slowBallYSpeed  ;low byte of ball speed is 0
	ldx #1              ;assume high byte is 1
	lda varPseudoRandomCounter 
	and #%00000010 
	beq SetBallInitialSpeed
	ldx #-1  ;change high bte to -1
SetBallInitialSpeed
	stx slowBallYSpeed+1


	



	jmp DoneMovingPterry

ItsTimeForPterry
	;make Pterry's wing flap....
	
	lda counterPterryWingChange

	bne NotTimeToChangePterryWing

	lda #PTERRY_LENGTH_OF_WINGCHANGE 
	sta counterPterryWingChange

	lda booleanPterryWingIsUp
	eor #%11111111
	sta booleanPterryWingIsUp

NotTimeToChangePterryWing
	dec counterPterryWingChange

	;assume 
	lda #<PterryWingDownGraphic 
	sta pointerPterryGraphic

	lda booleanPterryWingIsUp
	beq DoneCheckingPterryWing

	lda #<PterryWingUpGraphic
	sta pointerPterryGraphic

DoneCheckingPterryWing





;see if pterrry is bored flying up or down or level...

;when varPterryBoredCounter counts down to zero, Pterry does something new


	dec varPterryBoredCounter 
	
	bpl doneChangingPterryBehavior
	
	lda #PTERRY_LENGTH_TIL_BOREDOM 
	sta varPterryBoredCounter

	;pterry's bored; change to next behavior
	dec varPterryBehavior
	bne DoneResettingPterryBehavior ;goes 4,3,2,1: of 0, reset to 4
	lda #4
	sta varPterryBehavior



DoneResettingPterryBehavior

doneChangingPterryBehavior


	lda varPterryBehavior
	and #1 ;see if it's odd
	bne doneChangingPterryHeight

	lda varPterryBehavior
	and #2
	
	bne changePterryHeightUp
	dec varPterryVerticalPos
	lda #<PterryWingUpGraphic
	sta pointerPterryGraphic

	jmp doneChangingPterryHeight
changePterryHeightUp
	inc varPterryVerticalPos
	lda #<PterryWingDownGraphic
	sta pointerPterryGraphic


doneChangingPterryHeight

	lda booleanPterryGoesRight
	beq PterryMustBeGoingLeft





PterryMustBeGoingRight
	;lda #%00000000
	;sta REFP1

	inc pterryHorizPosition 

	;clc

	lda #PTERRY_RIGHT_BOUNDARY
	cmp pterryHorizPosition
	bcs DoneNotReboundOffRightBoundary

	lda #0
	sta booleanPterryGoesRight

DoneNotReboundOffRightBoundary	

	jmp DoneMovingPterry




PterryMustBeGoingLeft
	;lda #%00001000
	;sta REFP1

	dec pterryHorizPosition 

	lda #PTERRY_LEFT_BOUNDARY
	cmp pterryHorizPosition
	bcc DoneNotReboundOffLeftBoundary
	
	lda #1
	sta booleanPterryGoesRight

DoneNotReboundOffLeftBoundary


DoneMovingPterry



;booleanPterryWingIsUp ds 1
;counterPterryWingChange ds 1





;----------------------
;precisely position pterry
;------------------------


wastePterryPos	jmp PterryExactPositioning
	align 256

PterryExactPositioning
	echo "---- Pterry Pos alignment wastes",(PterryExactPositioning - wastePterryPos),"bytes"


        sta HMCLR                       ; clear any previous movement 
        sta WSYNC 
        lda pterryHorizPosition
        tay 
        lsr    ; divide by 2 
        lsr    ; again 
        lsr    ; again 
        lsr    ; again 
        sta tempVar 
        tya 
        and #15 
        clc 
        adc tempVar 
        ldy tempVar 
        cmp #15 
        bcc NoPterryHangover
        sbc #15 
        iny 
NoPterryHangover
;do fine adjusment
        eor #7 
        asl 
        asl 
        asl 
        asl 
        sta HMP1
        sta WSYNC 
	SLEEP 15
DelayRoughPosPterry  
	dey 
        bpl DelayRoughPosPterry
        sta RESP1
;;;
;;; now, everything roughly positioned,
;;; apply the fine, fine movement...

        sta WSYNC 
        sta HMOVE 
        sta WSYNC 
	
	CHECKPAGE PterryExactPositioning






	;;!!!freezing player 0 in middle
	;lda #44
	;sta copyIntegerCoordP0



;--------------------------------------
;WAIT FOR VBLANK TO END
;--------------------------------------


WaitForVblankEnd
	lda INTIM	
	bne WaitForVblankEnd	

	sta VBLANK  	
	

	sta GRP0
	sta GRP1
	sta ENAM1






	sta WSYNC	



waste	jmp kernal
	align 256


kernal


;	STA HMOVE 	

	;STA PF0

	


;--------------------------------------
;SCORE DISPLAY KERNAL
;--------------------------------------



	lda #SCOREBKCOLOR
	sta COLUBK	


	ldx #SCORE_KERNAL_LENGTH-1

;!!!was overriding score display

ScoreDisplayLoop
	sta WSYNC
	txa
	and #%00001111
	tay

	;use for msg?
	lda (pointerP0Score),Y; ;data1,y
	sta GRP0		; left player

	lda varScoreColorP0; #P0COLOR
	sta COLUP0

	lda #0
	sta GRP1		; ptery


	sleep 10	


	;use for msg?
	lda (pointerP1Score),Y ; data3,y
	sta GRP0		; right player

	lda varScoreColorP1; #P1COLOR
	sta COLUP0

	sta WSYNC

	lda varScoreColorP0; #P0COLOR
	sta COLUP0

	txa
	and #%00001111
	tay
	;use for msg?
	lda (pointerP0Score),Y; ;data1,y
	sta GRP0		; left player



	sta GRP0		; left player
	lda #0
	sta GRP1		; ptery

	SLEEP 10
	

	;use for msg?
	lda (pointerP1Score),Y; ;data1,y
	sta GRP0		; left player
	
	
	lda varScoreColorP1 ; #P1COLOR
	sta COLUP0

	dex 
	bpl ScoreDisplayLoop	


	sta WSYNC


;
;
;
;	;lda (pointerP0Score),Y
;	lda #%11111111

;	sta GRP0
;	sta WSYNC	
;
;	sleep 50
;
;	;lda (pointerP1Score),Y
;	lda #%10011001

;	sta GRP0
;
;	dey		
;	sta WSYNC
;
;	bne ScoreDisplayLoop	


	
	lda #0
	sta GRP0
	sta GRP1
	
	sta WSYNC

	sta COLUBK	



;--------------------------------------------------
;AFTER SCORE KERNAL
;BEFORE GAME KERNAL
;---------------------------------------------------


	lda booleanPterryGoesRight
	beq ReflectPterryMustBeGoingLeft

ReflectPterryMustBeGoingRight
	lda #%00000000
	sta REFP1
	jmp DoneReflectingPterry

ReflectPterryMustBeGoingLeft
	lda #%00001000
	sta REFP1

DoneReflectingPterry


;	jmp realkernal
;	align 256
;
;
;realkernal

;--------------------------------------
;MAIN GAME KERNAL
;--------------------------------------
	ldy #0  ;clear Y for first GPR1 write

	lda #PFMODE
	sta CTRLPF

	sta WSYNC

	ldx #10                   ;2
kernelDly                    ;49
	dex
	bne kernelDly

	ldx #GAME_KERNAL_LENGTH   ;2
	SLEEP 6
	jmp scanLoop              ;3
	;---------------------------------------------------------------------------


	;-------------------------------------
	; skip draw outside kernal routines

skipDrawLeft         ; 3 from BCC
	lda Zero          ; 2 load for GRP0
	beq continueLeft  ; 3 Return... 

skipDrawRight        ; 3 from BCC
	lda Zero          ; 2 load for GRP0
	beq continueRight ; 3 Return...

skipDrawPtery        ; 3 from BCC
	lda Zero          ; 2 load for GRP0
	beq continuePtery ; 3 Return...

	; --------------- start of main loop
scanLoop:
	; skipDraw routine for left player
	txa                          ; 2 A-> Current scannline
	sec                          ; 2 new
	sbc slowP0YCoordFromBottom+1 ; 3 copyint
	adc #SPRITEHEIGHT+1          ; 2 calc if sprite is drawn

	sty GRP1                     ; 3 Execute Write for ptery here
	ldy #P0COLOR                 ; 2

	; --------------- line 1
;	sta WSYNC                    ; WSYNC *** removed ***
	sty COLUP0                   ; 3
	bcc skipDrawLeft             ; 2/3 To skip or not to skip?
	tay                          ; 2 not necessary when Y holds scannline
	lda (pointerP0Graphic),y     ; 5 Select shape
continueLeft:
	sta GRP0                     ; 3 Execute Write here!
	sta p0DrawBuffer             ; 3 save for next line
	
	lda #0                       ; 2 blank out playfield for this line
	sta PF0                      ; 3 

	; skipDraw routine for right player
	txa                          ; 2 A-> Current scannline
	sec                          ; 2 Clearing instead of setting lines up players
	sbc slowP1YCoordFromBottom+1 ; 3 copyIntegerCoordP1             ; 3 
	adc #SPRITEHEIGHT+1          ; 2 calc if sprite is drawn
	bcc skipDrawRight            ; 2/3 To skip or not to skip?
	tay                          ; 2 not necessary when Y holds scannline
	lda (pointerP1Graphic),y     ; 5 Select shape
continueRight:
	sta GRP0                     ; 3 Execute Write here!

	ldy #P1COLOR                 ; 2
	sty COLUP0                   ; 3

	sta p1DrawBuffer             ; 3 save for next line

	; draw ball
	pla                          ; 4 
	cpx slowBallYCoordFromBot+1           ; 3
	php                          ; 3 

	; set up playfield index
	txa                          ; 2

	sta COLUPF;......3


	lsr                          ; 2



	lsr                          ; 2

	tay                          ; 2
	lda playfieldMatrixLeft,Y    ; 4

	

	nop;2

	nop;2

	; --------------- line 2
					;	sta WSYNC                    ; WSYNC *** removed *** between 2 and 5

;	dec $2D                      ; 5 free cycles

	sta PF0                      ; 3

	; draw left player
	lda p0DrawBuffer             ; 3
	sta GRP0                     ; 3 

	lda #P0COLOR                 ; 2
	sta COLUP0                   ; 3

	sec                          ; 2 for upcoming ptery skipDraw

	; draw right PF
	lda playfieldMatrixRight,Y   ; 4
	sta PF0                      ; 3 


	lda #P1COLOR                 ; 2
	sta COLUP0                   ; 3

	; draw right player
	lda p1DrawBuffer             ; 3 
	sta GRP0                     ; 3

	; skipDraw routine for ptery
	txa                          ; 2 A-> Current scannline
	sbc varPterryVerticalPos     ; 3 
	adc #SPRITEHEIGHT            ; 2 calc if sprite is drawn
	bcc skipDrawPtery            ; 2/3 To skip or not to skip?
	tay                          ; 2 not necessary when Y holds scannline
	lda (pointerPterryGraphic),Y ; 5 Select shape
continuePtery:
	tay                          ; 2

	dex                          ; 2
	bne scanLoop                 ; 3
	; --------------- end of kernel

	stx PF0
	stx ENAM1


	sta WSYNC  	
	lda #SCOREBKCOLOR

	sta COLUBK	
	stx GRP0
	stx GRP1

	sta WSYNC
	sta WSYNC

	lda #2		
	sta WSYNC  	
	sta VBLANK 	
endkernal
	ldx #30		

OverScanWait
	sta WSYNC
	dex


	bne OverScanWait

	
	sta PF0	


	lda #$00
	sta COLUBK	

;	lda SWCHB
;	and #%00000001 ;is game reset?
;	bne ResetWasNotHit 
;	jmp MainGameStart
;ResetWasNotHit


	
	jmp MainLoop      
	
	
	
	
	

;
;MUSIC!
;
makeminemusic
	lda #VOICE_FOR_MUSIC
	sta AUDC0

	lda #VOICE_FOR_BEAT
	sta AUDC1



	dec musicRiffNoteTimeLeft
	bpl DoneWithChangingNote

	dec musicRiffNoteCounter
	bpl DoneCheckResetNoteCounter

	lda #MUSICRIFF_NOTECOUNT-1
	sta musicRiffNoteCounter

DoneCheckResetNoteCounter
	ldy musicRiffNoteCounter

	lda MusicLengthData,Y
	sta musicRiffNoteTimeLeft
	dec musicRiffNoteTimeLeft ;off by one error...

	lda MusicPitchData,Y 

	bmi ZeroOutSound

	sta AUDF0
	lda #12 ;noise
	sta AUDV0 
	jmp DoneSettingPitchAndVolume
ZeroOutSound	
	lda #0	;silence
	sta AUDV0 

DoneSettingPitchAndVolume



DoneWithChangingNote



	dec musicBeatNoteTimeLeft
	bpl DoneWithChangingBeat

	dec musicBeatNoteCounter
	bpl DoneCheckResetBeatCounter

	lda #MUSICBEAT_NOTECOUNT-1
	sta musicBeatNoteCounter

DoneCheckResetBeatCounter
	ldy musicBeatNoteCounter

	lda BeatLengthData,Y
	sta musicBeatNoteTimeLeft

	dec musicBeatNoteTimeLeft ;off by one error...

	lda BeatPitchData,Y 

	bmi ZeroOutBeatSound

	sta AUDF1
	lda #8 ;noise
	sta AUDV1
	jmp DoneSettingBeatPitchAndVolume
ZeroOutBeatSound	
	lda #0 ;silence
	sta AUDV1

DoneSettingBeatPitchAndVolume



DoneWithChangingBeat

	lda booleanIsOnTitleScreen

	beq musicReturnToGame
	jmp doneWithMusicOutOfGame	
musicReturnToGame	
	jmp doneWithMusicInGameScreen

	
 
	org $FE00

;--------------------------------------
;GRAPHICS
;--------------------------------------
GraphicsPage
        .byte #%00000000 ;here to stop page errors




WingUpGraphicLeft
        .byte #%00001100
        .byte #%00001100
        .byte #%10001100
        .byte #%11011100
        .byte #%11111100
        .byte #%01111100
        .byte #%00101100
        .byte #%00001100

        .byte #%00000000  ;here because my skipdraw's a bit off...

WingDownGraphicLeft
        .byte #%00001100
        .byte #%00011100
        .byte #%00111100
        .byte #%01111100
        .byte #%01111100
        .byte #%00111100
        .byte #%00001100
        .byte #%00001100

        .byte #%00000000  ;here because my skipdraw's a bit off...




WingUpGraphicRight
        .byte #%00110000
        .byte #%00110000
        .byte #%00110001
        .byte #%00111011
        .byte #%00111111
        .byte #%00111110
        .byte #%00110100
        .byte #%00110000

        .byte #%00000000  ;here because my skipdraw's a bit off...

WingDownGraphicRight
        .byte #%00110000
        .byte #%00111000
        .byte #%00111100
        .byte #%00111110
        .byte #%00111110
        .byte #%00111100
        .byte #%00110000
        .byte #%00110000



        .byte #%00000000  ;here because my skipdraw's a bit off...



PterryWingUpGraphic
        .byte #%00000000
        .byte #%00000000
        .byte #%01111101
        .byte #%11111110
        .byte #%01110100
        .byte #%00111110
        .byte #%01110001
        .byte #%11100000

        .byte #%00000000  ;here because my skipdraw's a bit off...




PterryWingDownGraphic
        .byte #%11100000
        .byte #%01110000
        .byte #%00111000
        .byte #%01111100
        .byte #%11111111
        .byte #%01110100
        .byte #%00001111
        .byte #%00000000
        .byte #%00000000  ;here because my skipdraw's a bit off...


SimpleFuji
        .byte #%00000000
        .byte #%01011101
        .byte #%01010101
        .byte #%01011101
        .byte #%00000000
        .byte #%01010111
        .byte #%01010101
        .byte #%01010111

        .byte #%00000000
        .byte #%00000000

TeddyGraphic
        .byte #%00000000
        .byte #%00011100
        .byte #%00110110
        .byte #%00111110
        .byte #%00101010
        .byte #%01011101
        .byte #%01100011
        .byte #%00000000
        .byte #%00000000



Score0Graphic
        .byte #%00111100
        .byte #%01000010
        .byte #%01000010
        .byte #%01000010
        .byte #%00111100
Score1Graphic
        .byte #%00111110
        .byte #%00001000
        .byte #%00001000
        .byte #%00101000
        .byte #%00011000
Score2Graphic
        .byte #%01111110
        .byte #%01100000
        .byte #%00011100
        .byte #%01000010
        .byte #%00111100
Score3Graphic
        .byte #%01111100
        .byte #%00000010
        .byte #%00011100
        .byte #%00000010
        .byte #%01111100
Score4Graphic
        .byte #%00000100
        .byte #%00000100
        .byte #%01111110
        .byte #%01000100
        .byte #%01000100
Score5Graphic
        .byte #%01111100
        .byte #%00000010
        .byte #%01111100
        .byte #%01000000
        .byte #%01111110
Score6Graphic
        .byte #%00111100
        .byte #%01000010
        .byte #%01111100
        .byte #%01100000
        .byte #%00011110
Score7Graphic
        .byte #%00010000
        .byte #%00001000
        .byte #%00000100
        .byte #%00000010
        .byte #%01111110
Score8Graphic
        .byte #%00111100
        .byte #%01000010
        .byte #%00111100
        .byte #%01000010
        .byte #%00111100
Score9Graphic
        .byte #%00000010
        .byte #%00000010
        .byte #%00011110
        .byte #%00100010
        .byte #%00011100
ScoreWGraphic
        .byte #%01000100
        .byte #%10101010
        .byte #%10010010
        .byte #%10000010
        .byte #%10000010

ScoreBlankGraphic
        .byte #0
        .byte #0
        .byte #0
        .byte #0
        .byte #0




PterryCount1Graphic
        .byte #%00000000
        .byte #%00111110
        .byte #%00001000
        .byte #%00001000
        .byte #%00001000
        .byte #%00001000
        .byte #%00101000
        .byte #%00011000
PterryCount2Graphic
        .byte #%00000000
        .byte #%01111110
        .byte #%01000000
        .byte #%00100000
        .byte #%00011100
        .byte #%00000010
        .byte #%01000010
        .byte #%00111100
PterryCount3Graphic
        .byte #%00000000
        .byte #%01111100
        .byte #%00000010
        .byte #%00000010
        .byte #%00111100
        .byte #%00000010
        .byte #%00000010
        .byte #%01111100
        .byte #%00000000





















PFDataTitleJoust0Left
        .byte #%00000000
        .byte #%00000000
        .byte #%01100000
        .byte #%11110000
        .byte #%10010000
        .byte #%00010000
        .byte #%00010000
        .byte #%01010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%10010000
        .byte #%10100000
        .byte #%10100000
        .byte #%10100000
        .byte #%10100000
        .byte #%10100000
        .byte #%00100000
        .byte #%01000000
        .byte #%11000000
        .byte #%10000000
        .byte #%00000000

PFDataTitleJoust1Left
        .byte #%00000000
        .byte #%00000000
        .byte #%00000000
        .byte #%01100001
        .byte #%11110001
        .byte #%10011011
        .byte #%10001110
        .byte #%00100110
        .byte #%00100110
        .byte #%00100010
        .byte #%00100000
        .byte #%00100000
        .byte #%00100000
        .byte #%00100110
        .byte #%00110111
        .byte #%00110111
        .byte #%00010111
        .byte #%00010101
        .byte #%11010101
        .byte #%11010111
        .byte #%11010111
        .byte #%11010001
        .byte #%11011001
        .byte #%10011001
        .byte #%10001011
        .byte #%10001011
        .byte #%11001000
        .byte #%11101000
        .byte #%11101000
        .byte #%11100000
        .byte #%01100111
        .byte #%00001111
        .byte #%10001000
        .byte #%11111000
        .byte #%01110000

PFDataTitleJoust2Left
        .byte #%00000000
        .byte #%00000110
        .byte #%00001111
        .byte #%10001001
        .byte #%10001000
        .byte #%10001000
        .byte #%10001010
        .byte #%10001011
        .byte #%10001011
        .byte #%10010011
        .byte #%10010111
        .byte #%10010111
        .byte #%10010110
        .byte #%10010110
        .byte #%10010110
        .byte #%10100110
        .byte #%11100110
        .byte #%11000110
        .byte #%10001110
        .byte #%10011110
        .byte #%00011110
        .byte #%00011010
        .byte #%01011010
        .byte #%11011110
        .byte #%11011110
        .byte #%01011110
        .byte #%01001110
        .byte #%00101100
        .byte #%00100000
        .byte #%00010011
        .byte #%00011111
        .byte #%00001100
        .byte #%00000000
        .byte #%00000000
        .byte #%00000000












PFDataTitleJoust0Right

        .byte #%00100000
        .byte #%01110000
        .byte #%11010000
        .byte #%10010000
        .byte #%00000000
        .byte #%00100000
        .byte #%01100000
        .byte #%01100000
        .byte #%01100000
        .byte #%11100000
        .byte #%11100000
        .byte #%11100000
        .byte #%11100000
        .byte #%11100000
        .byte #%11100000
        .byte #%11000000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11000000
        .byte #%01000000
        .byte #%01000000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%11010000
        .byte #%10010000
        .byte #%00100000
        .byte #%01100000
        .byte #%11000000
        .byte #%10000000
        .byte #%00000000
PFDataTitleJoust1Right
        .byte #%00000000
        .byte #%00000000
        .byte #%00000000
        .byte #%10000000
        .byte #%10000000
        .byte #%11000000
        .byte #%01000000
        .byte #%01000000
        .byte #%01000001
        .byte #%01000001
        .byte #%01101110
        .byte #%01111110
        .byte #%00000000
        .byte #%00000000
        .byte #%00101101
        .byte #%00101101
        .byte #%00101101
        .byte #%00101101
        .byte #%10100111
        .byte #%10110111
        .byte #%10110111
        .byte #%10110111
        .byte #%10110111
        .byte #%10010111
        .byte #%10000111
        .byte #%10000111
        .byte #%10010111
        .byte #%10110111
        .byte #%00110100
        .byte #%00010000
        .byte #%00010001
        .byte #%01000111
        .byte #%11100110
        .byte #%10111100
        .byte #%00010000

PFDataTitleJoust2Right
        .byte #%00001000
        .byte #%00011000
        .byte #%00010100
        .byte #%00100010
        .byte #%00100010
        .byte #%00101001
        .byte #%01001101
        .byte #%01001101
        .byte #%01011100
        .byte #%10011110
        .byte #%10111110
        .byte #%10111111
        .byte #%10111111
        .byte #%10111110
        .byte #%10100000
        .byte #%10100001
        .byte #%10100001
        .byte #%10101101
        .byte #%10111101
        .byte #%10111101
        .byte #%10111101
        .byte #%10110101
        .byte #%10010101
        .byte #%10010101
        .byte #%01011101
        .byte #%01011100
        .byte #%01011100
        .byte #%01011000
        .byte #%01001000
        .byte #%00100011
        .byte #%00100111
        .byte #%00111100
        .byte #%00001000
        .byte #%00000000
        .byte #%00000000




MusicPitchData
	.byte #-1
	.byte #17
	.byte #-1
	.byte #17
	.byte #-1
	.byte #16
	.byte #-1
	.byte #16
	.byte #-1
	.byte #15
	.byte #-1
	.byte #15
	.byte #-1
	.byte #18
	.byte #-1
	.byte #18

MusicLengthData
	.byte #40
	.byte #20
	.byte #10
	.byte #26
	.byte #40
	.byte #20
	.byte #10
	.byte #26
	.byte #40
	.byte #20
	.byte #10
	.byte #26
	.byte #40
	.byte #20
	.byte #10
	.byte #26

PterryVoicePitchData
	.byte #$0F
	.byte #$0E
	.byte #$0D
	.byte #$0C
	.byte #$0B
	.byte #$0A
	.byte #$09
	.byte #$08
	.byte #$07
	.byte #$06

PterryVoiceLengthData

	.byte #6
	.byte #2
	.byte #2
	.byte #2
	.byte #2
	.byte #2
	.byte #2
	.byte #2
	.byte #2
	.byte #16





BeatPitchData
	.byte #-1
	.byte #120
	.byte #-1
	.byte #40
	.byte #-1
	.byte #120
	.byte #-1
	.byte #120
	.byte #-1
	.byte #40
	.byte #-1
	.byte #120
	
BeatLengthData
	.byte #16
	.byte #2
	.byte #4
	.byte #2
	.byte #10
	.byte #2
	.byte #22
	.byte #2
	.byte #10
	.byte #2
	.byte #22
	.byte #2








	org $FFFC
	.word Start
	.word Start





;;assum horiz movement will be zero
;	LDX #$00	
;	LDA #$40	;Left?
;	BIT SWCHA 
;	BNE SkipMoveLeftP0
;	LDX #$10	
;	LDA #%00001000
;	STA REFP0	;show reflected version
;SkipMoveLeftP0
;
;	LDA #$80	;Right?
;	BIT SWCHA 
;	BNE SkipMoveRightP0
;	LDX #$F0	
;	LDA %00000000
;	STA REFP0
;SkipMoveRightP0
;
;	STX HMP0	;set horiz movement for player 0
;
;
;;assum horiz movement will be zero
;	LDX #$00	
;	LDA #$04	;Left?
;	BIT SWCHA 
;	BNE SkipMoveLeftP1
;	LDX #$10	
;	LDA #%00001000
;	STA REFP1
;SkipMoveLeftP1
;
;	LDA #$08	;Right?
;	BIT SWCHA 
;	BNE SkipMoveRightP1
;	LDX #$F0	
;	LDA %00000000
;	STA REFP1
;SkipMoveRightP1
;
;	STX HMP1	;set horiz movement for player 0



;BigHeadGraphic
;	.byte %00111100
;	.byte %01111110
;	.byte %11000001
;	.byte %10111111
;	.byte %11111111
;	.byte %11101011
;	.byte %01111110
;	.byte %00111100

	echo "---- Kernal alignment wastes",(kernal - waste),"bytes"


	if (>kernal != >endkernal)
	  echo "WARNING: Kernel crosses a page boundary!"
	endif




;	lda SWCHB
;	and #%00000001 ;is game reset?
;	bne ResetWasNotHit 
;
;	lda booleanResetWasNOTDownLastFrame
;	beq DoneWithReset
;	
;	lda #0
;	sta booleanResetWasNOTDownLastFrame
;
;	jmp MainGameStart
;ResetWasNotHit
;	sta booleanResetWasNOTDownLastFrame
;DoneWithReset	
	


