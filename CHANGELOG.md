# 1.0.0-beta.7

## Stellerator

 * Re-add the possibility to save ROMs (currently defunct on iOS)
 * Performance improvements in ARM games

## Stellerator-embedded

 * Allow to run without canvas
 * Allow to change canvas element at runtime
 * Add data tap for sending data from 6507 code to the host

# 1.0.0-beta.6

## Stellerator

 * Move version, changelog and license to dedicated "About" page
 * Don't show update notice on first start

# 1.0.0-beta.5

## Stellerator

 * Styling fixes on help page.

# 1.0.0-beta.4

## Stellerator

 * Release keyboard and mouse on leaving emulation view -> fixes nonfunctional
   keys after starting emulation
 * Add changelog to help page
 * Offer changelog after update

# 1.0.0-beta.3

## Stellerator

 * Fix keyboard navigation order

# 1.0.0-beta.2

## Stellerator

 * Minor bug fixes, UI improvements and optimizations in Stellerator
 * Reenable forgotten paddle driver. Ups. Paddles work again

## Stellerator-embedded

 * Reenable stellerator-embedded in build system

## All

 * Change license back to MIT
 * Remove "curtain" screen when loading supercharger loads in order to steer
   100% clear of potential GPL vs. MIT issues

# 1.0.0-beta.1

## Stellerator

 * Stellerator frontend rewritten in Elm
 * Replace deprecated cache manifest for Stellerator with service worker

## All

 * Build system replaced with yarn scripts + Rollup
 * Support for the Pink Panther prototype banking scheme
 * Workaround for startup issues in Activison Decathlon
 * Stellerator-embedded and debug frontends temporarily removed from build
 * Travis deployment temporarily disabled

# 0.9.14

## All

 * Support for CDFJ banking
 * CommaVideo cartridge support

# 0.9.13

## All

 * New CPU core with one bus access per cycle
 * Support 2 / 4 / ... / 1024 byte ROMs
 * Audio fixes for Safari iOS / MacOS: audio now reliably starts after the first interaction on both platforms

# 0.9.12

## Stellerator embedded

 * Fix pause via touch controls

# 0.9.11

## Stellerator embedded

* include support for touch controls

## All

 * Update dependencies

# 0.9.10

## All

 * Fix CDF music mode.

# 0.9.9

## All

 * Improvements to playfield collisions during HBLANK. Fixes a glitch in
   Thrust.

# 0.9.8

## Stellerator

 * UI fixes for mobile devices

## Stellerator embedded

 * Reduce default volume to 70%.

## All

 * Work around audio issues on iOS
 * Implement a poor man's fullscreen mode for iOS devices
 * Restrict HiDPI scaling in order to avoid slowdowns in Chrome

# 0.9.7

## All

 * Fix an extreme edge case of late HMOVE followed by another HMOVE. This
   fixes a spurious line at the left side of the screen in panda chase.

# 0.9.6

## All

 * Override maxHeight and maxWidth in fullscreen mode for simpler styling.

# 0.9.5

## All

 * CPU read timing improvements. Fixes edge cases in timer loops.

# 0.9.4

## All

 * Fix the two highest bits in undefined TIA reads

# 0.9.3

## Stellerator embedded

 * Fix gamepad input

# 0.9.2

## Aöö

 * NPM metadata update.

# 0.9.1

## Stellerator embedded

 * Initial release
