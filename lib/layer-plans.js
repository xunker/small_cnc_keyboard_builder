'use strict'

const {
  vector_text, vector_char,
  square, circle,
  union, difference, intersection,
  rotate, translate, scale, mirror, hull, chain_hull, expand, contract
} = require('./render/openjscad')

const { rounded_rect } = require('./render/misc')
const config = require('./config')
const { rowLength, isFirstRow, isLastRow, firstKey, lastKey, rangeIntersection, maxLayerWidth, maxLayerHeight } = require('./misc')
const fatalError = require('./fatal-error')
const { info, verbose } = require('./logger')
const screwHoles = require('./screw-holes')

var renderRows = []

// insert stabilizers: https://geekhack.org/index.php?topic=33298.0
function stabilizers(width, length, corner_r) {
  var objects = new Array()

  const signs = [-1, 1]

  signs.forEach(function (sign, index) {
    objects.push(
      rounded_rect(width, length, corner_r)
      .translate([(config.dimensions.stabilizer_spacing / 2) * sign, (((config.dimensions.switch_unit_l - length) / 2) + ((config.dimensions.switch_cutout_l - length)/2)) - config.dimensions.stabilizer_y_offset])
      .translate([-width / 2, 0]).translate([config.dimensions.switch_unit_w / 2, 0])
    )
  })

  return objects
}

function cutout(main_w, main_l, main_corner_r, stabilizer_main_width, stabilizer_main_length, stabilizer_main_corner_r, include_stabilizers = false) {

  var obj = new Array()

  obj.push(
    rounded_rect(main_w, main_l, main_corner_r).translate([0, (config.dimensions.switch_unit_l - main_l) / 2]).translate([(config.dimensions.switch_unit_w - main_w) / 2, 0])
  )

  if (include_stabilizers) {
    obj.push(
      stabilizers(stabilizer_main_width, stabilizer_main_length, stabilizer_main_corner_r)
    )
  }

  return union(obj)
}

function planed_cutout(keyObj, rowNo, include_stabilizers = false) {
  return cutout(config.dimensions.switch_cutout_w, config.dimensions.switch_cutout_l, config.dimensions.switch_cutout_corner_r, config.dimensions.stabilizer_cutout_width, config.dimensions.stabilizer_cutout_length, config.dimensions.stabilizer_cutout_corner_r, include_stabilizers).translate([config.dimensions.switch_unit_w * (keyObj.width - 1) / 2, 0])
}

function keyRowCutouts(keymap, rowNo) {
  var row = new Array()

  for (const keyDataIdx in keymap[rowNo]) {
    var keyObj = keymap[rowNo][keyDataIdx]

    row.push(
      planed_cutout(keyObj, rowNo, (keyObj.width >= 2))
        .translate([keyObj.x * config.dimensions.switch_unit_w, 0])
    )
  }

  return union(row)
}

function keyCutouts(keymap) {
  var rows = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * config.dimensions.switch_unit_l

    rows.push(
      keyRowCutouts(keymap, rowNo).translate([0, row_y_offset])
    )
  }
  return union(rows)
}

function switchRow(rowData) {
  let width = rowLength(rowData) * config.dimensions.switch_unit_w
  let length = config.dimensions.switch_unit_l + config.dimensions.ff

  let x_offset = 0
  let y_offset = 0

  if ((config.dimensions.extendFootprint.left) && (firstKey(rowData).isFirstVisible)) {
    verbose(`extendFootprint.left: Adjusting width and x_offset by ${config.dimensions.extendFootprint.left}`)
    width += config.dimensions.extendFootprint.left
    x_offset = config.dimensions.extendFootprint.left
  }

  if ((config.dimensions.extendFootprint.right) && (lastKey(rowData).isLastVisible)) {
    verbose(`extendFootprint.right: Adjusting width by ${config.dimensions.extendFootprint.left}`)
    width += config.dimensions.extendFootprint.right
  }

  if ((config.dimensions.extendFootprint.top) && (rowData.isFirstVisible)) {
    verbose(`extendFootprint.top: Adjusting length by ${config.dimensions.extendFootprint.top}`)
    length += config.dimensions.extendFootprint.top
  }

  if ((config.dimensions.extendFootprint.bottom) && (rowData.isLastVisible)) {
    verbose(`extendFootprint.bottom: Adjusting length by ${config.dimensions.extendFootprint.bottom}`)
    length += config.dimensions.extendFootprint.bottom
    y_offset = config.dimensions.extendFootprint.bottom
  }

  if ((config.dimensions.kerf.footprint) && (config.dimensions.kerf.footprint > 0.0)) {
    verbose(`kerf.footprint: Extending footprint by ${config.dimensions.kerf.footprint} for kerf`)
    width += config.dimensions.kerf.footprint * 2
    x_offset = config.dimensions.kerf.footprint

    length += config.dimensions.kerf.footprint * 2
    y_offset = config.dimensions.kerf.footprint
  }

  return square([width, length]).translate([-x_offset, -y_offset])
}

