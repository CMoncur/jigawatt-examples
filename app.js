/* --- NODE DEPENDENCIES --- */
const express     = require('express')
    , app         = express()
    , svr         = require('http').createServer(app)
    , io          = require('socket.io')(svr)
    , mongoose    = require('mongoose')
    , db          = mongoose.connection
    , request     = require('request')

/* --- INTERNAL DEPENDENCIES --- */
const schema = require('./schemas')

/* --- ENVIRONMENT SETTINGS --- */
app.set('view engine', 'pug') // Declare Pug as templating engine
app.use(express.static(__dirname)) // Declare default directory
mongoose.connect('mongodb://localhost/data/pollar-dev')

/* --- ROUTES --- */
app.get('/', (req, res)=> {
  res.render('index', {
    title     : 'pollar',
    stuff     : 'hay dude'
  })
})

app.get('/makedevpoll', (req, res)=> {
  let poll = new schema.Poll({
    title             : ''
  , questions         : { type: String, required: true }
  , creator           : { type: String, required: true }
  , location          : { type: String, required: true }
  , location_type     : { type: String, required: true }
  , private           : { type: Boolean, required: true }
  })

  poll.save((err, poll)=> {
    if (err) return console.log(err)
    console.log(poll)
  })
})

/* --- SOCKETS --- */
io.on('connection', (socket)=> {
  console.log('User connected')

  socket.on('disconnect', ()=> {
    console.log('User disconnected')
  })

  socket.emit('user connected', 'sup')
})

/* --- SERVER --- */
svr.listen(3000, (err)=> {
  if (err) return console.log('Could not start server!')
  console.log('Listening on port 3000')
})
