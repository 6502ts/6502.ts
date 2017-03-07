SOURCE = \
	player32.asm \
	player16.asm \
	player8.asm \
	player32_8.asm \
	player32_hblank.asm
BINARIES = $(SOURCE:.asm=.bin)

INCLUDE = main.inc main_hblank.inc

DASM = dasm
DASM_OPTS = -I.. -f3

all: $(BINARIES)

clean:
	-rm *.bin

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)

.PHONY: all clean