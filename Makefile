TSC = tsc -t ES5 --noImplicitAny

SOURCES = debugger.ts

TARGET_COMMONJS = $(SOURCES:.ts=.js);

GARBAGE = $(TARGET_COMMONJS)

SUBDIRS = src
make_subdirs = +for dir in $(SUBDIRS); do $(MAKE) -C $$dir $(1); done

all: commonjs
	$(call make_subdirs,all)

commonjs: $(TARGET_COMMONJS)
	$(call make_subdirs,commonjs)

%.js: %.ts
	if $(TSC) -m commonjs $<; then true; else rm -f $@ ; false; fi

clean:
	-rm -f $(GARBAGE)
	$(call make_subdirs, clean)

.PHONY: all clean commonjs
