const mongoose = require('mongoose')

const pollSchema = new mongoose.Schema(
  { title             : { type: String, required: true }
  , questions         : { type: Array, required: true }
  , creator_id        : { type: String, required: true }
  , location          : { type: String, required: true }
  , location_type     : { type: String, required: true }
  , private           : { type: Boolean, required: true }
  })

const voteSchema = new mongoose.Schema (
  { poll_id   : { type: String, required: true }
  , user_id   : { type: String, required: true }
  , answer    : { type: Number, required: true }
  , private   : { type: Boolean, required: true }
  })

module.exports = {
  Poll : mongoose.model('Poll', pollSchema)
, Vote : mongoose.model('Vote', voteSchema)
}
