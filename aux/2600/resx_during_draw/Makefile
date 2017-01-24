SOURCE = missile.asm missile_hblank.asm missile_hblank_var.asm
BINARIES = $(SOURCE:.asm=.bin)

DASM = dasm
DASM_OPTS = -I.. -f3

all: $(BINARIES)

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)
