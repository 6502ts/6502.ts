# What is it?

6502.ts is an emulator for MOS 6502 based systems written in Typescript. The current state
of affairs:

 * Cycle exact CPU emulation is complete (with the exception of interrupt handling)
 * A minimal serial I/O implementation for running the
   [EhBasic interpreter](https://github.com/jefftranter/6502/tree/master/asm/ehbasic).
   The compiled binary was taken from this nice stack overflow
   [code challenge](http://codegolf.stackexchange.com/questions/12844/emulate-a-mos-6502-cpu)
   and is included
 * Emulation for the Atari 2600 is a work in progress. Parts of PIA and TIA are
   implemented, and the example code in `aux/2600` works. Just don't expect
   to play any games just yet.
 * There's a debug shell with supports disassbling, memory and hardware state inspection,
   breakpoints and execution tracing
 * Frontends exist both for node and the browser (you won't get any graphics on node though ;) )

## Why?

There are many 6502 emulators out there, and even one written in Typescript.
So, why the effort?

 * Exploring how coding in typescript feels and whether it adds value for me
   over plain javascript.
 * Getting a better feeling for performance in javascript. Emulating a CPU and connected hardware,
   even an ancient one, is hard on the host CPU and a nice playground for
   exploring the performance that can be achieved with recent JS engines. I
   also hope for insights into the performance behavior of different JS
   constructs.
 * Fun and challenge :)

# Implementation state

## CPU

### Emulation accuracy

The CPU implementation is almost complete, the only thing still missing is
interrupt handling --- the interrupt lines are currently ignored, and BRK
and RTI are treated as invalid instructions.

The emulation properly emulates the cycle count of each instruction and aims
to exactly reproduce the documented behavior of the original MOS CPU, including
quirks like the wraparound of indirect JMPs at page boundaries. However, the
memory access patterns of the original are not exactly reproduced. All memory
accesses happen either during the first or during the last cycle of an
instruction --- in particular, there are usually multiple accesses during a
single cycle, while the silicon version does a single access each cycle.

In addition, there is currently no implementation of undocumented instructions,
and the behavior of ADC and SBC in BCD mode differs from the original for
inputs that are not valid BCD numbers. Oh, and of course there might be bugs :)

## Hardware

### Minimal serial IO / EhBasic

The emulator implements the minimal hardware interface support required for
running the EhBasic interpreter --- writes to 0xFF01 print to stdout, and input
is read from 0xFF04. The interpreter runs and is fully functional.

### Atari 2600

2600 emulation is mostly finished. Almost all games published for the VCS work
perfectly, including audio. Please see the 2600 section below for more details.

## Tooling

### Debugger and disassembler

The code contains a disassembler and a debugger which supports stepping,
break points, state and memory inspection and execution tracing. All currently
implemented frontends (including web) host a debugger console.

# Speed

## CPU

On my 2.7 GHz core-i7 laptop, the EhBasic interpreter reaches top speeds of
about 80 MHz with current V8 versions (Chrome & Node). Ionmonkey / Firefox are slower
by about 40%. Chrome Mobile on my Nexus 6P scores about 20 MHz.

## Atari 2600

On my laptop, most games run at about 13 MHz in Chrome (about 8 MHz in Frefox) when the
speed limit is removed. With speed limiting, a nice and steady speed of ~ 3.8 MHz / 60 FPS is
achieved.

# How to use it

## Compilation

After checking out the repo, doing

    npm install
    grunt initial

will pull in the dependencies and build the code. Make sure that you have
`grunt-cli` installed and available in your path beforehand.

## Usage

### Web

You can launch a simple web server by doing `grunt serve`. The frontends are then served on
`localhost:6502`. During the build process, the contents of the `aux` directory are
packaged into the build, and [JQuery Terminal](http://terminal.jcubic.pl/) is used
to provide a full CLI, including tab completion and search.

### EhBasic

After bulding the code, you can launch an ehBasic session by doing

    node ./bin/ehBasicCLI.js aux/ehbasic/run.d

Alternatively, you can access the web CLI on (http://localhost:6502) where you can
launch the session by doing `run-script ehbasic/run.d`. A current build is also
available online [here](https://www.cspeckner.de/6502.ts/web).

After launch you will be presented with

```
successfully loaded 16384 bytes at $C000
Boot successful in 7 cycles
running, press ctl-c to interrupt...

6502 EhBASIC [C]old/[W]arm ?

Memory size ?

40191 Bytes free

Enhanced BASIC 2.22

Ready

[run] #
```

All input you enter at the `[run] #` prompt is sent to the emulator input buffer.

```
[run] # PRINT "Hello world"
PRINT "Hello world"
Hello world

Ready

17.81 MHz [run] #
```

The BASIC interpreter will print all input on stdout, so all input you
type will be repeated. Pressing ctrl-c will stop the emulation and enter the
debugger, from where you can execute debugger commands

```
17.71 MHz [dbg] # state
A = $00   X = $00   Y = $02   S = $FB   P = $E0EA
flags = 0b00000110
17.71 MHz [dbg] # disassemble 10
    $E0EA:   JMP ($0205)
    $E0ED:   JMP ($0207)
    $E0F0:   JMP ($0209)
    $E0F3:   JMP ($020B)
17.71 MHz [dbg] # disassemble 0xFF80 10
    $FF80:   CLD
    $FF81:   LDX #$FF
    $FF83:   TXS
    $FF84:   LDY #$1C
    $FF86:   LDA $FFBB,Y
    $FF89:   STA $0204,Y
17.71 MHz [dbg] # dump 0x01FA 6
$01FA:   $0C
$01FB:   $C9
$01FC:   $51
$01FD:   $C2
$01FE:   $69
$01FF:   $C1
17.73 MHz [dbg] # step 10
Used 44 cycles in 0 milliseconds, now at
    $E0EA:   JMP ($0205)
17.71 MHz [dbg] # run
running, press ctl-c to interrupt...
[run] #
```

The handling prompt vs. output is a bit glitchy, so you might end up with
emulator output overwriting the prompt, but pressing enter will redisplay it,
and everything you type will be sent to the input buffer nevertheless.

The first argument of `ehBasicCLI.js` is an optional script containing
debugger statements, so you can take a further look there. There is tab
completion, so pressing tab at the debug prompt will show you all possible
commands. `quit` will quit the emulator.

If you want to play with ehBasic a bit more, you can pass a basic program as
second argument which will then be preloaded into the input buffer

```
$ node ./ehBasicCLI.js ehbasic_run.d  test.bas

successfully loaded 16384 bytes at $C000
Boot successful in 7 cycles
running, press ctl-c to interrupt...

6502 EhBASIC [C]old/[W]arm ?

Memory size ?

40191 Bytes free

Enhanced BASIC 2.22

Ready
10  FOR J = 1 TO 20
20  POT = 1
30  TERM = 1
40  FOR I = 1 TO 1000
45      TERM = TERM * J / I
50      POT = POT + TERM
60  NEXT I
70  PRINT "e ^ ";
80  PRINT J;
90  PRINT " = ";
100 PRINT POT
110 NEXT J


[run] # RUN
RUN

15.65 MHz [run] # e ^  1 =  2.71828
e ^  2 =  7.38906
e ^  3 =  20.0855
e ^  4 =  54.5981
e ^  5 =  148.413
e ^  6 =  403.429
e ^  7 =  1096.63
e ^  8 =  2980.96
...
```

### Atari 2600

2600 emulation is almost complete, and most original games work flawlessly. Most of the remaining
issues fall into these categories:

 * Minor horizontal positioning issues in a handful of games
 * Undocumented opcodes --- none are implemented yet
 * Homebrew bankswitching schemes are not implemented yet.

#### Running

You can access the emulation console on (http://localhost:6502/stella.html) or
[here](https://www.cspeckner.de/6502.ts/web/stella.html). The CLI has three different
modes: setup, debug and run. Tab completion is available in all three modes

After loading the page, the emulator starts in setup mode and waits for you to load a cartridge.
You can either load a local ROM image using the corresponding button or load one of the packaged
images with `load-cartridge path/to/image` (see below for a list of included images).

Before loading the cartridge, you can configure audio with `audio on|off` and set the
TV mode with `tv-mode pal|ntsc|secam`  (default is PAL). The cartridge type will be
autodetected. You can also pass these options via the `audio` and `tvmode` get parameters.

After loading the cartridge, the CLI enters debug mode. You now can use debugger
commands to step and inspect the harware state. There is no documentation yet for
the commands, but tab completion and the EhBasic example above should be enough get you going.

By doing `run` you can start running the emulation continously. The CLI is now in run
mode, and the debugger commands are replaced by commands to remove / restore the
frame rate limit and to stop the emulation &mdash; use tab completion to see them.
Upon stopping the emulation, the CLI returns to the debugger state.

#### Controls

The joystick keyboard controls are explained on screen. The left paddle is emulated using
the mouse. For controlling the switches, the `switch-color bw|color` and
`switch-difficulty-player-[01] a|b|amateur|pro` commands are available. Pressing
enter will toggle fullscreen mode (unfortunately, Firefox will not honour aspect ratio on fullscreen).
**The canvas needs to be focused (clicked) for keyboard controls to work**

#### Included ROM images

 * `2600/red_line/image.bin`: A test program taken from a 2600 tutorial by Kirk
   Israel available [here](http://www.atariage.com/2600/programming/2600_101/03first.html).
   This demo uses the player 0 missile graphics to display a moving vertical red line.
 * `2600/line_test/image.bin`: An extended version of the red line example that excercises
   more aspects of missile graphics.
 * `2600/playfield_1/image.bin`: A asymmetrical playfield example by Kirk Israel from
   his [2600 cookbook](http://alienbill.com/2600/cookbook/playfield.html).
 * `2600/playfield_2/image.bin`: A playfield example from Andrew Davie's programming
   excercises on [AtariAge](http://atariage.com/forums/topic/28219-session-15-playfield-continued/).
 * `2600/playfield_4/image.bin`: Another playfield test that features a moving missile.
 * `2600/flapping/flapping.bin`: [FlapPing](http://localhost:6502/web/) by Kirk Isreal.
   Not a demo, but an original homebrew pong-like game with flaps :) Some things work,
   but not playable on 6502.ts just yet.

# License

You are free to use, modify and redistribute this code under the conditions
of the MIT license --- see `LICENSE` for details.

These license conditions do not apply to the contents of the `aux` directory which
mostly were written by folks other than me. Specifically:

 * `ehBasic` was taken from Jeff Tranters repository
   [here](https://github.com/jefftranter/6502/tree/master/asm/ehbasic)
 * The `red_line` sample was taken from Kirk Israel's 2600 programming tutorial on
   [AtariAge](http://www.atariage.com/2600/programming/2600_101/03first.html). The
   `line_test` is a modified version of this code.
 * The `playfield_1` sample was taken from Kirk Israel's [2600 cookbook](http://alienbill.com/2600/cookbook/playfield.html).
 * `playfield_2` was taken from Andrew Davie's 2600 programming excercises on
   [AtariAge](http://atariage.com/forums/topic/28219-session-15-playfield-continued/).
 * The `macro.h` and `vcs.h` headers can be found free-floating on the internet
 * `flapping` is a homebrew game written by Kirk Israel available
   [here](http://alienbill.com/2600/flapping/).

The 2600 cartridge type detection code was modelled after the excellent
[stella](http://stella.sourceforge.net/) emulator.
