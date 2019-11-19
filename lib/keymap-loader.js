'use strict'

const fs = require('fs')
const argv = require('./command-line-args')

function loadKeymapFromFile(kleSoureceFilename) {
  let kle = require("@ijprest/kle-serial")

  console.log(`Opening KLE file "${kleSoureceFilename}"`)

  const kleSourceData = fs.readFileSync(kleSoureceFilename, 'utf8')

  const keyboard = kle.Serial.parse(kleSourceData)

  // keymap is [rowNumber][<keys objects>]
  var keymap = []

  var previousKey = undefined
  var sectionNumber = 0
  for (const keyIndex in keyboard.keys) {
    let currentKey = keyboard.keys[keyIndex]

    if (!keymap[currentKey.y])
      keymap[currentKey.y] = []

    if (previousKey) {
      if (previousKey.y != currentKey.y) {
        sectionNumber = 0
      }

      if (previousKey.y == currentKey.y) {
        if (currentKey.color != previousKey.color)
          sectionNumber++
      }
    }

    // let correctSection = (argv.section == undefined) || (argv.section == sectionNumber)
    // console.log(currentKey.labels, sectionNumber, argv.section, correctSection)
    previousKey = currentKey

    if ((argv.section != undefined) && (argv.section != sectionNumber)) {
      continue
    }

    keymap[currentKey.y].push(currentKey)

    // console.log(currentKey)
  }

  return keymap
}

module.exports = loadKeymapFromFile
