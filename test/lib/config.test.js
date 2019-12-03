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
  describe('dimensions -> stabilizers -> cutouts -> spacing is a single number', () => {
    beforeEach(() => {
      subject.loadDefaults()

      subject.dimensions.stabilizers.cutouts.spacing = 25
      console.log(subject.global.dimensions)
    })

    it('returns that number regardless of `width`', () => {
      expect(subject.stabilizerSpacingForWidth(2)).toBe(25)
      expect(subject.stabilizerSpacingForWidth(6)).toBe(25)
    })
  })

  describe('dimensions -> stabilizers -> cutouts -> spacing is a an object', () => {
    beforeEach(() => {
      subject.loadDefaults()

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

    // [[2, 24], [3, 24], [6, 76.2], [6.25, 76.2], [7, 76.2]].forEach((pair) => {
      // it(`returns ${pair[1]} for width of ${pair[0]}`, () => {
      //   expect(subject.stabilizerSpacingForWidth(pair[0])).toBe(pair[1])
      // })
    // })
  })


  // context: dimensions -> stabilizers -> cutouts -> spacing is an object
  // it returns the value where `width` is closest to the object key

})
