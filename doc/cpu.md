# Emulation completeness and accuracy

## Instructions

Cycle precise emulation of all official opcodes is complete; unsupported opcodes
are a work in progress.

## Memory access patterns

Memory access patterns are not reproduced accurately. In particular, multiple writes
and reads may happen during instruction decode and opcode execution. "Blind"
accesses are emulated correctly in many cases (currently not for read-write-modify)
in order to properly emulate undefined hardware access on the VCS.

## Interrupts

Interrupts are fully implemented. RDY halts the CPU during all cycles (the silicon
does so only during read cycles).

## Tests

The CPU emulation passes Klaus Dormann's
[6502 testsuite](https://github.com/Klaus2m5/6502_65C02_functional_tests). You can
find the binary and source configured to run in the EhBasic monitor in `aux/6502_suite`.

## Performance

Simple CPU emulation without any nontrivial hardware achieves speeds up to 80MHz in V8 on
modern hardware.
