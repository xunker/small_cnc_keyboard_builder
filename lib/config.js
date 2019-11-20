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

function loadConfigurationFile(filePath) {
  const jsonConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (var arr = ['name', 'keymap', 'notes'], idx = 0; idx < arr.length; idx++) {
    infoConfig[arr[idx]] = jsonConfig[arr[idx]]
  }

  if (jsonConfig['global'])
    globalConfig = mergeObjects(globalConfig, jsonConfig['global'])

  if (jsonConfig['sections']) {
    Object.keys(jsonConfig['sections']).forEach(function(value, idx) {
      sectionConfig[value] = mergeObjects(globalConfig, jsonConfig['sections'][value])
    })
  }

  if (jsonConfig['layers']) {
    Object.keys(jsonConfig['layers']).forEach(function (value, idx) {
      layerConfig[value] = mergeObjects(globalConfig, jsonConfig['layers'][value])
    })
  }

  if (jsonConfig['operations']) {
    Object.keys(jsonConfig['operations']).forEach(function (value, idx) {
      operationConfig[value] = mergeObjects(globalConfig, jsonConfig['operations'][value])
    })
  }
}

module.exports = {
  loadConfigurationFile: loadConfigurationFile,
  info: infoConfig,
  global: globalConfig,
  sections: sectionConfig,
  layers: layerConfig,
  operations: operationConfig
}
