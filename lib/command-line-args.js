'use strict'

const { layerPlans } = require('./layer-plans')
const fatalError = require('./fatal-error')

function commandLineArgs() {
  // Set up and validate command line arguments
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
    .option('layer', {
      alias: 'l',
      type: 'string',
      default: 'cutouts',
      description: `Which layer to generate; (${Object.keys(layerPlans).join(", ")})`
    })
    .option('configFile', {
      alias: 'c',
      type: 'string',
      description: 'configuration file path (optional)'
    })
    .usage('Build a keyboard plate and post-process the resultant SVG\n\nUsage: $0 [layoutFilename.js] [options]')
    .strict()
    .argv

  if (Object.keys(layerPlans).indexOf(argv.layer) == -1)
    fatalError(`Invalid layer "${argv.layer}". Layer must be one of: ${Object.keys(layerPlans).join(", ")}`)

  if (!argv._[0])
    fatalError("Must provide path to KLE Json file as argument. See '--help' for more information.")

  return argv
}

module.exports = commandLineArgs()
