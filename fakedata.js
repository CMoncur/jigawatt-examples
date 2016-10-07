app.get('/makedevpoll', (req, res)=> {
  let poll = new schema.Poll(
    { title             : 'What is your favorite city?'
    , questions         : [ 'Juneau, Alaska'
                          , 'Vladivostok, Russia'
                          , 'Redding, California'
                          , 'Wilmington, North Carolina'
                          , 'Galveston, Texas'
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
  { poll_id     : '57f691081739bcb1144630a2'
  , user_id     : '1'
  , answer      : 5
  , private     : false
  })

  vote.save((err, vote)=> {
    if (err) return console.log(err)
    console.log(vote)
  })
})

// Grab poll from db
let poll = schema.Poll.findOne(
  { _id: '57f691081739bcb1144630a2' },
  (err, qRes)=> {
    if (err) return console.error(err)
    console.log('Results for: ' + qRes.title)
  }
)
