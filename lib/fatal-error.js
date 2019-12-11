'use strict'

function fatalError(msg, exitCode = 1) {
  console.log(`Unercoverable Error: ${msg}`)
  process.exit(exitCode)
}

module.exports = fatalError
