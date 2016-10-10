/* --- NODE DEPENDENCIES --- */
const express = require('express')
    , app     = express()
    , JW      = require('jigawatt')
    , mg      = require('mongoose')
    , R       = require('ramda')

/* --- INTERNAL DEPENDENCIES --- */
const db = require('./example-schemas')

const schema = require('./example-schemas')

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
// getAnswer :: [ Integer ] -> [ Integer ]
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
We know that the length of the IDs for each poll are equal to 24,
so we want to ensure that the ID gathered from the endpoint is
the correct length.
*/
// isCorrectLength :: String -> Bool
const isCorrectLength = (str) => R.equals(24, str.length)

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
This Jigawatt middleware function is given an ID as input data.
First, it ensures that the ID is only integers and lowercase
numbers, then ensures that is is the correct length to query the
database.

IO makes two calls to the database, one to gather the poll and
details, and the next to gather all responses to that poll, to
include data about the responder.

The poll will have a structure like this:

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

And the responses will be structured like this:

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

Lastly, transform will take the data collected by IO and format
it in a structure that we want.  In this case, we want to return
an object with a poll title and a list of response objects that
include cities and their respective votes:

{
	"poll": "What is your favorite city?",
	"results": [ { "Juneau": 2 }
             , { "Vladivostok": 3 }
             , { "Redding": 1	}
             , { "Wilmington": 0 }
             , { "Galveston": 2	}
             ]
}
*/
const pollDetails = {
  // We have three
  awesomize: (v) => ({
    pollId : {
      sanitize : R.toLower
    , validate : isCorrectLength
    }
  })

, io: (req, data) => ({
    poll      : db.Poll.findOne({ _id: data.pollId })
  , responses : db.Vote.find({ poll_id: data.pollId })
  })

, transform: (req, data) => ({
    poll    : data.poll.title
  , results : tallyVotes(
                getCity(data.poll)
              , getAnswer(data.responses)
              )
  })
}

/* --- ROUTES --- */
app.get('/best-city-results', (req, res) => {
  const data       = { pollId : '57fc0a8c68faaf2e17250226' }
      , formatPoll = JW(pollDetails, data)

  formatPoll(data, { json : (data) => data })
    .then((details) => res.send(details))
    .catch((err) => console.log('There was an error here: ' + err))
})

/* --- SERVER --- */
app.listen(8000, (err) => {
  if (err) return console.log('Could not start server!')
  console.log('Listening on port 8000')
})
