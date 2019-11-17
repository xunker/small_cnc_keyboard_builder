#!/usr/bin/env node
'use strict'

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

const { vector_text, vector_char } = require('@jscad/csg/api').text
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

var kle = require("@ijprest/kle-serial")

var argv = require('yargs')
  .option('noPathReorder', {
    alias: 'n',
    type: 'boolean',
    description: 'Do not automatically re-order <path> elements by size'
  })
  .option('section', {
    alias: 's',
    type: 'number',
    description: 'Section part to render (if multipart layout)'
  })
  .option('rows', {
    alias: 'r',
    type: 'string',
    description: 'Render only single row (ex: "1") or rows (ex: "1-3")'
  })
  .usage('Build a keyboard plate and post-process the resultant SVG\n\nUsage: $0 [layoutFilename.js] [options]')
  .strict()
  .argv

var renderRows = []
if (argv.rows != undefined) {
  if (argv.rows.match('-')) {
    for (let i = parseInt(argv.rows.split('-')[0]); i <= parseInt(argv.rows.split('-')[1]); i++) {
      renderRows.push(i)
    }
  } else {
    renderRows.push(parseInt(argv.rows))
  }
}

if (renderRows.length > 1) {
  console.log(`Rendering only rows ${renderRows[0]} to ${renderRows[renderRows.length-1]}`)
} else if (renderRows.length  == 1) {
  console.log(`Rendering only row ${renderRows[0]}`)
}

const kleSoureceFilename = argv._[0]

if (!kleSoureceFilename)
  throw Error("Must provide KLE Json file as argument")

const outputSvgFilename = kleSoureceFilename + ".svg"
console.log(`Opening KLE file "${kleSoureceFilename}"`)

const kleSourceData = fs.readFileSync(kleSoureceFilename, 'utf8')

const keyboard = kle.Serial.parse(kleSourceData)

// keymap is [rowNumber][<keys objects>]
var keymap = []

var previousKey = undefined
var sectionNumber = 0
for (const keyIndex in keyboard.keys) {
  let currentKey = keyboard.keys[keyIndex]

  if (!keymap[currentKey.y])
    keymap[currentKey.y] = []

  if (previousKey) {
    if (previousKey.y != currentKey.y) {
      sectionNumber = 0
    }

    if (previousKey.y == currentKey.y) {
      if (currentKey.color != previousKey.color)
        sectionNumber++
    }
  }

  // let correctSection = (argv.section == undefined) || (argv.section == sectionNumber)
  // console.log(currentKey.labels, sectionNumber, argv.section, correctSection)
  previousKey = currentKey

  if ((argv.section != undefined) && (argv.section != sectionNumber)) {
    continue
  }

  keymap[currentKey.y].push(currentKey)

  // console.log(currentKey)
}

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
  return (rowData[rowData.length - 1].width + rowData[rowData.length - 1].x) - rowData[0].x;
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
    x_offset = (keyObj.width * switch_unit_w)/2
  }

  if ([3, 5].indexOf(location) > -1) {
    // middle left/right
    y_offset = (keyObj.height * switch_unit_l)/2
  }

  return circle({ d: diameter, center: true, fn: 12 }).translate([x_offset, y_offset])
}

function planed_cutout(keyObj, rowNo, plane, include_stabilizers = false) {
  if (plane == "switch_upper") {
    return cutout(switch_upper_w, switch_upper_l, switch_upper_corner_r, stabilizer_upper_width, stabilizer_upper_length, stabilizer_upper_corner_r, include_stabilizers).translate([switch_unit_w * (keyObj.width - 1) / 2, 0])
  } else if (plane == "switch_cutout") {
    return cutout(switch_cutout_w, switch_cutout_l, switch_cutout_corner_r, stabilizer_cutout_width, stabilizer_cutout_length, stabilizer_cutout_corner_r, include_stabilizers).translate([switch_unit_w * (keyObj.width - 1) / 2, 0])
  } else if (plane == "case") {
    let edges = {
      "top": (keyObj.y <= 0),
      "right": (keymap[keyObj.y].indexOf(keyObj) == keymap[keyObj.y].length - 1),
      "bottom": (keyObj.y == keymap.length - 1),
      "left": (keymap[keyObj.y].indexOf(keyObj) == 0)
    }

    // return square([switch_cutout_w, switch_cutout_l])
    let inset = 2
    let cutout_w = (switch_unit_w * keyObj.width)
    let cutout_l = switch_unit_l
    let x_offset = 0
    let y_offset = 0
// console.log(edges)
    if (edges['top']) {
      cutout_l = cutout_l - inset
    }

    if (edges['bottom']) {
      cutout_l = cutout_l - inset
      y_offset += inset
    }

    if (edges['left']) {
      cutout_w = cutout_w - inset
      cutout_l = cutout_l - inset*2
      x_offset += inset
      y_offset += inset
    }

    if (edges['right']) {
      cutout_w = cutout_w - inset

      cutout_l = cutout_l - (inset * 2)
      y_offset += inset
    }

    return square([cutout_w+0.1, cutout_l]).translate([x_offset, y_offset])
  }
}

