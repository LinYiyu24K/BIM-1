const path = require('path')
const fs = require('fs')

process.env.NODE_ENV = 'development'//自动设置成develop模式，为了方便调试
//process.env.NODE_ENV = 'production'//自动设置成develop模式，为了方便调试
//HOT_RELOADING的 在server的index.js里面改
process.env.HOT_RELOADING = true
//process.env.HOT_RELOADING = false
if (process.env.NODE_ENV === 'production') {

  const dist = path.resolve(__dirname, './dist')

  fs.stat(dist, (err, stats) => {
    if (err) {
      console.log('dist/ directory not found, starting compiler ...')
      require('./webpack')
    }
  })


  require('./webpack')
  //require('./static')

} else {

  require('babel-core/register')({
    plugins: ['transform-decorators-legacy'],
    presets: ['env', 'stage-0']
  })

  require('./src/server')////////这里是直接使用/src/server/index.js吗
}
