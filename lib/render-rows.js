'use strict'

const argv = require('./command-line-args')

var renderRows = []
if (argv.rows != undefined) {
  if (argv.rows.match('-')) {
    for (let i = parseInt(argv.rows.split('-')[0]); i <= parseInt(argv.rows.split('-')[1]); i++) {
      renderRows.push(i)
    }
  } else {
    renderRows.push(parseInt(argv.rows))
  }
}

module.exports = renderRows
