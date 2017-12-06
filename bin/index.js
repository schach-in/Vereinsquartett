'use strict'

const async = require('async')
const path = require('path')
const fs = require('fs')
const csv = require('csv-parse')
const concat = require('concat-stream')

const pdf = require('./lib/card-generator')()

const SRC_DIR = path.resolve(__dirname, '../src')
const DATA_DIR = path.resolve(SRC_DIR, 'data')
const DEST_DIR = path.resolve(__dirname, '../dist')

const ALPHABET = 'ABCDEFGHIJKMNOPQRSTUVWXYZ'
const ID_PARTS = 6

try {
  fs.mkdirSync(DEST_DIR)
} catch (e) {
  if (e.code !== 'EEXIST') throw e
}

function loadCSV (filename, callback) {
  var stream = fs.createReadStream(filename)
  stream.on('error', function (error) {
    callback(error)
  })
  stream.pipe(csv({
    columns: true
  }))
    .pipe(concat(callback.bind(null, null)))
}

let categories = [
  {
    name: 'Gründungsjahr',
    find: verein => parseInt(verein.gruendung.slice(0, 4)) || '—',
    reverse: true
  },
  {
    name: 'Mitglieder',
    find: verein => verein.mitglieder,
    reverse: true
  },
  {
    name: 'Anteil weiblicher Mitglieder',
    find: verein => Math.round(verein.weibliche_mitglieder / verein.mitglieder * 100) + ' %'
  },
  {
    name: 'Anteil Jugendliche',
    find: verein => Math.round(verein.jugendliche / verein.mitglieder * 100) + ' %'
  },
  {
    name: 'Durchschnitts-DWZ',
    find: verein => verein.durchschnitts_dwz
  },
  {
    name: 'DVM-Teilnahmen',
    notice: 'seit 2003',
    find: verein => verein.dvm_teilnahmen
  }
]

const filename = path.resolve(DATA_DIR, 'vereine.csv')
loadCSV(filename, function (err, vereine) {
  if (err) {
    throw err
  }

  let i = 0
  async.eachLimit(vereine, 1, (verein, cardDone) => {
    let cardId = ALPHABET[i / ID_PARTS | 0] + (i % ID_PARTS + 1)

    let website = verein.website
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')

    let name = verein.name
      .replace(/ e\. ?V\.?/, '')
      .replace(/ eV.?/, '')
      .replace('  ', ' ')

    let card = {
      name: name,
      id: cardId,
      zps: verein.zps,
      verband: '(tbd)',
      website: website,
      values: categories.map(category => ({
        name: category.name,
        value: category.find(verein)
      }))
    }

    pdf.add(card).then(cardDone)
    .catch((err) => {
      console.error(err)
      cardDone(err)
    })
    i++
  }, function () {
    pdf.end()
    pdf.doc.pipe(fs.createWriteStream(path.resolve(DEST_DIR, 'output.pdf')))
  })
})