function caseCutouts(keymap) {
  var rows = new Array()

  let inset_x = (config.dimensions.switch_unit_w - config.dimensions.switch_cutout_w) / 2.5;
  let inset_y = (config.dimensions.switch_unit_l - config.dimensions.switch_cutout_l) / 2.5;

  if ((config.dimensions.kerf.case) && (config.dimensions.kerf.case > 0.0)) {
    verbose(`kerf.case: Adjusting case channel size by ${config.dimensions.kerf.case} for kerf`)
    inset_x += config.dimensions.kerf.case
    inset_y += config.dimensions.kerf.case
  }

  // First, long channels for each row that are not connected to each other
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {
    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    let currentRow = keymap[rowNo]

    let row_x_offset = keymap[rowNo][0].x * config.dimensions.switch_unit_w
    let row_y_offset = (((keymap.length - 1) - (rowNo)) * config.dimensions.switch_unit_l)

    let row_w = (rowLength(keymap[rowNo]) * config.dimensions.switch_unit_w)
    let row_l = config.dimensions.switch_unit_l - (inset_y * 2)

    row_w -= inset_x * 2

    rows.push(
      square([row_w, row_l]).translate([row_x_offset + inset_x, row_y_offset + inset_y])
    )
  }

  // Next, work out how to interconnect the channels while maintaining perimeter
  // Find where the current row safely intersects with previous or next row
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    let currentRow = keymap[rowNo]

    let row_x_offset = keymap[rowNo][0].x * config.dimensions.switch_unit_w
    let row_y_offset = (((keymap.length - 1) - (rowNo)) * config.dimensions.switch_unit_l)

    let row_w = (rowLength(keymap[rowNo]) * config.dimensions.switch_unit_w)
    let row_l = config.dimensions.switch_unit_l

    verbose("caseCutouts:", rowNo, currentRow[0].x, lastKey(currentRow).x + lastKey(currentRow).width)
    if (!isFirstRow(rowNo) && !isLastRow(rowNo, keymap)) {
      let nextRow = keymap[rowNo + 1]
      let prevRow = keymap[rowNo - 1]

      let [prevIntersectStart, prevIntersectEnd] = rangeIntersection(
        [firstKey(currentRow).x, lastKey(currentRow).x + lastKey(currentRow).width],
        [firstKey(prevRow).x, lastKey(prevRow).x + lastKey(prevRow).width],
      )

      let [nextIntersectStart, nextIntersectEnd] = rangeIntersection(
        [firstKey(currentRow).x, lastKey(currentRow).x + lastKey(currentRow).width],
        [firstKey(nextRow).x, lastKey(nextRow).x + lastKey(nextRow).width],
      )

      verbose("caseCutouts:", rowNo, currentRow[0].x, lastKey(currentRow).x + lastKey(currentRow).width, 'prev:', prevIntersectStart, prevIntersectEnd, 'next:', nextIntersectStart, nextIntersectEnd)

      if ((nextIntersectStart >= firstKey(currentRow).x) && (nextIntersectEnd >= lastKey(currentRow).x + lastKey(currentRow).width)) {
        rows.push(
          square([((nextIntersectEnd - nextIntersectStart) * config.dimensions.switch_unit_w) - (inset_x * 2), config.dimensions.switch_unit_l]).translate(
            [
              (nextIntersectStart * config.dimensions.switch_unit_w) + inset_x,
              row_y_offset - inset_y
            ]
          )
        )
      }

      if ((prevIntersectStart >= firstKey(currentRow).x) && (prevIntersectEnd >= lastKey(currentRow).x + lastKey(currentRow).width)) {

        rows.push(
          square([((prevIntersectEnd - prevIntersectStart) * config.dimensions.switch_unit_w) - (inset_x * 2), config.dimensions.switch_unit_l]).translate(
            [
              (prevIntersectStart * config.dimensions.switch_unit_w) + inset_x,
              row_y_offset + inset_y
            ]
          )
        )
      }
    }
  }

  return union(rows)
}

