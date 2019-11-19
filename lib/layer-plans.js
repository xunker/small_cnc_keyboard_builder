'use strict'

const {
  vector_text, vector_char,
  square, circle,
  union, difference,
  rotate, translate, scale, mirror, hull, chain_hull, expand, contract
} = require('./render')

const { rounded_rect } = require('./render/misc')
const { rowLength } = require('./misc')
const renderRows = require('./render-rows')
const dimensions = require('./dimensions')

// insert stabilizers: https://geekhack.org/index.php?topic=33298.0
function stabilizers(width, length, corner_r) {
  var objects = new Array()

  // const stab = srounded_rect(width, length, corner_r).translate([(dimensions.switch_cutout_w/2)-(dimensions.stabilizer_cutout_width/2), 0])

  const signs = [-1, 1]
  // signs.forEach(function(sign, index) {
  //   objects.push(stab.translate([(dimensions.stabilizer_spacing/2)*sign, dimensions.stabilizer_y_offset]))
  // })

  signs.forEach(function (sign, index) {
    objects.push(
      rounded_rect(width, length, corner_r).translate([(dimensions.stabilizer_spacing / 2) * sign, ((dimensions.switch_unit_l - length) / 2) + dimensions.stabilizer_y_offset]).translate([-width / 2, 0]).translate([dimensions.switch_unit_w / 2, 0])
    )
  })

  return objects
}

function cutout(main_w, main_l, main_corner_r, stabilizer_main_width, stabilizer_main_length, stabilizer_main_corner_r, include_stabilizers = false) {

  var obj = new Array()
  // console.log(dimensions.switch_unit_l, main_l, (dimensions.switch_unit_l - main_l) / 2)
  obj.push(
    rounded_rect(main_w, main_l, main_corner_r).translate([0, (dimensions.switch_unit_l - main_l) / 2]).translate([(dimensions.switch_unit_w - main_w) / 2, 0])
  )

  if (include_stabilizers) {
    obj.push(
      stabilizers(stabilizer_main_width, stabilizer_main_length, stabilizer_main_corner_r)
    )
  }

  return union(obj)
}

function planed_cutout(keyObj, rowNo, plane, include_stabilizers = false) {
  if (plane == "upper") {
    return cutout(dimensions.switch_upper_w, dimensions.switch_upper_l, dimensions.switch_upper_corner_r, dimensions.stabilizer_upper_width, dimensions.stabilizer_upper_length, dimensions.stabilizer_upper_corner_r, include_stabilizers).translate([dimensions.switch_unit_w * (keyObj.width - 1) / 2, 0])
  } else if (plane == "cutouts") {
    return cutout(dimensions.switch_cutout_w, dimensions.switch_cutout_l, dimensions.switch_cutout_corner_r, dimensions.stabilizer_cutout_width, dimensions.stabilizer_cutout_length, dimensions.stabilizer_cutout_corner_r, include_stabilizers).translate([dimensions.switch_unit_w * (keyObj.width - 1) / 2, 0])
  } else {
    throw Error(`unknown plane ${plane}`)
  }
}

/*
plane can be: switch_upper, switch_cutout
*/
function keyRowCutouts(keymap, rowNo, plane) {
  var row = new Array()

  for (const keyDataIdx in keymap[rowNo]) {
    var keyObj = keymap[rowNo][keyDataIdx]

    row.push(
      planed_cutout(keyObj, rowNo, plane, (keyObj.width >= 2))
        .translate([keyObj.x * dimensions.switch_unit_w, 0])
    )
  }

  // if (plane == "case") {
  //   return chain_hull(row)
  // } else {
  return union(row)
  // }
}

function keyCutouts(keymap, plane) {
  var rows = new Array()
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {

    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * dimensions.switch_unit_l

    rows.push(
      keyRowCutouts(keymap, rowNo, plane).translate([0, row_y_offset])
    )
  }
  return union(rows)
}

function switchRow(rowData) {
  return square([rowLength(rowData) * dimensions.switch_unit_w, dimensions.switch_unit_l + dimensions.ff])
}

function caseCutouts(keymap) {
  var rows = new Array()

  let inset_x = (switch_unit_w - switch_cutout_w) / 2.5;
  let inset_y = (switch_unit_l - switch_cutout_l) / 2.5;

  // First, long channels for each row that are not connected to each other
  for (var rowNo = 0; rowNo < keymap.length; rowNo++) {
    if ((renderRows.length) && (renderRows.indexOf(rowNo) == -1))
      continue

    let currentRow = keymap[rowNo]

    let row_x_offset = keymap[rowNo][0].x * switch_unit_w
    let row_y_offset = (((keymap.length - 1) - (rowNo)) * switch_unit_l)

    let row_w = (rowLength(keymap[rowNo]) * switch_unit_w)
    let row_l = switch_unit_l - (inset_y * 2)

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

    let row_x_offset = keymap[rowNo][0].x * switch_unit_w
    let row_y_offset = (((keymap.length - 1) - (rowNo)) * switch_unit_l)

    let row_w = (rowLength(keymap[rowNo]) * switch_unit_w)
    let row_l = switch_unit_l

    // console.log(rowNo, currentRow[0].x, lastKey(currentRow).x + lastKey(currentRow).width)
    if (!isFirstRow(rowNo) && !isLastRow(rowNo)) {
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

      // console.log(rowNo, currentRow[0].x, lastKey(currentRow).x + lastKey(currentRow).width, 'prev:', prevIntersectStart, prevIntersectEnd, 'next:', nextIntersectStart, nextIntersectEnd)

      if ((nextIntersectStart >= firstKey(currentRow).x) && (nextIntersectEnd >= lastKey(currentRow).x + lastKey(currentRow).width)) {
        rows.push(
          square([((nextIntersectEnd - nextIntersectStart) * switch_unit_w) - (inset_x * 2), switch_unit_l]).translate(
            [
              (nextIntersectStart * switch_unit_w) + inset_x,
              row_y_offset - inset_y
            ]
          )
        )
      }

      if ((prevIntersectStart >= firstKey(currentRow).x) && (prevIntersectEnd >= lastKey(currentRow).x + lastKey(currentRow).width)) {

        rows.push(
          square([((prevIntersectEnd - prevIntersectStart) * switch_unit_w) - (inset_x * 2), switch_unit_l]).translate(
            [
              (prevIntersectStart * switch_unit_w) + inset_x,
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

    var row_y_offset = ((keymap.length - 1) - (rowNo)) * dimensions.switch_unit_l

    rows.push(
      switchRow(keymap[rowNo])
        .translate([keymap[rowNo][0].x * dimensions.dswitch_unit_w, 0])
        .translate([0, row_y_offset])
    )
  }
  return union(rows)
}

// key is plane name
let layerPlans = {
  "cutouts": (keymap, plane) => difference(baseKeyboard(keymap), keyCutouts(keymap, plane)),
  "upper": (keymap, plane) => difference(baseKeyboard(keymap), keyCutouts(keymap, plane)),
  "case": (keymap, plane) => difference(baseKeyboard(keymap), caseCutouts(keymap)),
  "bottom": (keymap, _plane = undefined) => baseKeyboard(keymap)
}

function layerPlan(keymap, plane) {
  return layerPlans[plane](keymap, plane)
}

module.exports = {
  layerPlan,
  layerPlans
}