'use strict'

const defaultLogLevel = 1
var logLevel = defaultLogLevel

const logLevels = [
  "debug",  // 0
  "info",   // 1
  "warn",   // 2
  "error",  // 3
  "fatal",  // 4
  "unknown" // 5
]

function setLogLevel(level) {
  if (!logLevels[level] )
    throw Error(`Invalid log level ${level}`)

  logLevel = level
}

function setLogLevelByName(level) {
  setLogLevel(logLevels.indexOf(level))
}

function logMessage(level, ...msg) {
  if (logLevel > level)
    return

  console.log(msg.join(' '))
}

module.exports = {
  defaultLogLevel,
  logLevels,
  logLevel,
  setLogLevel,
  setLogLevelByName,
  logMessage
}

// dynamically create exportable functions for each log level
logLevels.forEach(function(levelName, idx) {
  module.exports[levelName] = function(...msg) {
    logMessage(logLevels.indexOf(levelName), msg.join(' '))
  }
})

// add alias to "debug" method in case there is a keyword class.. or you just prefer it
module.exports.verbose = function(...msg) {
  module.exports.debug(msg.join(' '))
}

