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
// getAnswer :: [ Object ] -> [ Integer ]
const getAnswer = (arr) => R.compose(
  R.map(R.dec)
, R.pluck('answer')
)(arr)

// getCity :: Object -> [ String ]
const getCity = (obj) => R.map(
  R.replace(/\,.*$/, '')
, obj.questions
)

// tallyVotes :: [ String ] -> [ Int ] -> [ Object ]
const tallyVotes = (options, responses) => {
  // Tally total vote for a specific city
  return R.map((str) => {
    let ind   = R.indexOf(str, options)
    let votes = R.compose(
      R.length
    , R.filter(R.equals(ind))
    )(responses)

    return R.assoc(str, votes, {})
  }, options)
}

/*
getPollQuestion
The input will look like this:

{ "poll" : "57f691081739bcb1144630a2"
, "responder" : "1"
, "response" : 2
}

And the output will look like this:

{ "title" : "What is your favorite city?"
, "responder" : "1"
, "response" : "Vladivostok, Russia"
}
*/
const getPollQuestion = {
  awesomize: (v) => ({
    poll : {
      read : R.path([ 'data', 'pollId' ])
    , validate : [ v.required ]
    }
  })

, io: (req, data) => ({
    poll : db.Poll.findOne({ _id: data.poll })
  })

, transform: (req, data) => ({
    poll        : data.poll.title
  , responderId : data.responder
  , response    : R.nth(R.dec(data.response), data.poll.questions)
  })
}

/*
getPollResults
The poll will have an initial structure like this:

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

The output will look like this:

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
const getPollResults = {
  awesomize: (v) => ({
    pollId : {
      read     : R.path([ 'params', 'pollId' ])
    , sanitize : [ R.toLower ]
    , validate : [ v.required ]
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

/*
getSingleVote
The vote will have an initial structure like this:

{ _id: 57f69170526f05b5dbe4d035,
  poll_id: '57f691081739bcb1144630a2',
  user_id: '1111',
  answer: 1,
  private: false,
  __v: 0 }

The output will look like this:

{ "poll" : "57f691081739bcb1144630a2"
, "responder" : "1"
, "response" : 2
}
*/

const getSingleVote = {
  awesomize: (v) => ({
    voteId : {
      read : R.path([ 'params', 'voteId' ])
    , validate : [ v.required ]
    }
  })

, io: (req, data) => ({
    vote : db.Vote.findOne({ _id: data.voteId })
  })
, transform: (req, data) => ({
    pollId    : data.vote.poll_id
  , responder : data.vote.user_id
  , response  : data.vote.answer
  })
}

//pollId : '57f691081739bcb1144630a2'
//voteId : '57f691784949d5b68c337548'

/* --- ROUTES --- */
// Will display poll question with options and responses
app.get('/poll/:pollId', JW(getPollResults))

// Will display a single vote with voter metadata
app.get('/vote/:voteId', JW(
  JW.pipe(getSingleVote, getPollQuestion)
))

/* --- SERVER --- */
app.listen(8000, (err) => err
  ? console.log('Could not start server!')
  : console.log('Listening on port 8000')
)
