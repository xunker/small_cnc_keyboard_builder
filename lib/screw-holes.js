'use strict'

const {
  vector_text, vector_char,
  square, circle,
  union, difference, intersection,
  rotate, translate, scale, mirror, hull, chain_hull, expand, contract
} = require('./render/openjscad')

const config = require('./config')
const { rowLength, isFirstRow, isLastRow, firstKey, lastKey, rangeIntersection, maxLayerWidth, maxLayerHeight } = require('./misc')
const fatalError = require('./fatal-error')
const { info, verbose, warn } = require('./logger')

const defaultScrewHoleSize = 2

function screwDiameter() {
  let d = config.dimensions.screws.diameter;
  if (!d) {
    warn(`config.dimensions.screws.diameter is not defined. Using default of ${defaultScrewHoleSize}`)
    return defaultScrewHoleSize
  }

  if (config.dimensions.kerf.screws) {
    verbose(`Applying screw kerf of ${config.dimensions.kerf.screws}`)
    d -= config.dimensions.kerf.screws
    if (d < 0.5) {
      warn(`Screw diameter of ${d} with kerf of ${config.dimensions.kerf.screws} is less than minimum allowed diameter of 0.5; setting screw diameter to 0.5`)
      return 0.5
    }
  }
  return d
}

// TODO must check logic for uneven rows
// TODO must draw these holes AFTER all rows written
function screwHole(location, keyObj, edges = {}) {
  // console.log(keyObj)
  // console.log(edges)

  var [x_offset, y_offset] = [0, 0]
  const inset = screwDiameter();

  if ([0, 1, 2].indexOf(location) > -1) {
    // top
    // y_offset = (keyObj.height * config.dimensions.switch_unit_l) - (edges["top"] ? inset : 0)
    y_offset = (keyObj.height * config.dimensions.switch_unit_l) - ((edges["top"] && config.dimensions.extendFootprint.top < screwDiameter()) ? inset : 0)
  }

  if ([6, 7, 8].indexOf(location) > -1) {
    // bottom
    // y_offset = (edges["bottom"] ? inset : 0)
    y_offset = ((edges["bottom"] && config.dimensions.extendFootprint.bottom < screwDiameter()) ? inset : 0)
  }

  if ([0, 3, 6].indexOf(location) > -1) {
    // left
    x_offset = ((edges["left"] && (config.dimensions.extendFootprint.left < screwDiameter() || !keyObj.isFirstVisible)) ? inset : 0)
  }

  if ([2, 5, 8].indexOf(location) > -1) {
    // right
    // x_offset = (keyObj.width * config.dimensions.switch_unit_w) - (edges["right"] ? inset : 0)
    x_offset = (keyObj.width * config.dimensions.switch_unit_w) - ((edges["right"] && (config.dimensions.extendFootprint.right < screwDiameter() || !keyObj.isLastVisible)) ? inset : 0)
  }

  if ([1, 7].indexOf(location) > -1) {
    // middle top/bottom
    x_offset = (keyObj.width * config.dimensions.switch_unit_w) / 2
  }

  if ([3, 5].indexOf(location) > -1) {
    // middle left/right
    y_offset = (keyObj.height * config.dimensions.switch_unit_l) / 2
  }

  return circle({ r: screwDiameter()/2, center: true, fn: 12 }).translate([x_offset, y_offset])
}

function screwHoles(keymap) {
  verbose(`Building screw holes. Screw diameter: ${config.dimensions.screws.diameter}`)
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

    // if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
    //   continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * config.dimensions.switch_unit_l

    for (var keyIndex = 0; keyIndex < keymap[rowNo].length; keyIndex++) {
      // verbose(`keyIndex: ${keyIndex}`)
      let keyObj = keymap[rowNo][keyIndex]

      for (let screwPosition = 0; screwPosition <= 9; screwPosition++) {
        // verbose(`screwPosition: ${screwPosition}`)
        if (screwPosition == 4)
          continue

        if ((keyObj.labels[screwPosition]) && (keyObj.labels[screwPosition].match('SCREW'))) {
          // console.log(screwPosition, keyObj.labels[screwPosition])
          holes.push(
            screwHole(screwPosition, keyObj,
              {
                "top": (keyObj.y <= 0),
                "right": (keymap[keyObj.y].indexOf(keyObj) == keymap[keyObj.y].length - 1),
                "bottom": (keyObj.y == keymap.length - 1),
                "left": (keymap[keyObj.y].indexOf(keyObj) == 0)
              }
            ).translate([keyObj.x * config.dimensions.switch_unit_w, row_y_offset])
          )
        }
      }
    }
  }

  verbose(`Built ${holes.length} screw holes. Done with ScrewHoles()`)
  // return []
  // return union(holes)
  return holes
  // return square([1,1])
}

module.exports = screwHoles
