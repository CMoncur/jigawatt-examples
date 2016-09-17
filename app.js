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
  let poll = schema.Poll.findOne({ title: 'Test' }, (err, mgRes)=> {
    if (err) return console.error(err)
    return mgRes
  })

  let votes = schema.Vote.find({ poll_id: '57dcb156ba31c729fdb9b812' }, (err, mgRes)=> {
    if (err) return console.error(err)
    return mgRes
  })

  res.render('index',
    { title   : 'pollar'
    , poll    : poll
    , votes   : votes
  })
})

app.get('/makedevpoll', (req, res)=> {
  let poll = new schema.Poll(
  { title             : 'Test'
  , questions         : [ 'Lorem'
                        , 'Ipsum'
                        , 'Dolor'
                        , 'Sit'
                        , 'Amet'
                        ]
  , creator_id        : '1'
  , location          : 'Test'
  , location_type     : 'Test'
  , private           : false
  })

  poll.save((err, poll)=> {
    if (err) return console.log(err)
    console.log(poll)
  })
})

app.get('/votedevpoll', (req, res)=> {
  let vote = new schema.Vote(
  { poll_id     : '57dcb156ba31c729fdb9b812'
  , user_id     : '1'
  , answer      : 3
  , private     : false
  })

  vote.save((err, vote)=> {
    if (err) return console.log(err)
    console.log(vote)
  })
})

/* --- SOCKETS --- */
io.on('connection', (socket)=> {
  console.log('User connected')

  socket.on('disconnect', ()=> {
    console.log('User disconnected')
  })

  socket.emit('user connected', 'socket.io is working...')
})

/* --- SERVER --- */
svr.listen(3000, (err)=> {
  if (err) return console.log('Could not start server!')
  console.log('Listening on port 3000')
})
