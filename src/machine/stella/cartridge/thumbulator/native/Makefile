SOURCE = thumbulator.c
OUT = $(SOURCE:.c=.js)

EMCC = emcc
EMCC_OPTS = -O3 --memory-init-file 0 \
	-s ASSERTIONS=0 \
	-s TOTAL_STACK=10240 \
	-s TOTAL_MEMORY=16777216 \
	-s EXPORTED_FUNCTIONS="['_run', '_enable_debug', '_read_register', '_write_register', '_reset', '_abort_run']" \
	-s MODULARIZE=1 \
	-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
	-s OUTLINING_LIMIT=20000 \
	-s INVOKE_RUN=0 \
	-s NO_EXIT_RUNTIME=1 \
	--closure 0

all: $(OUT)

$(OUT): $(SOURCE) Makefile
	$(EMCC) $(EMCC_OPTS) -o $@ $<
	echo "module.exports = Module;" >> $(OUT)

clean:
	-rm -f $(OUT)

.PHONY: clean all
