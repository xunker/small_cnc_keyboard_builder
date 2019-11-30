'use strict'

const subject = require('../../lib/config')

describe('config objects', () => {
  ["info", "global", "sections", "layers", "operations", "dimensions"].forEach((objName) => {
    describe(`.${objName}`, () => {
      it('is an object', () => {
        expect(typeof (subject[objName])).toBe("object")
      })
    })
  })
})

describe('.loadConfiguration', () => {
  describe('config file path passed', () => {
    it('loads configuration file contents', () => {
    })
  })

  describe('no config file path passed', () => {
    it('loads defaults', () => {
    })
  })
})
