/* --- NODE DEPENDENCIES --- */
const express     = require('express')
    , app         = express()
    , JW          = require('jigawatt')
    , db          = require('mongoose')
    , R           = require('ramda')

/* --- INTERNAL DEPENDENCIES --- */
const schema = require('./schemas')

/* --- ENVIRONMENT SETTINGS --- */
db.connect('mongodb://localhost/data/pollar-dev')
db.Promise = global.Promise

/* --- Jigawatt --- */
const getAnswer   = (obj) => R.dec(obj.answer)
const getOnlyCity = (string) => {
  let city = R.replace(/\,.*$/, '', string)
  return R.assoc(city, 0, {})
}

const tallyVote = (res) => {

  console.log(res)
  return res
}

const mergeData = (options, responses) => {
  return tallyVote({ options, responses })
}

const jwPollDetails = {
  awesomize: (v) => ({
    poll      : { validate : [ v.required ] }
  , options   : { read : R.path([ 'poll' ]) }
  , responses : { validate : [ v.required ] }
  })

, io: (req, data) => ({
    poll    : data.poll.title
  //, options : R.map(getOnlyCity, data.options.questions)
  , results : mergeData(
      R.map(getOnlyCity, data.options.questions)
    , R.map(getAnswer, data.responses)
    )
  })
}

/* --- DB Interaction --- */
const findPoll  = (id) => schema.Poll.findOne({ _id: id })
const findVotes = (id) => schema.Vote.find({ poll_id: id })

/* --- ROUTES --- */
app.get('/poll-results', (req, res) => {
  const data = {
    poll      : findPoll('57f691081739bcb1144630a2')
  , responses : findVotes('57f691081739bcb1144630a2')
  }

  const formatPoll = JW(jwPollDetails, data)

  formatPoll(data, { json : (data) => data })
    .then((pollDetails) => {
      res.send(pollDetails)
    })
    .catch((err) => {
      console.log('There was an error here: ' + err)
    })
})

/* --- SERVER --- */
app.listen(8000, (err) => {
  if (err) return console.log('Could not start server!')
  console.log('Listening on port 8000')
})