// returns base keyboard footprint, no cutouts
function baseKeyboard(keymap) {
  var rows = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * config.dimensions.switch_unit_l

    rows.push(
      switchRow(keymap[rowNo])
        .translate([keymap[rowNo][0].x * config.dimensions.switch_unit_w, 0])
        .translate([0, row_y_offset])
    )
  }
  return union(rows)
}

// key is layer name
let layerPlans = {
  "cutout": function (keymap) {
    let sr = screwHoles(keymap)
    verbose(`Screw holes: ${sr.length}`)
    if (sr.length) {
      verbose('Adding screw holes')
      return difference(baseKeyboard(keymap), union(keyCutouts(keymap), sr))
    }

    return difference(baseKeyboard(keymap), keyCutouts(keymap))
  },
  "case": (keymap) => difference(baseKeyboard(keymap), caseCutouts(keymap)),
  "bottom": (keymap) => baseKeyboard(keymap)
}

let defaultLayerPlan = "cutout"

function truncateOutput(layer, keymap, argv) {
  let [startX, startY, endX, endY] = argv.truncate.split(',').map((value) => parseInt(value))

  let maxWidth = maxLayerWidth(keymap) * config.dimensions.switch_unit_w
  let maxHeight = maxLayerHeight(keymap) * config.dimensions.switch_unit_w
  info(`Layer Max Width: ${maxWidth}, Layer Max Height: ${maxHeight}`)

  /* minRowX is used to reposition truncation square. The problem is that using
  section shifts all the rows to the right even though you can't see it in the svg.
  The right way to fix this is to not shift the sections, but this fix is
  easier for now */
  let minRowX = Math.min(...keymap.map((row) => firstKey(row).x * config.dimensions.switch_unit_w))
  verbose(`minRowX: ${minRowX}`)

  startX = maxWidth * (startX / 100)
  endX = maxWidth * (endX / 100)
  startY = maxHeight * (startY / 100)
  endY = maxHeight * (endY / 100)

  info(`Truncating output at positions: ${[startX, startY, endX, endY]}`)

  verbose(`Truncate square size: ${endX - startX} x ${endY - startY}`)
  verbose(`Truncate square translation: ${startX} x ${startY}`)

  return intersection(
  // return union(
  // return difference(
    layer,
    square([endX - startX, endY - startY]).translate([minRowX, 0]).translate([startX, startY])
  )
}

function layerPlan(keymap, argv) {
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
    info(`Rendering only rows ${renderRows[0]} to ${renderRows[renderRows.length - 1]}`)
  } else if (renderRows.length == 1) {
    info(`Rendering only row ${renderRows[0]}`)
  }

  /* validate layer name
  Built in layer names are "cutout", "case", and "bottom". Other layers may be
  added via a configuration file. These additional layers are all versions of
  "cutout" */

  let allowedLayerNames = new Set(Object.keys(layerPlans))
  Object.keys(config.layers).forEach((name) => allowedLayerNames.add(name))

  if ([...allowedLayerNames.values()].indexOf(argv.layer) == -1)
    fatalError(`Invalid layer "${argv.layer}". Layer must be one of: ${[...allowedLayerNames.values()].sort().join(", ")}`)


  let layerPlanFunction = layerPlans[argv.layer] || layerPlans[defaultLayerPlan]

  if (argv.truncate)
    return truncateOutput(layerPlanFunction(keymap), keymap, argv)

  return layerPlanFunction(keymap)
}

module.exports = {
  layerPlan,
  layerPlans
}