/*
plane can be: switch_upper, switch_cutout
*/
function rowCutouts(keymap, rowNo, plane) {
  var row = new Array()

  for (const keyDataIdx in keymap[rowNo]) {
    var keyObj = keymap[rowNo][keyDataIdx]

    row.push(
      planed_cutout(keyObj, rowNo, plane, (keyObj.width >= 2))
        .translate([keyObj.x * switch_unit_w, 0])
    )
  }

  // if (plane == "case") {
  //   return chain_hull(row)
  // } else {
    return union(row)
  // }
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

function boardCutouts(keymap, plane) {
  var rows = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * switch_unit_l

    rows.push(
      rowCutouts(keymap, rowNo, plane).translate([0, row_y_offset])
    )
  }
  return union(rows)
}

function baseKeyboard(keymap) {
  var rows = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * switch_unit_l

    rows.push(
      switchRow(keymap[rowNo])
        .translate([keymap[rowNo][0].x * switch_unit_w, 0])
        .translate([0, row_y_offset])
    )
  }
  return union(rows)
}

function buildKeyboard(keymap, plane) {
  return difference(
    baseKeyboard(keymap),
    boardCutouts(keymap, plane)
  )
}

function main() {
  // return buildKeyboard(left_keymap, "switch_cutout")
  // return buildKeyboard(left_keymap, "switch_upper")
  // return buildKeyboard(simple_test, "switch_cutout")
  // return buildKeyboard(simple_test, "switch_upper")
  // return union(buildKeyboard(keymap, "switch_cutout")).subtract(screwHoles(keymap))
  // return buildKeyboard(keymap, "switch_cutout")
  return buildKeyboard(keymap, "case")
  // return boardCutouts(keymap, "case")
}

// const outputData = jscad.generateOutput('svg', main())
// fs.writeFileSync('sheet_keyboard.svg', outputData.asBuffer())

const { prepareOutput } = require('@jscad/core/io/prepareOutput')
const svgSource = prepareOutput(main(), { "format": "svg"}).data[0]

// ---

// const outputSvgFilename = "sheet_keyboard.fixed.svg"

const pathElementAdditions = 'stroke="black" fill="lightgray" stroke-width="0.5"'

var gElementsMatch = svgSource.match(/(\<g>.+\<\/g>)/s)

if (!gElementsMatch || gElementsMatch[0].length < 1)
  throw Error(`Could not find any <g> elements in ${inputSvgFilename}`)

/* handle multiple <g> tags */
var gElements = gElementsMatch[0]
  .replace(/^\<g>/, '')    // remove leading
  .replace(/\<\/g>$/, '')  // remove trailing
  .split(/\<\/g>\s*\<g>/s) // split on "</g><g>" boundary

console.log(`Fixing ${gElements.length} <g> elements`)

var gElementsRewrite = gElements.map(function (gElement) {

  // Separate each path element
  var pathElements = gElement
    .split(/(\<path\s+d=\".*\"\/\>)/)
    .filter(part => !part.match(/^\s+$/))

  console.log(`Fixing ${pathElements.length} <path> elements`)

  /*
  The order of the paths often needs to be arranged so the largest ones (the
  baground/outlines) appear before the smaller ones (the key cutouts), otherwise
  we won't be able to see the key cutouts.

  We do this by sorting all the paths with the "largest" Line path position
  value (the largest "Ldddd.dddd" of a path,
  https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths), and making
  sure the largest paths appear first.
  */

  if (argv.noPathReorder) {
    console.log("Will not re-order path elements")
  } else {
    pathElements = pathElements.sort(function (firstEl, secondEl) {
      let getMax = function (element) {
        return [...element.matchAll(/L([\d\.]+)/g)]
          .map(m => parseFloat(m[1]))
          .reduce(function (a, b) { return Math.max(a, b) })
      }

      return getMax(secondEl) - getMax(firstEl)
    })
  }

  // add fill and stroke to each <path>
  return pathElements.map(function (pathElement) {
    return pathElement.replace(/path\s+d=/, 'path ' + pathElementAdditions + ' d=')
  })
})

// Write the new svg file with changed <g>/<path> elements
fs.writeFileSync(
  outputSvgFilename,
  svgSource.replace(
    gElementsMatch[0],
    gElementsRewrite.map(pathElements => "<g>" + pathElements.join("\n") + "</g>").join("\n")
  )
)

console.log(`Wrote ${outputSvgFilename}`)
