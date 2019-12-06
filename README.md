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

### Stabilizer placement and installation

Currently only costar-style stabilizers are supported. More will come later.

Suggested installation:

Stabilizer cutouts extend *below* the switch, toward the bottom edge of the
board (closes to to the user). The wire-side of the stabilizers should be on
that edge too.

The keycap-pins should be installed with the "long side" pointed at the *top*
*edge* of the keyboard.

### TODO
* allow caseWall thickness X/Y to be set independently
* allow screw hole inset X/Y to be set independently
* Add tests
* Add jsdoc to function
* print out maximum width/length of plate when rendering
* Add to config file layers:
  - protect certain paramters -- they can be defined in any block, but not *re-defined*
    - switch unit dimensions
    - screw hole placement (but screw hole size *can*)
    - ..anything else that must be consistent between layers
  - justify-edge options
    * make a given edge flat regardless of key row offset
  - screw holes
* Document:
  - splitting in to sections based on colour
  - what render rows does
  - what truncation does and why its useful
  - layers vs sections vs operations
* Objectify Key Unit/Cutout parameters to allow for more styles
* Objectify Stabilizer Kind/Cutout parameters to allow for more styles
* Render all layers at once with sequential filenames
  - modularize the `build_all.sh` bash script
* Add note of materials used
* Add note about `cutout` and `upper`
* option to build custom layers based on "case" and "bottom", not just "cutout"
* Add usage notes
* Add documentation about kerf on
  - CNC: bulk-cut vs finishing operations
  - Laser: laser kerf
* Add example of workflow
  * laser'ed
  * machined
* Properly fix the section shift issue outlined in `truncateOutput`
  - Also fix issue of it not taking kerf + extendFootprint in to account
* add proper package.json with version, etc
* add examples
### History

It is based on my original OpenSCAD script, but was ported to OpenJSCAD once
I realized the design was getting complicated enough to need a real object
model.

Release History
* 1.0.0 - November 2019

Initial
