# What is it?

6502.ts is an emulator for the MOS 6502 CPU written in TypeScript. As emulating
a CPU is a bit boring as of itself, I plan on extending the code to emulate an
Atari 2600 console. Other 6502 based systems like the C64 are also possible.

At the moment, the emulator contains minimal hardware support for running
the
[EhBasic interpreter](https://github.com/jefftranter/6502/tree/master/asm/ehbasic).
The compiled binary taken from this nice stack overflow
[code challenge](http://codegolf.stackexchange.com/questions/12844/emulate-a-mos-6502-cpu)
is included and can be loaded, run and debugged to your hearts content in an
interactive nodejs command line interface (see below).


## Why?

There are many 6502 emulators out there, and even one written in Typescript.
So, why the effort? 

 * Exploring how coding in typescript feels and whether it adds value for me
   over plain javascript.
 * Getting a better feeling for performance in javascript. Emulating a CPU,
   even an ancient one, is hard on the host CPU and a nice playground for
   exploring the performance that can be achieved with recent JS engines. I
   also hope for insights into the performance behavior of different JS
   constructs.
 * Fun and challenge :)

# Implementation state

## Emulation accuracy

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

## Debugger and disassembler

The code also contains a disassembler and a debugger which supports stepping,
break points, state and memory inspection and execution tracing.

## Hardware emulation and frontends

The emulator implements the minimal hardware interface support required for
running the EhBasic interpreter --- writes to 0xFF01 print to stdout, and input
is read from 0xFF04.

## Speed

Using node 0.11.13, the emulated CPU runs at about
13 - 18 MHz on my 1.8 GHz ARM chromebook, depending on the code executed
(polling for input is obviously faster than number crunching). On my 2.7 GHz
core-i7 laptop, the top speed is about 60 MHz.

I have some ideas on speeding up the emulation. In particular, V8 seems to
translate switch blocks into linear searches rather than jump tables (as I had
originally thought), so performance might be gained from switching to a
dispatch table rather that the current switch blocks. However, I am already
now quite satisfied with the emulation speed :)

I don't yet have numbers for engines other than V8.

**IMPORTANT** There is a huge perfomance gap between node 0.10.x and 0.11.x
--- 0.11.x is fast by a factor of almost two!

# How to use it

## Compilation

After checking out the repo, doing

    npm install
    grunt initial

will pull in the dependencies and build the code. Make sure that you have
`grunt-cli` installed and available in your path beforehand.

## Usage

After bulding the code, you can launch an ehBasic session by doing

    node ./ehBasicMonitor.js eh_basic.d

which will present you with

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

The first argument of `ehBasicMonitor.js` is an optional script containing
debugger statements, so you can take a further look there. There is tab
completion, so pressing tab at the debug prompt will show you all possible
commands. `quit` will quit the emulator.

If you want to play with ehBasic a bit more, you can pass a basic program as
second argument which will then be preloaded into the input buffer

```
$ node ./ehBasicMonitor.js ehbasic_run.d  test.bas

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

There is also a simpler debugging frontend `debugger.js` which does not
emulate any hardware besides the CPU itself

# License

You are free to use, modify and redistribute this code under the conditions
of the MIT license --- see `LICENSE` for details.
