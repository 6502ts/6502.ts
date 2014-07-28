TSC = tsc -t ES5 --noImplicitAny

SOURCES = Instruction.ts Disassembler.ts hex.ts Debugger.ts \
    SimpleMemory.ts DebuggerFrontend.ts Cpu.ts

TARGET_COMMONJS = $(SOURCES:.ts=.js);

GARBAGE = $(TARGET_COMMONJS)

all: commonjs

commonjs: $(TARGET_COMMONJS)

%.js: %.ts
	if $(TSC) -m commonjs $<; then true; else rm -f $@ ; false; fi

clean:
	-rm -f $(GARBAGE)

.PHONY: all clean commonjs
