# 0.9.14

 * Support for CDFJ banking
 * CommaVideo cartridge support

# 0.9.13

 * New CPU core with one bus access per cycle
 * Support 2 / 4 / ... / 1024 byte ROMs
 * Audio fixes for Safari iOS / MacOS: audio now reliably starts after the first interaction on both platforms

# 0.9.12

 * Stellerator embedded: fix pause via touch controls

# 0.9.11

 * Update dependencies
 * Stellerator embedded: include support for touch controls

# 0.9.10

 * Fix CDF music mode.

# 0.9.9

 * Improvements to playfield collisions during HBLANK. Fixes a glitch in
   Thrust.

# 0.9.8

 * Stellerator: UI fixes for mobile devices
 * Work around audio issues on iOS
 * Implement a poor man's fullscreen mode for iOS devices
 * Restrict HiDPI scaling in order to avoid slowdowns in Chrome
 * Stellerator embedded: reduce default volume to 70%.

# 0.9.7

 * Fix an extreme edge case of late HMOVE followed by another HMOVE. This
   fixes a spurious line at the left side of the screen in panda chase.

# 0.9.6

 * Override maxHeight and maxWidth in fullscreen mode for simpler styling.

# 0.9.5

 * CPU read timing improvements. Fixes edge cases in timer loops.

# 0.9.4

 * Fix the two highest bits in undefined TIA reads

# 0.9.3

 * Stellerator embedded: fix gamepad input

# 0.9.2

No functional changes.

 * NPM metadata update.

# 0.9.1

 * Initial release.
