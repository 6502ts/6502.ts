SOURCE = \
	missile.asm \
	missile_hblank.asm \
	missile_late_hblank_66.asm \
	missile_late_hblank_69.asm \
	missile_late_hblank_72.asm \
	missile_late_hblank_75.asm
BINARIES = $(SOURCE:.asm=.bin)

INCLUDE = main.inc missile_late_hblank.inc

DASM = dasm
DASM_OPTS = -I.. -f3

all: $(BINARIES)

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)
