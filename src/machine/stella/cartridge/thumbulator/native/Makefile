SOURCE = thumbulator.c
OUT = $(SOURCE:.c=.js)

EMCC = emcc
EMCC_OPTS = -O3 --memory-init-file 0 \
	-s ASSERTIONS=0 \
	-s TOTAL_STACK=10240 \
	-s TOTAL_MEMORY=1048576 \
	-s EXPORTED_FUNCTIONS="['_run', '_enable_debug', '_read_register', '_write_register', '_reset']" \
	-s MODULARIZE=1 \
	--closure 0

all: $(OUT)

$(OUT): $(SOURCE)
	$(EMCC) $(EMCC_OPTS) -o $@ $<
	echo "module.exports = Module;" >> $(OUT)

clean:
	-rm -f $(OUT)

.PHONY: clean all