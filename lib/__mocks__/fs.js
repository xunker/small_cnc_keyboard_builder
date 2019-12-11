// https://medium.com/@shashankshekhar_40767/using-jest-mocking-to-run-tests-on-a-simple-node-script-dealing-with-fs-module-db8bc01ff583
// https://jestjs.io/docs/en/manual-mocks
'use strict'

const fs = jest.genMockFromModule("fs")
const path = require("path")

// example of newMockFiles
// { "./testFolder/file1.txt": "This is the file content"
let mockFiles = Object.create(null)
function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null)
  for (const file in newMockFiles) {
    mockFiles[file] = newMockFiles[file]
  }
}

function readFileSync(pathToFile) {
  return mockFiles[pathToFile]
}

fs.readFileSync = readFileSync
fs.__setMockFiles = __setMockFiles
module.exports = fs
