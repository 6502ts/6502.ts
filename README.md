# What is it?

**DOCUMENTATION is being rewritten, the old docs are availabe [here](README.old.md)**

6502.ts strives to be a collection of emulators for 6502 based systems written in Typescript.
It currently provides

 * A cycle-exact [CPU emulator](doc/cpu.md) and a generic [debugging environment](doc/vanilla_debugger.md)
   any attached hardware.
 * A minimal [hardware monitor](doc/ehbasic_monitor.md) for executing the
   [EhBasic interpreter](https://github.com/jefftranter/6502/tree/master/asm/ehbasic)
   and Klaus Dormann's
   [6502 testsuite](https://github.com/Klaus2m5/6502_65C02_functional_tests)
 * A full-featured [Atari 2600 emulator](doc/stella.md), including sound, CRT afterglow simulation,
   debugging environment and a more user oriented ["stellerator" frontend](doc/stellerator.md).

The projects targets both NodeJS and the browser as runtime environments (no video or audio on node,
of course).

# Pre-build applications

You can find recent builds of the various applications on the project's github.io page.

 * [vanilla debugger](https://6502ts.github.io/dev/debugger.html)
 * [hardware monitor frontend / debugger](https://6502ts.github.io/dev/)
 * [Atari 2600 debugger frontend](https://6502ts.github.io/dev/stella.html)
 * [Atari 2600 stellerator, development build](https://6502ts.github.io/dev/stellerator.html)
 * [Atari 2600 stellerator, production build](https://6502ts.github.io/stellerator)

# Building and development

After checking out the repos, doing

    npm install
    grunt initial

will initialize the development environment. You can then do a development build of all
apps with a simple `grunt`. Production versions can be build with `grunt build` (currently
only stellerator). `grunt test` will run the testsuite. A web server can be fired up with
`grunt serve`.

After building, additional NodeJS applications for commandline debugging can be found in
`bin`.

Please check the `Gruntfile.js` for more build targets.

# License and credits

You are free to use, modify and redistribute this code under the conditions
of the MIT license --- see `LICENSE` for details.

These license conditions do not apply to the contents of the `aux` directory which
mostly were written by folks other than me. Specifically:

 * `ehBasic` was taken from Jeff Tranters repository
   [here](https://github.com/jefftranter/6502/tree/master/asm/ehbasic)
 * Klaus Dormann's 6502 testsuite (found in `aux/6502_suite`) was taken from his
   repository on github [here](https://github.com/Klaus2m5/6502_65C02_functional_tests)
   and is licensed under the GPL.
 * The `red_line` sample was taken from Kirk Israel's 2600 programming tutorial on
   [AtariAge](http://www.atariage.com/2600/programming/2600_101/03first.html). The
   `line_test` is a modified version of this code.
 * The `playfield_1` sample was taken from Kirk Israel's [2600 cookbook](http://alienbill.com/2600/cookbook/playfield.html).
 * `playfield_2` was taken from Andrew Davie's 2600 programming excercises on
   [AtariAge](http://atariage.com/forums/topic/28219-session-15-playfield-continued/).
 * The `macro.h` and `vcs.h` headers can be found free-floating on the internet
 * `flapping` is a homebrew game written by Kirk Israel available
   [here](http://alienbill.com/2600/flapping/).

2600 cartridge type detection coe (and some of the more exotic cartridge types)
were modelled after the excellent [stella](http://stella.sourceforge.net/) emulator.
Initial 2600 audio code was contributed by Martin Schröder.
