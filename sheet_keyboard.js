/*

openjscad sheet_keyboard.jscad -o ~/Downloads/sheet_keyboard.svg

Export an SVG for different layers of a keyboard frame

openjscad svg dpi is about 96

TODO:
  * screw holes
  * round interconnection corners
  * bottom piece with screw holes but not cutouts
  * widen outside edges?

*/

const jscad = require('@jscad/openjscad')

// https://github.com/jscad/OpenJSCAD.org/blob/master/packages/desktop/src/core/code-loading/scriptLoading.js
// https://github.com/jscad/OpenJSCAD.org/tree/master/packages/cli

const { color } = require('@jscad/csg/api').color
const { square, circle } = require('@jscad/csg/api').primitives2d
const { linear_extrude } = require('@jscad/csg/api').extrusions
const { union, difference } = require('@jscad/csg/api').booleanOps
const { rotate, translate, scale, mirror, hull, chain_hull, expand, contract } = require('@jscad/csg/api').transformations
const fs = require('fs')

var round_inset_corners = true;
// var round_inset_corners = false;

var switch_unit_w = 19.05;
var switch_unit_l = 19.05;

var switch_cutout_w = 13.5; // actual 14;
var switch_cutout_l = 13.5; // actual 14;

var switch_cutout_corner_r = 0.3;

var switch_upper_w = 16; // actual 15.6;
var switch_upper_l = 16; // actual 15.6;
var switch_upper_corner_r = 0.5;

// stabilizer to stabilizer
var stabilizer_spacing = 24;
var stabilizer_y_offset = 0.8; // 0.762; // 0.03in
var stabilizer_cutout_width = 3.50;
var stabilizer_cutout_length = 14;
var stabilizer_cutout_corner_r = 0; // don't round these

var stabilizer_upper_width = 5.8; // 5.35 actual
var stabilizer_upper_length = 15.6; //actual 15.15;
var stabilizer_upper_corner_r = 0.5;

var ff = 0.01;

// ---

var left_keymap = [
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6]
  ],
  [
    [1.5, 0],
    [1, 1.5],
    [1, 2.5],
    [1, 3.5],
    [1, 4.5],
    [1, 5.5]
  ],
  [
    [1.75, 0],
    [1, 1.75],
    [1, 2.75],
    [1, 3.75],
    [1, 4.75],
    [1, 5.75]
  ],
  [
    [2.25, 0, 1],
    [1, 2.25],
    [1, 3.25],
    [1, 4.25],
    [1, 5.25],
    [1, 6.25]
  ],
  [
    [1, 0],
    [1, 1],
    [1.25, 2],
    [1.25, 3.25],
    [2.75, 4.5, 1]
  ]
];

var right_keymap = [
  [
    [1, 0.5],
    [1, 1.5],
    [1, 2.5],
    [1, 3.5],
    [1, 4.5],
    [1, 5.5],
    [1.5, 6.5]
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6],
    [1, 7]
  ],
  [
    [1, 0.25],
    [1, 1.25],
    [1, 2.25],
    [1, 3.25],
    [1, 4.25],
    [1, 5.25],
    [1.75, 6.25],
  ],
  [
    [1, 0.75],
    [1, 1.75],
    [1, 2.75],
    [1, 3.75],
    [1.25, 4.75],
    [1, 6],
    [1, 7]
  ],
  [
    [2, 0.75, 1],
    [1.25, 2.75],
    [1, 4],
    [1, 5],
    [1, 6],
    [1, 7]
  ],
];

var simple_test = [
  [
    [2, 0, 1]
  ]
];

// ---

function rounded_rect(w, l, r = 0.5) {
  // $fn = 12;
  if ((round_inset_corners) && (r > 0.0)) {
    return hull(
      circle(r = r).translate([r, r]),
      circle(r = r).translate([w - r, r]),
      circle(r = r).translate([r, l - r]),
      circle(r = r).translate([w - r, l - r])
    )
  } else {
    return square([w, l])
  }
}


function rowLength(rowData) {
  return (rowData[rowData.length - 1][0] + rowData[rowData.length - 1][1]) - rowData[0][1];
}

function switchRow(rowData) {
  return square([rowLength(rowData) * switch_unit_w, switch_unit_l + ff])
}

// insert stabilizers: https://geekhack.org/index.php?topic=33298.0
function stabilizers(width, length, corner_r) {
  var objects = new Array()

  // const stab = srounded_rect(width, length, corner_r).translate([(switch_cutout_w/2)-(stabilizer_cutout_width/2), 0])

  const signs = [-1, 1]
  // signs.forEach(function(sign, index) {
  //   objects.push(stab.translate([(stabilizer_spacing/2)*sign, stabilizer_y_offset]))
  // })

  signs.forEach(function (sign, index) {
    objects.push(
      rounded_rect(width, length, corner_r).translate([(stabilizer_spacing / 2) * sign, ((switch_unit_l - length) / 2) + stabilizer_y_offset]).translate([-width / 2, 0]).translate([switch_unit_w / 2, 0])
    )
  })

  return objects
}

function cutout(main_w, main_l, main_corner_r, stabilizer_main_width, stabilizer_main_length, stabilizer_main_corner_r, include_stabilizers = false) {

  var obj = new Array()

  obj.push(
    rounded_rect(main_w, main_l, main_corner_r).translate([0, (switch_unit_l - main_l) / 2]).translate([(switch_unit_w - main_w) / 2, 0])
  )

  if (include_stabilizers) {
    obj.push(
      stabilizers(stabilizer_main_width, stabilizer_main_length, stabilizer_main_corner_r)
    )
  }

  return union(obj)
}

function planed_cutout(plane, include_stabilizers = false) {
  if (plane == "switch_upper") {
    return cutout(switch_upper_w, switch_upper_l, switch_upper_corner_r, stabilizer_upper_width, stabilizer_upper_length, stabilizer_upper_corner_r, include_stabilizers);
  } else if (plane == "switch_cutout") {
    return cutout(switch_cutout_w, switch_cutout_l, switch_cutout_corner_r, stabilizer_cutout_width, stabilizer_cutout_length, stabilizer_cutout_corner_r, include_stabilizers);
  }
}

/*
plane can be: switch_upper, switch_cutout
*/
function cutouts(keymap, rowNo, plane) {
  var row = new Array()

  for (const keyDataIdx in keymap[rowNo]) {
    var keyData = keymap[rowNo][keyDataIdx]

    row.push(
      planed_cutout(plane, (keyData[2] == 1))
        .translate([keyData[1] * switch_unit_w, 0])
        .translate([switch_unit_w * (keyData[0] - 1) / 2, 0])
    )
  }

  return union(row)
}

function buildKeyboard(keymap, plane) {
  var rows = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {
    var row_y_offset = ((keymap.length - 1) - (rowNo)) * switch_unit_l

    rows.push(
      difference(
        switchRow(keymap[rowNo])
          .translate([keymap[rowNo][0][1] * switch_unit_w, 0]),
        cutouts(keymap, rowNo, plane)
      ).translate([0, row_y_offset])
    )
  }
  return rows
}

function main() {
  return buildKeyboard(left_keymap, "switch_cutout")
  // return buildKeyboard(left_keymap, "switch_upper")
  // return buildKeyboard(simple_test, "switch_cutout")
  // return buildKeyboard(simple_test, "switch_upper")
}

const outputData = jscad.generateOutput('svg', main())

// hurray ,we can now write an stl file from our raw CSG objects
fs.writeFileSync('sheet_keyboard.svg', outputData.asBuffer())
