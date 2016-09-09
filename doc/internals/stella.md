# Stella implementation internals

## Cartridge / bankswitching types

If marked with *stella*, the names refer to Stella source code. Otherwise,
the names refer to Kevin Hortons bankswitching [guide](http://blog.kevtris.org/blogfiles/Atari%202600%20Mappers.txt)
.
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

Currently not implemented

 * CV (Commavid)
 * F4 (Atari 32k)
 * F8 with SARA
 * DPC (Pitfall 2)
 * Supercharger
 * 3F enhanced
 * 3E
 * 0840
 * MC (Megacart)
 * EF
 * X07
 * 4A50
 * Compumate
 * *Stella* 4KSK 4k + extra RAM
 * *Stella* DASH
 * *Stella* DPC+
 * *Stella* DF (Homestar Runner)
 * *Stella* DFSC (Homestar Runner)
 * *Stella* EF (Homestar Runner)
 * *Stella* EFSC (Homestar Runner)
 * *Stella* FA2
 * *Stella* SB (Superbanking)


 * Anything ARM :)
