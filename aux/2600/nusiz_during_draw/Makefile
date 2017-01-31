SOURCE = \
	player32.asm
BINARIES = $(SOURCE:.asm=.bin)

INCLUDE =

DASM = dasm
DASM_OPTS = -I.. -f3

all: $(BINARIES)

clean:
	-rm *.bin

%.bin : %.asm $(INCLUDE)
	$(DASM) $< -o$@ $(DASM_OPTS)

.PHONY: all clean