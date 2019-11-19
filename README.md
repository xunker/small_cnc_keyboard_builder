Small CNC Keyboard Builder
==========================

This is a collection of scripts to generate plate and case designed that can
be fabricated with small desktop CNC machines such as the CNC1610 series (and
other machines with similarly small volume, 160mm x 100mm).

https://github.com/xunker/small_cnc_keyboard_builder

## How is this different from every other keyboard plate generator?

The key difference is that this builder allows for non-rectangular plates, so
that you can machine your keyboard in multiple smaller pieces that can be
joined together later or be used in as a split keyboard.

This is important because without it you need a CNC machine with at least 280mm
of volume in a single direction to make a 60% keyboard plate. Using this
builder you can make full-sized plates using much smaller equipment.

### Install

Requires [OpenJSCAD CLI module](https://www.npmjs.com/package/@jscad/cli):

`npm install`

### How to use

TDB

### TODO
* Add kerf to js code
* Add tests
* print out maximum width/length of plate when rendering
* use 6u stabilizers if key is that wide
* add "layer" system. Each layer includes:
  - name
  - notes (meant for human consumption)
    * material type and thickness
    * cutting depth
    * cutting details
      - bit & diameter
      - speed
      - technique (inside vs outline, ramp cut, etc)
  - kerf
    * key cutout
    * stabilizer cutout
    * outline
  - extend-edge options
    * which edges, how much
  - justify-edge options
    * make a given edge flat regardless of key row offset
  - screw holes
    * should be shared between all layers?
* Way to automatically separate parts of keyboard based on..
  - Front legend value?
  - Color?
  - ..then need to specify a "part" or "section" in the build process
* Objectify Key Unit/Cutout parameters to allow for more styles
* Objectify Stabilizer Kind/Cutout parameters to allow for more styles
* Render all layers at once with sequential filenames
* Add note of materials used
* Add note about `cutout` and `upper`
* Add usage notes
* Add notes about kerf on bulk-cut vs finishing operations
* Option to extend edges

### History

It is based on my original OpenSCAD script, but was ported to OpenJSCAD once
I realized the design was getting complicated enough to need a real object
model.

Release History
* 1.0.0 - November 2019

Initial
