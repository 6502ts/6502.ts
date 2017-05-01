This subdirectory is home to a customized version of David Welch's
[thumbulator](https://github.com/dwelch67/thumbulator), an emulator targetting
the thumb subset of the ARM instruction set.

The thumbulator has been transpiled to JS with
[emscripten](http://kripken.github.io/emscripten-site/) and is used to emulate
the DPC+, BUS and CDF schemes that run on the harmony cartridge and that run
code on the ARM SOC.

Both David Welch's original code and the glue around it are licensed under the
MIT license.