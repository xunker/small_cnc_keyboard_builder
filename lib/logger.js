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

function logMessage(level, data, ...args) {
  if (logLevel > level)
    return

  args = args.filter((x) => typeof (x) != 'undefined')
  if (typeof(data) == 'object') {
    if (args.length) {
      console.log(`${logLevels[level]}:`)
      console.log(data, args.join(' '))
    } else {
      console.log(`${logLevels[level]}:`)
      console.log(data)
    }
  } else {
    if (args.length) {
      console.log(`${logLevels[level]}: ${data}`, args.join(' '))
    } else {
      console.log(`${logLevels[level]}: ${data}`)
    }
  }

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
  module.exports[levelName] = function (data, args) {
    logMessage(logLevels.indexOf(levelName), data, args)
  }
})

// add alias to "debug" method in case there is a keyword class.. or you just prefer it
module.exports.verbose = module.exports.debug

