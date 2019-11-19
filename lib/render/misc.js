'use strict'

module.exports = {
  rounded_rect
}

const dimensions = require('../dimensions')

const {
  vector_text, vector_char,
  square, circle,
  union, difference,
  rotate, translate, scale, mirror, hull, chain_hull, expand, contract,
} = require('../render')

function rounded_rect(w, l, r = 0.5) {
  // $fn = 12;
  if ((dimensions.round_inset_corners) && (r > 0.0)) {
    return hull(
      circle({ r: r, center: true }).translate([r, r]),
      circle({ r: r, center: true }).translate([w - r, r]),
      circle({ r: r, center: true }).translate([r, l - r]),
      circle({ r: r, center: true }).translate([w - r, l - r])
    )
  } else {
    return square([w, l])
  }
}
