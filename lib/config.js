'use strict'

const fs = require('fs')
const mergeObjects = require('deepmerge')
const { info, verbose } = require('./logger')
const fatalError = require('./fatal-error')


const defaultConfig = {
  "extendFootprint": {
    "top": 0,
    "bottom": 0,
    "left": 0,
    "right": 0
  },
  "kerf": {},
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
        "y_offset":0.75
      }
    },
    "screws": {
      "diameter": 2
    }
  }
}
var infoConfig = {}
var globalConfig = defaultConfig

var sectionConfig = {}
var layerConfig = {}
var operationConfig = {}

var dimensions = {
  "round_inset_corners": true,
  // "round_inset_corners": false,

  "switch_unit_w": 19.05,
  "switch_unit_l": 19.05,

  "switch_cutout_w": 14,
  "switch_cutout_l": 14,

  "switch_cutout_corner_r": 0.3,

  // stabilizer to stabilizer
  "stabilizer_spacing": 24,
  "stabilizer_y_offset": 1.0,
  "stabilizer_cutout_width": 3.50,
  "stabilizer_cutout_length": 14,
  "stabilizer_cutout_corner_r": 0, // don't round these corners

  "ff": 0.01

}

const profileClassObjects = {
  'sections': sectionConfig,
  'layers': layerConfig,
  'operations': operationConfig
}
const profileClasses = Object.keys(profileClassObjects)

function singularizeProfileClass(name) {
  // this will break if we get operations that have complex conjugation
  return name.replace(/s$/, '')
}

function loadConfigurationFile(filePath) {
  // for when the -c flag is used more than once
  if (typeof (filePath) == "object") {
    filePath.forEach(function(value) {
      loadConfigurationFile(value)
    })
    return
  }
  verbose("loadConfigurationFile: loading", filePath)
  const jsonConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (let arr = ['name', 'keymap', 'notes'], idx = 0; idx < arr.length; idx++) {
    infoConfig[arr[idx]] = jsonConfig[arr[idx]]
  }

  if (jsonConfig['global'])
    globalConfig = mergeObjects(globalConfig, jsonConfig['global'])

  for (let idx = 0; idx < profileClasses.length; idx++) {
    let key = profileClasses[idx]
    let obj = profileClassObjects[key]

    if (jsonConfig[key]) {
      Object.keys(jsonConfig[key]).forEach(function (value, idx) {
        obj[value] = mergeObjects(globalConfig, jsonConfig[key][value])
      })
    }
  }

  verbose(`loadConfigurationFile: ${filePath} successfully loaded`)
}

function loadDefaults() {
  globalConfig = defaultConfig
  dimensions.kerf = defaultConfig['kerf']
  dimensions.extendFootprint = defaultConfig['extendFootprint']
}

function loadConfigurationProfile(profileClass, profileKey) {
  // for opts like -o (operation) that can be passed multiple times from command line
  if (typeof (profileKey) == "object") {
    profileKey.forEach(function(value) {
      loadConfigurationProfile(profileClass, value)
    })
    return
  }

  verbose(`loadConfigurationProfile: ${profileClass} ${profileKey}`)
  if (profileClasses.indexOf(profileClass) == -1)
    fatalError(`invalid profile class name ${profileClass}. Must be one of ${profileClasses}`)

  let profileClassObject = profileClassObjects[profileClass]

  let profile = profileClassObject[profileKey]

  if (!profile) {
    if (profileClass == "section") {
      verbose(`No configuration for ${singularizeProfileClass(profileClass)} ${profileKey} in configuration file`)
      return
    }

    fatalError(`${singularizeProfileClass(profileClass)} "${profileKey}" was specified but was not found in configuration file.`)
  }

  // Switch Unit Dimensions
  for (let arr = [
    ["switch_unit_w", "width"],
    ["switch_unit_l", "length"]
  ], idx = 0; idx < arr.length; idx++) {
    if (profile.dimensions.switches.unit) {
      if (profile.dimensions.switches.unit[arr[idx][1]]) {
        dimensions[arr[idx][0]] = profile.dimensions.switches.unit[arr[idx][1]]
      }
    }
  }

  // Switch Cutout Dimensions
  for (let arr = [
    ["switch_cutout_w", "width"],
    ["switch_cutout_l", "length"],
    ["switch_cutout_corner_r", "corner_radius"]
  ], idx = 0; idx < arr.length; idx++) {
    if (profile.dimensions.switches.cutouts) {
      if (profile.dimensions.switches.cutouts[arr[idx][1]]) {
        dimensions[arr[idx][0]] = profile.dimensions.switches.cutouts[arr[idx][1]]
      }
    }
  }

  // Stabilizer Dimensions
  for (let arr = [
    ["stabilizer_spacing", "spacing"],
    ["stabilizer_y_offset", "y_offset"],
    ["stabilizer_cutout_corner_r", "corner_radius"],
    ["stabilizer_cutout_width", "width"],
    ["stabilizer_cutout_length", "length"]
  ], idx = 0; idx < arr.length; idx++) {
    if (profile.dimensions.stabilizers.cutouts) {
      if (profile.dimensions.stabilizers.cutouts[arr[idx][1]]) {
        dimensions[arr[idx][0]] = profile.dimensions.stabilizers.cutouts[arr[idx][1]]
      }
    }
  }

  // Kerf adjustments
  if (profile.kerf) {
    let defaultKerf = parseFloat(profile.kerf.default)

    if (!profile.kerf.switches)
      profile.kerf.switches = {}
    if (!profile.kerf.stabilizers)
      profile.kerf.stabilizers = {}

    if (defaultKerf > 0.0) {
      verbose(`Applying default kerf of ${defaultKerf}`)

      if (!profile.kerf.switches.cutouts)
        profile.kerf.switches.cutouts = defaultKerf

      if (!profile.kerf.stabilizers.cutouts)
        profile.kerf.stabilizers.cutouts = defaultKerf

      if (!profile.kerf.case)
        profile.kerf.case = defaultKerf

      if (!profile.kerf.footprint)
        profile.kerf.footprint = defaultKerf
    }

    dimensions.kerf = dimensions.kerf || {}
    if (profile.kerf)
      dimensions.kerf = mergeObjects(dimensions.kerf, profile.kerf)

    if (dimensions.kerf.switches.cutouts) {
      dimensions.switch_cutout_w -= parseFloat(dimensions.kerf.switches.cutouts)
      dimensions.switch_cutout_l -= parseFloat(dimensions.kerf.switches.cutouts)
    }

    if (dimensions.kerf.stabilizers.cutouts) {
      dimensions.stabilizer_cutout_width -= parseFloat(dimensions.kerf.stabilizers.cutouts)
      dimensions.stabilizer_cutout_length -= parseFloat(dimensions.kerf.stabilizers.cutouts)
    }

    dimensions.extendFootprint = dimensions.extendFootprint || {}
    if (profile.extendFootprint)
      dimensions.extendFootprint = mergeObjects(dimensions.extendFootprint, profile.extendFootprint)

    dimensions.screws = dimensions.screws || {}
    if (profile.screws)
      dimensions.screws = mergeObjects(dimensions.screws, profile.screws)
  }
}

module.exports = {
  loadConfigurationFile: loadConfigurationFile,
  loadConfigurationProfile: loadConfigurationProfile,
  loadDefaults: loadDefaults,
  info: infoConfig,
  global: globalConfig,
  sections: sectionConfig,
  layers: layerConfig,
  operations: operationConfig,
  dimensions: dimensions
}
