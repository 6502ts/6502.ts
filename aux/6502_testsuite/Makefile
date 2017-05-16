AS65 = as65

SOURCE = 6502_interrupt_test.a65 6502_functional_test.a65
OUTPUT = $(SOURCE:.a65=.bin)

all: $(OUTPUT)

%.bin: %.a65
	$(AS65) -w -h0 -l -o$@ $<

clean:
	-rm -f $(OUTPUT) *lst

.PHONY: all clean