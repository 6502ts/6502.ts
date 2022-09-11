Stellerator is an emulator for the Atari 2600 VCS (Stella) developed as part
of the 6502.ts project. Stellerator runs the vast majority of
games for the VCS flawlessly, including both original games, demos and homebrews. Most
cartridge types and bankswitching schemes are supported, including ARM-based DPC+
cartridges.

Among other things, it supports hardware accelerated graphics with phosphor
simulation, scanlines and TV effects. and jitter-free audio emulation.
Cartridges are stored locally in the browser, no data is transferred over the
web.

The emulator UI is responsive and works well on mobile devices, too. The emulator
uses a service worker and is able to load from the cache even if no internet access
is available. On mobile devices, you can add the page to the homescreen to make it
behave like a mobile application.

The source is available under the MIT license on
[github](https://github.com/6502ts/6502.ts). Feel free to fork, explore and contribute.

# Loading and running ROMs

The "Cartridges" page allows you to import, configure and run ROM image files.
Image files can be loaded directly from ZIP files. If you load a ZIP file, all
ROMs in that file will be imported.

## Available Settings

 * **ROM Name:** The cartridge name as displayed in the cartridge list. Defaults to the
   name of the image file.
 * **ROM type:** Size and bankswitching type of the catridge. This is autodetected
   and should not be changed under normal circumstances.
 * **TV mode:** Use this setting to change the emulated TV type.
   The default is guessed from the filename.
 * **Emulate paddles:** Normally, Stellerator emulates four paddles. Some games
   (notably Thrust) have their controls messed up by the presence of the paddles
   unless they are turned off by this option.
 * **RNG seed:** Upon startup, the emulated hardware is initialized to a random
   state. Fixing the seed will remove the randomness and will fix
   the initial state. This allows to reliably run buggy games that otherwise
   fail to start depending on the initial state (e.g. Dark Chambers).
 * **First visible frame line:** Determine the first visible line of the image.
   The default is auto detection ("auto") and should work fine for the vast majority
   of ROMs. For problematic cases, this can be set to a fixed value. Typical values
   of real CRTs lie somewhere around 30 scanlines.
 * **CPU emulation:** Override the accuracy with which the CPU is emulated. See
   below for the different options.
 * **Audio emulation:** Override the method of emulating audio configured in the settings. See below
  for a detailed description of the available choices.
 * **Volume:** Allows to control audio on a per-cartridge basis.
 * **Default phosphor:** Use the global phosphor settings. If disabled, a per-ROM setting
   can be configured.
 * **Phosphor level:** Phosphor blend level for this ROM (if default phhosphor is disabled).

# Global Settings

The "Settings" page allows to configure global emulation settings.

## General

* **CPU emulation accuracy:** Change the default accuracy with which the CPU is emulated. See
   below for the different options.

## Audio

 * **Volume:** Overall volume.

 * **Audio Driver:** Switch the default audio driver. See below for a detailed description of
   the various options.

## Display

 * **Gamma correction:** Adjust gamma correction.
 * **TV emulation:** TV emulation mode. Note that this uses hardware acceleration
   and may cause visual artifacts on some GPUs. In particular, `composite` does not
   display cleanly on some iOS devices due to precision issues.
 * **Scaling:** Scaling mode. See below for a detailed description of the options.
 * **Phosphor level:** Phosphor blend level. A value of 0 disables phosphor simulation.
 * **Scanline intensity:** Intensity of the scanline overlay.

## Controls

 * **Touch controls:** Enable / disable touch controls. The default is "auto" and
   there usually is no need to change it.
 * **Left handed mode:** Swap touch controls for left handed users.
 * **Touch joystick sensitivity:** Sensitivity of the virtual joystick used by the
   touch controls.

##  UI

 * **Display mode:** Override the display size.
 * **Size:** Choose a scling factor for the UI.

# Emulation

## Control Panel

On the emulation page, the emulator can be controlled with the control panel
on the right.

 * **Difficulty left/right:** Controls the corresponding switches on the VCS.
 * **TV mode:** Controls the corresponding switch (color / BW) on the VCS.
 * **Limit framerate:** Toggle frame rate limiting. Without limiting, emulation
   will run at the maximum speed the browser can deliver.
 * **Hard Reset:** Hard reset the VCS. Note that RAM contents are preserved, which causes
   some buggy games to restart in funky states.
 * **Pause / Resume:** Stop and resume the emulation.

## Keyboard controls

The keyboard controls are explained on the emulation page. Both joysticks and the
select / reset buttons on the VCS are controlled via keyboard.
In addition, there are keys for resetting the emulator, pause / resume and
toggling fullscreen mode.

## Gamepad controls

Stellerator supports controlling the two joysticks and select / reset with gamepads.
As the emulator currently does not provide a way to change the button mapping,
your mileage may vary. If one or two supported gamepads (for which the browser
reports a well-defined mapping) are plugged in, the top bar will display
"A" or "AB" in the top right corner.

## Touch controls

Stellerator can be controlled by touch gestures on touch capable devices. The touch
controls divide the VCS video image into the four quadrants NW (top left), NE (top right),
SW (bottom left) and SE (bottom right).

In "normal mode", the controls are:

 * NW: Double tap to toggle fullscreen, hold to switch to "alt" mode (see below)
 * SW: Fire
 * NE / SE: Hold and drag to control a virtual joystick that is centered at your
   intial touch position.

![touch controls](images/2600_touch.jpg)

While you are touching NW, the controls enter "alt" mode:

 * SW: Tap to pause / unpause
 * NE: Select
 * SE: Reset

![touch controls alt](images/2600_touch_alt.jpg)

The touch controls can be changed to "left handed" moded in the settings. This
basically mirrors quadrant assignment horizontally:

![touch controls, left handed](images/2600_touch_lh.jpg)
![touch controls, left handed](images/2600_touch_alt_lh.jpg)

## Paddle emulation

While Stellerator emulates all four paddles, currently only one paddle one can
be controlled. The paddle is mapped to the horizontal mouse position;
fire corresponds to joystick 0 / right.

## Fullscreen mode

Pressing enter toggles fullscreen mode.

# Audio emulation

Stellerator supports two different ways to emulate audio in a browser environment,
which both have their issues and merits. The default is PCM.

## TL;DR

The default ("PCM") should work fine. Consider switching to "Waveform" if you
have performance issues, crackling artifacts or find the small audio lag
unbearable.

## PCM

This will produce a continuous stream of PCM audio data that is played back in
realtime. The stream is cycle exact and fully supports both "normal" TIA audio
and advanced effects like digitized samples (as used in Quadrun) or synthesized
music (e.g. Pitfall II, Stay Frosty 2).

The downside is that a browser is a very bad environment for anything realtime,
and even small lags will lead to popping noises. Stellerator attempts to
mitigate this by buffering audio data, but the price is a small lag of ~3 frames
between audio and video. Still, PCM provides highly accurate emulation and should
work fine for most people, although the mileage might vary on slower systems and
with certain OS / browser combinations.

## Waveform

In this mode, the emulator determines the current pattern (AUDC und AUDF) played
by the TIA and instructs the browser to loop it until changed. Volume changes
(AUDV) are handled natively by the browser.

This approach is much more tolerant to timing glitches than PCM. Lag will
prolong the individual notes played by the TIA, but no popping occurs, and small
speed variations are virtually unnoticable. There is no noticable lag between
audio and video.

The price for this is emulation accuracy. Most games will sound just fine, but
keen ears might spot small differences, and PCM playback via bitbanging will not
work (e.g. affecting Pitfall II, Quadrun, Stay Frosty 2 and others).

# CPU emulation

There are two different accuracy levels for CPU emulation.

## TL;DR

Use "Cycle" unless you encounter performance problems.

## Cycle

This mode provides a cycle exact model of every bus access. However, it is about 20%
slower than the faster "Instruction" mode.

## Instruction

This mode provides cycle exact CPU emulation as well, but multiple bus accesses may
be batched in a single cycle. This is faster than "Cycle" mode, but compatibility
is slightly worse.

In practice, the only game known to habe issues with "Instruction" mode is Pole
Position.

# Scaling

Stellerator offers three different algorithms for scaling the console image to
the screen. Scaling is done on the GPU.

## QIS (Quasi Integer Scaling)

Scales to the nearest integer multiple and then does bilinear interpolation to the
final size. This results in a crisp picture while still avoiding Moirée patterns.

## Bilinear interpolation

Avoids Moirée patterns, but blurs the image.

## Plain

Nearest Neighbour interploation. Generates a crisp image but is prone to cause
Moirée patterns.

# Browser support and emulation speed

Stellerator aggressively uses many modern web technologies, some of which are
part of the ES6 standard. Therefore, a recent browser is required to run the
emulator.

Stellerator is tested and works fine on current versions of Chrome, Firefox
and Safari.  Performance is best
in Chrome and Safari, Firefox may lag on DPC+ cartridges.

The emulator runs at full speed (approximately 3.5 MHz / 60 FPS in NTSC mode)
on any modern x86-based machine. On ARM based mobile devices, speed varies greatly.
Android devices usually are incapable of running the emulator at full speed. Modern
64bit iOS devices run the emulator well.
During emulation, the current
clock of the emulated system is displayed in the upper right corner.
Chrome / V8  and JavascriptCore / Safari tend to be faster than Firefox.

If you run into performance issues, switch CPU accuracy  to "instruction"
and set the audio driver to waveform. Turning on frame merging and disabling the web
worker can can help as well.

# Current limitations

 * Keyboard and gamepad mappings cannot be configured.
 * Only the first paddle can be controlled.
 * Audio on Safari on both iOS and MacOS may require a touch or click to start. This is a restriction
   imposed by Apple, and nothing can be done about it.
