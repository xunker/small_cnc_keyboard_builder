'use strict'

const fs = require('fs')
const argv = require('./command-line-args')
const { info, verbose } = require('./logger')

function loadKeymapFromFile(kleSoureceFilename) {
  let kle = require("@ijprest/kle-serial")

  verbose(`loadKeymapFromFile: Opening KLE file "${kleSoureceFilename}"`)

  const kleSourceData = fs.readFileSync(kleSoureceFilename, 'utf8')

  const keyboard = kle.Serial.parse(kleSourceData)

  if (argv.section != undefined)
    info(`Rendering only section ${argv.section}`)


  // keymap without keys skipped for sections
  let completeKeymap = []

  // first arrange keys in an array of arrays so
  // we can find the edges easier later
  for (const keyIndex in keyboard.keys) {
    let currentKey = keyboard.keys[keyIndex]
    if (!completeKeymap[currentKey.y])
      completeKeymap[currentKey.y] = []

    completeKeymap[currentKey.y].push(currentKey)
  }

  // keymap is [rowNumber][<keys objects>]
  var keymap = []

  var previousKey = undefined
  var sectionNumber = 0
  for (const rowIndex in completeKeymap) {
    let keyRow = completeKeymap[rowIndex]

    for (const keyIndex in keyRow) {
      let currentKey = keyRow[keyIndex]

      if (!keymap[currentKey.y]) {
        keymap[currentKey.y] = []

        if (rowIndex == 0)
          keymap[rowIndex].isFirstVisible = true

        if (rowIndex == completeKeymap.length - 1)
          keymap[rowIndex].isLastVisible = true
      }

      if (previousKey) {
        if (previousKey.y != currentKey.y) {
          sectionNumber = 0
        }

        if (previousKey.y == currentKey.y) {
          if (currentKey.color != previousKey.color)
            sectionNumber++
        }
      }

      previousKey = currentKey

      if ((argv.section != undefined) && (argv.section != sectionNumber)) {
        continue
      }

      if (keyIndex == 0)
        currentKey.isFirstVisible = true

      if (keyIndex == keyRow.length - 1)
        currentKey.isLastVisible = true


      keymap[currentKey.y].push(currentKey)
    }
  }


  return keymap
}

module.exports = loadKeymapFromFile
