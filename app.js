const express = require('express')
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors')

// 跨域
// const whitelist = ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082']
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
// }

const index = require('./routes/index')
const sessionRouter = require('./routes/session')
const userRouter = require('./routes/users')
const ownerRouter = require('./routes/owners')
const shopRouter = require('./routes/shops')
const commodityRouter = require('./routes/commodities')
const favorRouter = require('./routes/favors')
const reportRouter = require('./routes/reports')
const lbsRouter = require('./routes/lbs')
const commonRouter = require('./routes/common')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 1000000,
  }),
)
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// 跨域
// app.use(cors(corsOptions))
app.use(cors())

app.use('/', index)
app.use('/session', sessionRouter)
app.use('/users', userRouter)
app.use('/owners', ownerRouter)
app.use('/shops', shopRouter)
app.use('/commodities', commodityRouter)
app.use('/favors', favorRouter)
app.use('/reports', reportRouter)
app.use('/lbs', lbsRouter)
app.use('/common', commonRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) { // eslint-disable-line
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// socket.io
const {
  addSocketId,
  deleteSocketId,
  updateLocation,
} = require('./utils/socket')

const server = require('http').Server(app)
const io = require('socket.io')(server)

server.listen(80)

global.users = [] // 记录下用户的sid, lat, lng
global.io = io

io.on('connection', function(socket) {
  socket.on('disconnect', function() {
    deleteSocketId(global.users, socket.id)
  })
  socket.on('user_connect', function(location) {
    addSocketId(global.users, {
      socketId: socket.id,
      lat: location.lat,
      lng: location.lng,
    })
  })
  socket.on('user_update_location', function(newLocation) {
    updateLocation(global.users, {
      socketId: socket.id,
      lat: newLocation.lat,
      lng: newLocation.lng,
    })
  })
})

module.exports = app
