'use strict'

const fatalError = require('./fatal-error')
const { setLogLevelByName } = require('./logger')

function commandLineArgs() {
  // Set up and validate command line arguments
  var argv = require('yargs')
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'print out extra debugging information'
    })
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
      default: 'cutout',
      description: `Which layer to generate`
    })
    .option('configFile', {
      alias: 'c',
      type: 'string',
      description: 'configuration file path (optional)'
    })
    .option('operation', {
      alias: 'o',
      type: 'string',
      description: 'operation to perform (optional)'
    })
    .option('truncate', {
      alias: 't',
      type: 'string',
      description: `Truncate output SVG with given dimensions (as percentages): "-t 0,0,50,50"`
    })
    .usage('Build a keyboard plate and post-process the resultant SVG\n\nUsage: $0 [layoutFilename.js] [options]')
    .strict()
    .argv

  if (!argv._[0])
    fatalError("Must provide path to KLE Json file as argument. See '--help' for more information.")

  return argv
}

module.exports = commandLineArgs()
