# Stella implementation internals

## Supported CARTRIDGE TYPES

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
 * FA2
 * EF
 * DPC (Pitfall 2)
 * Supercharger
 * 3E
 * EF / EF SC
 * DPC+
 * CDF
 * 8040 / econobanking

DPC+ and CDF include support for ARM code (using a transpiled version of D. Welch's
[thumbulator](https://github.com/dwelch67/thumbulator)).
