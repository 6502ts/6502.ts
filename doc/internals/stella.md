# Stella implementation internals

## Cartridge / bankswitching types

If marked with *stella*, the names refer to Stella source code. Otherwise,
the names refer to Kevin Hortons bankswitching [guide](http://blog.kevtris.org/blogfiles/Atari%202600%20Mappers.txt).
Supported:

 * 2k plain
 * 4k plain
 * F8 (Atari 8k)
 * F6 (Atari 16k, optional SARA)
 * FE (Activision 8k)
 * E0 (Parker Bros.)
 * 3F (Tigervision)
 * FA (CBS)
 * E7 (M-Net 16k)
 * F0 (Megaboy)
 * UA (UA 8k)
 * F4 (Atari 32k)
 * *Stella* FA2
 * DPC (Pitfall 2)
 * Supercharger
 * 3E
 * *Stella* DPC+

DPC+ includes support for ARM code (using a transpiled version of D. Welch's
[thumbulator](https://github.com/dwelch67/thumbulator)).

Currently not implemented

 * CV (Commavid)
 * F8 with SARA
 * 3F enhanced
 * 0840
 * MC (Megacart)
 * EF
 * X07
 * 4A50
 * Compumate
 * *Stella* 4KSK 4k + extra RAM
 * *Stella* DASH
 * *Stella* DF (Homestar Runner)
 * *Stella* DFSC (Homestar Runner)
 * *Stella* EF (Homestar Runner)
 * *Stella* EFSC (Homestar Runner)
 * *Stella* SB (Superbanking)

