# 1.0.5

## All

 * Fix Moiré artifacts in composite effect on Apple silicon.

# 1.0.4

## stellerator-embedded

 * Fix touch I/O


# 1.0.3

## stellerator-embedded

 * First release after the 1.x rewrite
 * Support the new video settings
 * Rework the documentation
 * Example page: load the ROM via `fetch`

## Stellerator

 * Documentation

# 1.0.2

## VcsRunner

 * Support for running to RTS
 * Conditional traps

# 1.0.1

## All

 * Move dasm.js to deps

# 1.0.0

## All

 * Add VcsRunner for unit testing VCS software

# 1.0.0-beta11

## All

 * Fix an initialization issue in Missile emulation; fixes BMX Airmaster.

## Stellerator

 * Fix fullscreen toggle via touch on iOS 13.4. Unfortunately, this means that the "alt"
   quadrant of the canvas can't be used as a handle for scrolling anymore.

## Stellerator-embedded

 * Defunct, still needs plumbing for the new video


# 1.0.0-beta10

## Stellerator

 * Don't nuke stored data if an exception occurs during the initial load

## Stellerator-embedded

 * Defunct, still needs plumbing for the new video

# 1.0.0-beta9

## Stellerator

 * New WebGL-only video infrastructure with GPU based postprocessing
 * Phosphor simnualation modelled after Stella
 * TV effects  based on a libretro shader by Themaister
 * Scanlines
 * QIS scaling
 * More stable framerates

## Stellerator-embedded

 * Defunct, still needs plumbing for the new video

# 1.0.0-beta9

## Stellerator

 * New WebGL-only video infrastructure with GPU based postprocessing
 * Phosphor simnualation modelled after Stella
 * TV effects  based on a libretro shader by Themaister
 * Scanlines
 * QIS scaling
 * More stable framerates

## Stellerator-embedded

 * Still needs plumbing for the new video

# 1.0.0-beta.8

## Stellerator

 * Re-enable gamepad supports

## Stellerator-embedded

 * Fix gamepad mapping for select

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

## All

 * NPM metadata update.

# 0.9.1

## Stellerator embedded

 * Initial release
