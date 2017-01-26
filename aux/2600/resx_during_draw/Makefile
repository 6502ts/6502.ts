SOURCE = \
	missile.asm \
	missile_hblank.asm \
	missile_hblank_var.asm \
	missile_late_hblank_51.asm \
	missile_late_hblank_60.asm \
	missile_late_hblank_63.asm \
	missile_late_hblank_66.asm \
	missile_late_hblank_69.asm \
	missile_late_hblank_72.asm \
	missile_late_hblank_75.asm
BINARIES = $(SOURCE:.asm=.bin)

DASM = dasm
DASM_OPTS = -I.. -f3

all: $(BINARIES)

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)
