# 1.0.0-beta.3

 * Fix keyboard navigation order

# 1.0.0-beta.2

 * Minor bug fixes, UI improvements and optimizations in Stellerator
 * Reenable forgotten paddle driver. Ups. Paddles work again
 * Reenable stellerator-embedded in build system
 * Change license back to MIT
 * Remove "curtain" screen when loading supercharger loads in order to steer
   100% clear of potential GPL vs. MIT issues

# 1.0.0-beta.1

 * Stellerator frontend rewritten in Elm
 * Replace deprecated cache manifest for Stellerator with service worker
 * Build system replaced with yarn scripts + Rollup
 * Support for the Pink Panther prototype banking scheme
 * Workaround for startup issues in Activison Decathlon
 * Stellerator-embedded and debug frontends temporarily removed from build
 * Travis deployment temporarily disabled

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
