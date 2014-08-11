TSC = tsc -t ES5 --noImplicitAny
MOCHA = ./node_modules/.bin/mocha

SOURCES = debugger.ts ehBasicMonitor.ts

TARGET_COMMONJS = $(SOURCES:.ts=.js);

GARBAGE = $(TARGET_COMMONJS)

SUBDIRS = src
make_subdirs = +for dir in $(SUBDIRS); do $(MAKE) -C $$dir $(1); done

all: commonjs
	$(call make_subdirs,all)

tests: all
	$(MOCHA) -u tdd -R spec tests/

commonjs: $(TARGET_COMMONJS)
	$(call make_subdirs,commonjs)

%.js: %.ts
	if $(TSC) -m commonjs $<; then true; else rm -f $@ ; false; fi

clean:
	-rm -f $(GARBAGE)
	$(call make_subdirs, clean)

.PHONY: all clean commonjs tests
