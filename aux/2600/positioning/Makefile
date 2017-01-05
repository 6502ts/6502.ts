SOURCE = player.asm missile.asm ball.asm player_2x.asm player_4x.asm player_switching.asm
INCLUDE = main.inc
BINARIES = $(SOURCE:.asm=.bin)

DASM = dasm
DASM_OPTS = -f3

all: $(BINARIES)

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)
