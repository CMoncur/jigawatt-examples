/* --- NODE DEPENDENCIES --- */
const express = require('express')
    , app     = express()
    , JW      = require('jigawatt')
    , mg      = require('mongoose')
    , R       = require('ramda')

/* --- INTERNAL DEPENDENCIES --- */
const db = require('./example-schemas')

/* --- ENVIRONMENT SETTINGS --- */
mg.connect('mongodb://localhost/data/pollar-dev')
mg.Promise = global.Promise

/* --- Jigawatt Middleware --- */
/*
Because indexes of our lists start at 0, responses are coming
from the database unmatched to the option thereunto pertaining.
We need to decrement each response so they align with the options
that the users are voting for.
*/
// getAnswer :: [ Object ] -> [ Integer ]
const getAnswer = (arr) => R.compose(
  R.map(R.dec)
, R.pluck('answer')
)(arr)

/*
Each city comes from the database with the city name and the
country or state that the city is in.  This is more verbose than
what we want, so let's truncate each string at the comma so that
we're just left with the city name.
*/
// getCity :: Object -> [ String ]
const getCity = (obj) => R.map(
  R.replace(/\,.*$/, '')
, obj.questions
)

/*
We have two lists now -- a list of cities and a list of responses.
We have to tally the votes for each city and display the total
for each city alongside the city name.
*/
// tallyVotes :: [ String ] -> [ Int ] -> [ Object ]
const tallyVotes = (options, responses) => {
  // Tally total vote for a specific city
  return R.map((str) => {
    let ind = R.indexOf(str, options)
    let votes = R.compose(
      R.length
    , R.filter(R.equals(ind))
    )(responses)

    return R.assoc(str, votes, {})
  }, options)
}

/*
The Jigawatt middleware function (pollDetails) is given two
promises from  MongoDB. The first is a poll, which when resolved,
will have a structure like this:

{ _id: 57f691081739bcb1144630a2,
  title: 'What is your favorite city?',
  creator_id: '1234',
  location: 'Las Vegas',
  location_type: 'City',
  private: false,
  __v: 0,
  questions:
   [ 'Juneau, Alaska',
     'Vladivostok, Russia',
     'Redding, California',
     'Wilmington, North Carolina',
     'Galveston, Texas' ] }

The second is a list of responses to that poll. It will have a
structure such as:

[ { _id: 57f69170526f05b5dbe4d035,
    poll_id: '57f691081739bcb1144630a2',
    user_id: '1111',
    answer: 1,
    private: false,
    __v: 0 },
  { _id: 57f691784949d5b68c337548,
    poll_id: '57f691081739bcb1144630a2',
    user_id: '1112',
    answer: 2,
    private: false,
    __v: 0 },

  ...
]

Our Jigawatt middleware
*/
const pollDetails = {
  // We have three
  awesomize: (v) => ({
    poll     : { validate : [ v.required ] }
  , options  : {
      read     : R.path([ 'poll' ])
    , sanitize : [ getCity ]
    , validate : [ v.required, v.isArray ]
    }
  , responses : {
      read     : R.path([ 'responses' ])
    , sanitize : [ getAnswer ]
    , validate : [ v.required, v.isArray ]
    }
  })

, transform: (req, data) => ({
    poll    : data.poll.title
  , results : tallyVotes(data.options, data.responses)
  })
}

/* --- ROUTES --- */
app.get('/best-city-results', (req, res) => {
  const data = {
    poll      : db.Poll.findOne({ _id: '57f691081739bcb1144630a2' })
  , responses : db.Vote.find({ poll_id: '57f691081739bcb1144630a2' })
  }

  const formatPoll = JW(pollDetails, data)

  formatPoll(data, { json : (data) => data })
    .then((details) => res.send(details))
    .catch((err) => console.log('There was an error here: ' + err))
})

/* --- SERVER --- */
app.listen(8000, (err) => {
  if (err) return console.log('Could not start server!')
  console.log('Listening on port 8000')
})
