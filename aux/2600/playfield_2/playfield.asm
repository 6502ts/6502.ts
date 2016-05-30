; '2600 for Newbies
; Session 15 - Playfield Continued
; This kernel draws a simple box around the screen border
; Introduces playfield reflection 





                processor 6502

                include "vcs.h"

;                include "macro.h"


;------------------------------------------------------------------------------



                SEG

                ORG $F000



Reset



   ; Clear RAM and all TIA registers



                ldx #0 

                lda #0 

Clear           sta 0,x 

                inx 

                bne Clear



       ;------------------------------------------------

       ; Once-only initialisation...



                lda #$45

                sta COLUPF             ; set the playfield colour



                lda #%00000001

                sta CTRLPF             ; reflect playfield



       ;------------------------------------------------



StartOfFrame



   ; Start of new frame

   ; Start of vertical blank processing



                lda #0

                sta VBLANK



                lda #2

                sta VSYNC



                sta WSYNC

                sta WSYNC

                sta WSYNC               ; 3 scanlines of VSYNC signal



                lda #0

                sta VSYNC

                

       ;------------------------------------------------

       ; 37 scanlines of vertical blank...

            

                ldx #0

VerticalBlank   sta WSYNC

                inx

                cpx #37

                bne VerticalBlank



       ;------------------------------------------------

       ; Do 192 scanlines of colour-changing (our picture)



                ldx #0                 ; this counts our scanline number



                lda #%11111111

                sta PF0

                sta PF1

                sta PF2



                   ; We won't bother rewriting PF0-PF2 every scanline of the top 8 lines - they never change!



Top8Lines       sta WSYNC

                inx

                cpx #8                 ; are we at line 8?

                bne Top8Lines          ; No, so do another



                   ; Now we want 176 lines of "wall"

                   ; Note: 176 (middle) + 8 (top) + 8 (bottom) = 192 lines



                lda #%00010000         ; PF0 is mirrored <--- direction, low 4 bits ignored

                sta PF0

                lda #0

                sta PF1

                sta PF2



                   ; again, we don't bother writing PF0-PF2 every scanline - they never change!





MiddleLines     sta WSYNC

                inx

                cpx #184

                bne MiddleLines



                   ; Finally, our bottom 8 scanlines - the same as the top 8

                   ; AGAIN, we aren't going to bother writing PF0-PF2 mid scanline!



                lda #%11111111

                sta PF0

                sta PF1

                sta PF2



Bottom8Lines    sta WSYNC

                inx

                cpx #192

                bne Bottom8Lines



       ;------------------------------------------------



 

                lda #%01000010

                sta VBLANK          ; end of screen - enter blanking



   ; 30 scanlines of overscan...



                ldx #0

Overscan        sta WSYNC

                inx

                cpx #30

                bne Overscan



                jmp StartOfFrame




;------------------------------------------------------------------------------



            ORG $FFFA



InterruptVectors



            .word Reset          ; NMI

            .word Reset          ; RESET

            .word Reset          ; IRQ



      END
