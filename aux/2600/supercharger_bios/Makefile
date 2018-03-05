SOURCE = bios.asm
BINARIES = $(SOURCE:.asm=.bin)

INCLUDE =

DASM = dasm
DASM_OPTS = -f3

all: $(BINARIES)

clean:
	-rm *.bin

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)

.PHONY: all clean
