'use strict'

jest.mock('fs')
const subject = require('../../lib/config')

beforeEach(() => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
    console.log("process.exit() called, but ignored")
  })
})

describe('config objects', () => {
  ["info", "global", "sections", "layers", "operations", "dimensions"].forEach((objName) => {
    describe(`.${objName}`, () => {
      it('is an object', () => {
        expect(typeof (subject[objName])).toBe("object")
      })
    })
  })
})

// describe('.loadConfiguration', () => {
//   describe('config file path passed', () => {
//     it('loads configuration file contents', () => {
//     })
//   })

//   describe('no config file path passed', () => {
//     it('loads defaults', () => {
//     })
//   })
// })

describe('.stabilizerSpacingForWidth', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
  })
  describe('dimensions -> stabilizers -> cutouts -> spacing is a single number', () => {
    beforeEach(() => {
      let config = {
        "global": {
          "dimensions": {
            "stabilizers": {
              "cutouts": {
                "spacing": 25
              }
            }
          }
        }
      }
      require('fs').__setMockFiles({
        'configFilename.js': JSON.stringify(config)
      })
    })

    it('returns that number regardless of `width`', () => {
      const subject = require('../../lib/config')

      subject.loadConfiguration({ configFile: 'configFilename.js' })

      expect(subject.stabilizerSpacingForWidth(2)).toBe(25)
      expect(subject.stabilizerSpacingForWidth(6)).toBe(25)

    })
  })

  describe('dimensions -> stabilizers -> cutouts -> spacing is a an object', () => {
    beforeEach(() => {
      subject.loadConfiguration({})

      subject.dimensions.stabilizers.cutouts.spacing = {
        6: 76.2,
        2: 24
      }
      // console.log(subject.global.dimensions)
    })

    it('returns 24 for width 2', () => {
      expect(subject.stabilizerSpacingForWidth(2)).toBe(24)
    })

    it('returns 24 for width 3', () => {
      expect(subject.stabilizerSpacingForWidth(3)).toBe(24)
    })

    it('returns 76.2 for width 6', () => {
      expect(subject.stabilizerSpacingForWidth(6)).toBe(76.2)
    })

    it('returns 76.2 for width 6.25', () => {
      expect(subject.stabilizerSpacingForWidth(6.25)).toBe(76.2)
    })

    it('returns 76.2 for width 7', () => {
      expect(subject.stabilizerSpacingForWidth(7)).toBe(76.2)
    })
  })


  // context: dimensions -> stabilizers -> cutouts -> spacing is an object
  // it returns the value where `width` is closest to the object key

})
