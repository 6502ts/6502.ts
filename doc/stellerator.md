# About

Stellerator is an emulator for the Atari 2600 VCS (Stella) developed as part
of the 6502.ts project. Stellerator runs the vast majority of
games for the VCS flawlessly, including both original games and homebrews.

Among other things, it supports hardware accelerated graphics with TV afterglow
emulation and skip-free audio emulation. Cartridges are
stored locally in the browser, no data is transferred over the web.

The source is available under the MIT license on
[github](https://github.com/6502ts/6502.ts). Feel free to fork, explore and contribute.

# Loading and running cartridge images

The "Cartridges" page allows you to import, configure and run cartridge images.

## Available Settings

 * **Name:** The cartridge name as displayed in the cartridge list. Defaults to the
   name of the image file.
 * **TV mode:** Use this setting to change the emulated TV type.
   The default is guessed from the filename.
 * **Cartridge type:** Size and bankswitching type of the catridge. This is autodetected
   and should not be changed under normal circumstances.
 * **Emulate paddles:** Normally, Stellerator emulates four paddles. Some games
   (notably Thrust) have their controls messed up by the presence of the paddles
   unless they are turned off by this option.
 * **RNG seed:** Upon startup, the emulated hardware is initialized to a random
   state. Fixing the seed will remove the randomness and will fix
   the initial state. This allows to reliably run buggy games that otherwise
   fail to start depending on the initial state (e.g. Dark Chambers).
 * **Audio:** Allows to turn off audio output on a per-cartridge basis.

# Global Settings

The "Settings" page allows to configure global emulation settings.

## General Settings

 * **Use worker:** Run the emulation core on a background worker. This is enabled
   by default and allows for smoother framerates, but slow machines might
   actually profit from disabling this option. Changing this setting will require
   a page reload to apply.

## Video Settings

 * **Smooth scaling:** Toggle smooth scaling of the image. This currently only
   affects Chrome.
 * **WebGL rendering:** Stellerator uses hardware accelerated rendering to provide
   afterglow simulation and gamma correction. Disable this if you are experiencing
   video issues.
 * **Gamma correction:** Adjust gamma correction. This will only affect WebGL-enabled
   rendering.

# Emulation

## Control Panel

On the emulation page, the emulator can be controlled with the control panel
on the right.

 * **Difficulty left/right:** Controls the corresponding switches on the VCS.
 * **TV mode:** Controls the corresponding switch (color / BW) on the VCS.
 * **Limit framerate:** Toggle frame rate limiting. Without limiting, emulation
   will run at the maximum speed the browser can deliver.
 * **Reset:** Hard reset the VCS. Note that RAM contents are preserved, which causes
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

## Paddle emulation

While Stellerator emulates all four paddles, currently only one paddle one can
be controlled. The paddle is mapped to the horizontal mouse position;
fire corresponds to joystick 0 / right.

## Fullscreen mode

Pressing enter toggles fullscreen mode. Unfortunately, Firefox does not honor
aspect ratio and stretches the video to full display with.

# Browser support and emulation speed

Stellerator aggressively uses many modern web technologies, some of which are
part of the ES6 standard. Therefore, a recent browser is required to run the
emulator.

Current versions of Chrome and Firefox is fully supported.
Safari works but is known to have serious issues with IndexedDB that affect
cartridge load and save. Microsoft Edge might work but is untested.

The emulator runs at full speed (approximately 3.5 MHz / 60 FPS in NTSC mode)
on any modern x86-based machine. On ARM based devices, speed varies greatly,
and only high-end devices achieve full speed. During emulation, the current
clock of the emulated system is displayed in the upper right corner.
Chrome / V8 tends to be faster than Firefox.

# Current limitations

 * Keyboard and gamepad mappings cannot be configured.
 * Emulation of undoumented 6502 opcodes is not complete yet, and homebrew using unimplemented
   opcodes will die with an "invalid instruction" trap.
 * Only the first paddle can be controlled.
 * Some of the more exotic cartridge formats are currently unsupported, including
   supercharger and DPC (Pitfall II).
 * Audio register writes have a timing resolution of approximately one frame.
   This is more than enough for run-of-the-mill game audio, but code that
   attempts to do PCM audio by banging the audio registers
   will produce silence. Apart from audio demos, this would mainly affect DPC music
   --- if DPC cartridges were supported in the first place ;)