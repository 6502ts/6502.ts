SOURCE = enam_delay.asm enabl_delay.asm
BINARIES = $(SOURCE:.asm=.bin)

DASM = dasm
DASM_OPTS = -I.. -f3

all: $(BINARIES)

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)
