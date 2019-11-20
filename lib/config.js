'use strict'

const fs = require('fs')
const mergeObjects = require('deepmerge')

var infoConfig = {}
var globalConfig = {
  "extendFootprint": {
    "top": 0,
    "bottom": 0,
    "left": 0,
    "right": 0
  },
  "kerf": {
    "outline": 0.0
  },
  "dimensions": {
    "switches": {
      "unit": {
        "width": 19.05,
        "length": 19.05
      },
      "cutouts": {
        "width": 14,
        "length": 14,
        "corner_radius": 0.3
      }
    },
    "stabilizers": {
      "cutouts": {
        "spacing": 24,
        "width": 3.5,
        "length": 14,
        "corner_radius": 0,
        "y_offset": 1.0
      }
    }
  }
}

var sectionConfig = {}
var layerConfig = {}
var operationConfig = {}

const profileClassObjects = {
  'sections': sectionConfig,
  'layers': layerConfig,
  'operations': operationConfig
}
const profileClasses = Object.keys(profileClassObjects)

function loadConfigurationFile(filePath) {
  const jsonConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (let arr = ['name', 'keymap', 'notes'], idx = 0; idx < arr.length; idx++) {
    infoConfig[arr[idx]] = jsonConfig[arr[idx]]
  }

  if (jsonConfig['global'])
    globalConfig = mergeObjects(globalConfig, jsonConfig['global'])


  for (let idx = 0; idx < profileClasses.length; idx++) {
    let key = profileClasses[idx]
    let obj = profileClassObjects[key]

    Object.keys(jsonConfig[key]).forEach(function (value, idx) {
      obj[value] = mergeObjects(globalConfig, jsonConfig[key][value])
    })
  }
}

function loadConfigurationProfile(profileClass, profileKey) {
  console.log("loadConfigurationProfile:", profileClass, profileKey)
  if (profileClasses.indexOf(profileClass) == -1)
    throw Error(`invalid profile class name ${profileClass}. Must be one of ${profileClasses}`)

  let profileClassObject = profileClassObjects[profileClass]

  let profile = profileClassObject[profileKey]

  if (!profile) {
    console.log(`No configuration for ${profileClass} ${profileKey} in configuration file`)
    return
  }

  // console.log(profile)

}

module.exports = {
  loadConfigurationFile: loadConfigurationFile,
  loadConfigurationProfile: loadConfigurationProfile,
  info: infoConfig,
  global: globalConfig,
  sections: sectionConfig,
  layers: layerConfig,
  operations: operationConfig
}
