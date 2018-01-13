# Stellerator Embedded

Stellerator embedded is a library that allows you to embed 6502.ts' VCS emulation
into other web pages. It offers most of the functionality provided by Stellerator,
minus some of the more exotic configuration options that are unlikely to be
useful in this context.

You can find the comprehensive API documentation (including this document)
[here](https://6502ts.github.io/typedoc/stellerator-embedded/).

# Example

You can find a example of the embedded emulator
[here](https://6502ts.github.io/dev/stellerator_embedded_demo.html).
The source code is available in the 6502.ts repository on GitHub
[here](https://github.com/6502ts/6502.ts/blob/master/web/stellerator_embedded_demo.html).

The example exposes the Stellerator instance (see below) as `window.stellerator`, so
you can access and explore it in the developer console.

# Overview

Stellerator consists of two parts: a frontend that renders the emulation output and
provides interactivity and the actual emulation core that runs on a separate thread as a
[web worker](https://developer.mozilla.org/de/docs/Web/API/Web_Workers_API). This
separation improves emulation performance and avoids slowdowns caused by other
activity on the web page.

## Frontend

The frontend provides a single class called
[`Stellerator`](https://6502ts.github.io/typedoc/stellerator-embedded/classes/stellerator_.stellerator.html).
It is available both as a prebuild bundle that can directly loaded via script tag
and in the `6502.ts` package on NPM. The prebuilt script is most suitable
for including the emulator in a web page, while the NPM package is mainly aimed at
more sophisticated JavaScript / Typescript applications which have their own build process.

## Backend

The emulation backend is available as a prebuilt script that is loaded by the frontend at runtime
and that needs to be hosted on the page / domain that embeds the emulation.

# Installation

## Prebuilt browser bundle

Download the `stellerator_embedded.zip` archive of the latest release from
[GitHub](https://github.com/6502ts/6502.ts/releases).
The archive contains two scripts that need to be hosted on your web server alonside
the page that embeds the emulator.

 * `stellerator_embedded.min.js`: The emulation frontend. Load this via a script tag
   in your HTML:

```html
<script src="js/stellerator_embedded.min.js"></script>
```

   The `Stellerator` class is available on the global `$6502` object after the script has
   been loaded.

 * `stellerator_worker.min.js`: The web worker. The path to this script must be passed
   to the constructor of the `Stellerator` instance:

```javascript
const stellerator = new $6502.Stellerator(canvasElement, 'js/stellerator_worker.min.js');
```

In addition to these two scripts, the archive also contains source maps for both. Place
these on you server and host them alongside the scripts in order to enable source-level
debugging and traces in the developer console.

## Installation via NPM

The emulation core of 6502.ts is available as `6502.ts` on
[NPM](https://www.npmjs.com). Install into your project e.g. using npm via

```
$ npm install 6502.ts
```

After installation, you can import the `Stellerator` class using an ES6 import

```javascript
import Stellerator from '6502.ts/lib/web/embedded/stellerator/Stellerator';
```

or via `require`

```javascript
var Stellerator = require('6502.ts/lib/web/embedded/stellerator/Stellerator').default;
```

The NPM module comes with
[TypeScript](https://www.typescriptlang.org)
typings, so you can use it directly in a TypeScript project.

Note that the NPM module provides only the frontend; you'll still have to download
the worker script and host it alongside your application.

# Usage

## Basic usage

In order to use the emulator, you need to include a
[canvas element](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
in your web
page (which will display the TIA image) and create an instance of the `Stellerator`
class:

```javascript
const stellerator = new Stellerator(canvasElement, 'js/stellerator_worker.min.js');
```

The second argument of the constructor is the URL from which the web worker will be loaded.

Emulation can then be started by invoking the `run` method

```javascript
stellerator.run(romImage, Stellerator.TvMode.ntsc);
```

ROM images can be provided as arrays, typed arrays or as base64 encoded strings. Both the
constructor and `run` support an optional argument that allows to adjust many properties
of the emulator to the requirements of the embedding page, including ROM type, rendering options
and input emulation. In addition, there are methods on the `Stellerator` class that
enable interaction with the emulator at runtime. Please check out the full
[API documentation](https://6502ts.github.io/typedoc/stellerator-embedded/classes/stellerator_.stellerator.html)
for details.

## The canvas element

The emulators requires a
[canvas element](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
on the embedding page in order to display the TIA image. The resolution of
the canvas is managed by stellerator and automatically adjusted for optimal
display given the on-screen dimensions of the canvas element and the device pixel
ratio when emulation starts or enters / leaves fullscreen mode. The `width` and
`height` attributes of the canvas element need not be specified and will be overridden
by stellerator (this does **not** apply to the actual on-screen size that is determined
by CSS).

If the canvas changes size while the emulator runs, the video driver should be
notified using the
[resize](https://6502ts.github.io/typedoc/stellerator-embedded/classes/stellerator_.stellerator.html#resize)
method on the stellerator instance. This does not apply to window size changes in
fullscreen mode --- the video driver takes care of those automatically.

The canvas can be styled regularily using CSS; however, `padding` and `box-model`
as well as borders must be avoided. Please use a wrapper element to achieve
those effects. In addition, fullscreen mode (see below) changes element styles on
the canvas --- do not use element styles on the canvas in oder to avoid collisions.

## Fullscreen mode

The display can be put in fullscreen mode either programmatically or (unless disabled)
via the keyboard. Stellerator uses the HTML5 fullscreen API (with the exception of
iOS devices which do not support HTML5 fullscreen; see 'iOS quirks' below).

Switching to fullscreen mode changes element styles on the canvas. In addition, the class
`stellerator-fullscreen` is added to the the body element. You can target this class
if you want to do additional styling in fullscreen mode.

## Input and key mappings

The following control scheme applies unless configured differently in the options
(individual parts can be disabled, but custom key mappings are not yet supported):

 * wasd / arrow keys and space / v for fire control joystick 1
 * ijkl and b for fire controls joystick 2
 * shift-enter controls the reset button on the console
 * shift-space controls the select button on the console
 * enter toggles fullscreen
 * shift-r resets the emulator
 * p toggles pause
 * The horizontal axis of the mouse and d for fire control paddle 1
 * Gamepads are supported for joystick 1/2 but rely on browser and OS for the correct
   mapping

The difficulty and color switches can be controlled via the API.

# Limitations

## Browser support

6502.ts aggressivly leverages many modern browser technologies which are part of
HTML5 and the ES6 standard. Although the code is still compiled to ES5, it uses
many data structures and APIs that are part of HTML5 and ES6 and requires the browser to
support them. You can relax this restriction by loading polyfills like
[core.js](https://github.com/zloirock/core-js)
to provide the missing features, but don't expect the result to run smoothly :)

That said, Stellerator runs flawlessly in any reasonably modern version of Chrome,
Firefox and Safari. Edge runs the emulator, but currently has trouble running
at full speed. Safari on iOS works fine on 64bit devices, but there are some
quirks regarding audio and fullscreen mode (see below). The mileage with other
browsers may vary.

## System requirements and speed

Any reasonably modern (not older than 5-6 years) x86 based system should be able
to run the emulator at full speed. The mileage with ARM and mobile devices varies.
The emulator supports connected gamepads (unless disabled in the options) but relies
on OS and browser to map the gamepad buttons correctly.

I have not yet found any Android device that can sustain 6502.ts at full speed, but
recent 64bit iOS devices work fine.

## iOS quirks

Stellerator works fine on iOS devices; however there are some quirks.

Due to policies enforced by Apple, audio will not play unless started from an
interaction event triggered by the user. Stellerator tries to work around this,
but there must be at least one touch to the page after the `Stellerator` instance
has been created before audio starts playing.

HTML5 fullscreen in unsupported by Safari on iOS. Instead, Stellerator tries to
emulate it by fixed positioning of the canvas with a large Z index. This more or less
works, but the browser toolbar still makes its appearance if the display is
touched at the wrong points, and manual scrolling is required to get rid of
it again. Unfortunately, there is not much that can be done about this
when the page is displayed in the browser app.
However, the intereference from the browser UI can be avoided if the page is loaded
from the homescreen and the `apple-mobile-web-app-capable` meta tag is configured.
Please check out the official Apple
[documentation](https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
for details.

# Troubleshooting

If the emulator fails to work, please check the debug console for any errors. In
particular, check the network tab whether the worker script is loaded correctly.
Also, check whether the
[example](https://6502ts.github.io/dev/stellerator_embedded_demo.html)
works.

If need help or think that you may have found an issue, please file a bug on the
[github tracker](https://github.com/6502ts/6502.ts/issues).
Please check the tracker for existing issues that describe your problem
first.
