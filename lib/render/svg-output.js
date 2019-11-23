'use strict'

// These properties will be added to every <path> element in the SVG output
const pathElementAdditions = 'stroke="black" fill="lightgray" stroke-width="0.5"'
const { info, verbose } = require('../logger')
const fatalError = require('../fatal-error')
const { prepareOutput } = require('@jscad/core/io/prepareOutput')
const fs = require('fs')

function outputToSvg(csgDataFunction, kleSoureceFilename, argv) {
  const svgSource = prepareOutput(csgDataFunction(), { "format": "svg" }).data[0]

  var gElementsMatch = svgSource.match(/(\<g>.+\<\/g>)/s)

  if (!gElementsMatch || gElementsMatch[0].length < 1)
    fatalError(`Could not find any <g> elements in rendered SVG data:\n ${svgSource}`)

  /* handle multiple <g> tags */
  var gElements = gElementsMatch[0]
    .replace(/^\<g>/, '')    // remove leading
    .replace(/\<\/g>$/, '')  // remove trailing
    .split(/\<\/g>\s*\<g>/s) // split on "</g><g>" boundary

  verbose(`outputToSvg: Fixing ${gElements.length} <g> elements`)

  var gElementsRewrite = gElements.map(function (gElement) {

    // Separate each path element
    var pathElements = gElement
      .split(/(\<path\s+d=\".*\"\/\>)/)
      .filter(part => !part.match(/^\s+$/))

    verbose(`outputToSvg: Fixing ${pathElements.length} <path> elements`)

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
      verbose("outputToSvg: Will not re-order path elements")
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

  const outputSvgFilename = argv.outputFile || kleSoureceFilename + ".svg"

  // Write the new svg file with changed <g>/<path> elements
  fs.writeFileSync(
    outputSvgFilename,
    svgSource.replace(
      gElementsMatch[0],
      gElementsRewrite.map(pathElements => "<g>" + pathElements.join("\n") + "</g>").join("\n")
    )
  )

  info(`Wrote "${outputSvgFilename}"`)

}

module.exports = outputToSvg
