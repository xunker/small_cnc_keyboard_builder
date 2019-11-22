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

function info(...msg) {
  logMessage(logLevels.indexOf("info"), msg.join(' '))
}

function debug(...msg) {
  logMessage(logLevels.indexOf("debug"), msg.join(' '))
}

function verbose(...msg) {
  debug(msg.join(' '))
}

module.exports = {
  defaultLogLevel,
  logLevels,
  logLevel,
  setLogLevel,
  setLogLevelByName,
  info,
  debug, verbose,
  logMessage
}
