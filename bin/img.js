const path = require('path')
const Pageres = require('pageres')

const IMG_DIR = path.resolve(__dirname, '../src/data/images')

let zps = process.argv[2]
let url = 'http://schach.in/zps/' + zps

new Pageres({
  delay: 1.5,
  selector: '#bannermap',
  filename: zps,
  css: '.leaflet-control-attribution { display: none !important; }'
}).src(url, ['1024x768'])
  .dest(IMG_DIR)
  .run()
  .then(() => console.log(zps))
