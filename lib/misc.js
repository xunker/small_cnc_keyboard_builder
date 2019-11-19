'use strict'

function rowLength(rowData) {
  return (rowData[rowData.length - 1].width + rowData[rowData.length - 1].x) - rowData[0].x;
}

function isFirstRow(rowNum) {
  return rowNum == 0
}

function isLastRow(rowNum) {
  return rowNum == keymap.length - 1
}

// return first key object in a row array
function firstKey(row) {
  return row[0]
}

// return last key object in a row array
function lastKey(row) {
  return row[row.length - 1]
}

function rangeIntersection(rangeA, rangeB) {
  let range_min = rangeA[0] < rangeB[0] ? rangeA : rangeB
  let range_max = range_min == rangeA ? rangeB : rangeA

  if (range_min[1] < range_max[0])
    return NaN // the ranges to not intersect

  return [range_max[0], (range_min[1] < range_max[1] ? range_min[1] : range_max[1])]
}

module.exports = {
  rowLength, isFirstRow, isLastRow, firstKey, lastKey, rangeIntersection
}