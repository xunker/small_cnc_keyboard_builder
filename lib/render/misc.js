'use strict'

module.exports = {
  rounded_rect
}

// const dimensions = require('../dimensions')
const {dimensions} = require('../config')

const {
  vector_text, vector_char,
  square, circle,
  union, difference,
  rotate, translate, scale, mirror, hull, chain_hull, expand, contract,
} = require('./openjscad')

function rounded_rect(w, l, options = {}) {
  let r = options["r"] || 0.5

  // $fn = 12;
  if ((dimensions.round_inset_corners) && (r > 0.0)) {
    let corners = []

    if (options["nw"] == false) {
      corners.push(square([1, 1], { center: true }).translate([r, l - r]))
    } else {
      corners.push(circle({ r: r, center: true }).translate([r, l - r]))
    }

    if (options["ne"] == false) {
      corners.push(square([1, 1], { center: true }).translate([w - r, l - r]))
    } else {
      corners.push(circle({ r: r, center: true }).translate([w - r, l - r]))
    }

    if (options["sw"] == false) {
      corners.push(square([1, 1], { center: true }).translate([r, r]))
    } else {
      corners.push(circle({ r: r, center: true }).translate([r, r]))
    }

    if (options["se"] == false) {
      corners.push(square([1, 1], { center: true }).translate([w - r, r]))
    } else {
      corners.push(circle({ r: r, center: true }).translate([w - r, r]) )
    }

    return hull(corners)

    // return hull(
    //   circle({ r: r, center: true }).translate([r, r]),
    //   circle({ r: r, center: true }).translate([w - r, r]),
    //   circle({ r: r, center: true }).translate([r, l - r]),
    //   circle({ r: r, center: true }).translate([w - r, l - r])
    // )
  } else {
    return square([w, l])
  }
}
