'use strict'

import { builtinModules } from "module";

// TODO must check logic for uneven rows
// TODO must draw these holes AFTER all rows written
function screwHole(location, keyObj, diameter = 2, edges = {}) {
  console.log(keyObj)
  console.log(edges)
  var [x_offset, y_offset] = [0, 0]
  const inset = diameter;

  if ([0, 1, 2].indexOf(location) > -1) {
    // top
    y_offset = (keyObj.height * switch_unit_l) - (edges["top"] ? inset : 0)
  }

  if ([6, 7, 8].indexOf(location) > -1) {
    // bottom
    y_offset = (edges["bottom"] ? inset : 0)
  }

  if ([0, 3, 6].indexOf(location) > -1) {
    // left
    x_offset = (edges["left"] ? inset : 0)
  }

  if ([2, 5, 8].indexOf(location) > -1) {
    // right
    x_offset = (keyObj.width * switch_unit_w) - (edges["right"] ? inset : 0)
  }

  if ([1, 7].indexOf(location) > -1) {
    // middle top/bottom
    x_offset = (keyObj.width * switch_unit_w) / 2
  }

  if ([3, 5].indexOf(location) > -1) {
    // middle left/right
    y_offset = (keyObj.height * switch_unit_l) / 2
  }

  return circle({ d: diameter, center: true, fn: 12 }).translate([x_offset, y_offset])
}

function screwHoles(keymap) {
  return []
  /*
    find possible screw positions:
    +-----+
    |0 1 2|
    |3   5|
    |6 7 8|
    +-----+
    4 (centre) is not used
    */

  var holes = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * switch_unit_l

    for (const keyIndex in keymap[rowNo]) {
      let keyObj = keymap[rowNo][keyIndex]

      // console.log(keyObj.labels)
      for (let screwPosition = 0; screwPosition <= 9; screwPosition++) {
        if (screwPosition == 4)
          continue
        // console.log(keyObj.labels[screwPosition])
        if ((keyObj.labels[screwPosition]) && (keyObj.labels[screwPosition].match('SCREW'))) {
          console.log(screwPosition, keyObj.labels[screwPosition])
          holes.push(
            screwHole(screwPosition, keyObj, 2,
              {
                "top": (keyObj.y <= 0),
                "right": (keymap[keyObj.y].indexOf(keyObj) == keymap[keyObj.y].length - 1),
                "bottom": (keyObj.y == keymap.length - 1),
                "left": (keymap[keyObj.y].indexOf(keyObj) == 0)
              }
            ).translate([keyObj.x * switch_cutout_w, 0])
          )
        }
      }
      // console.log('---')
    }
  }

  return union(holes)
}

module.export = screwHoles
