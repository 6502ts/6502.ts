SOURCE = rdy.asm
BINARIES = $(SOURCE:.asm=.bin)

DASM = dasm
DASM_OPTS = -f3 -I..

all: $(BINARIES)

%.bin : %.asm
	$(DASM) $< -o$@ $(DASM_OPTS)

clean:
	-rm -f $(BINARIES)

.PHONY: all clean
