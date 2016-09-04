const mongoose = require('mongoose')

const pollSchema = new mongoose.Schema({
  title             : { type: String, required: true }
, questions         : { type: String, required: true }
, creator           : { type: String, required: true }
, location          : { type: String, required: true }
, location_type     : { type: String, required: true }
, private           : { type: Boolean, required: true }
})

exports.Poll = mongoose.model('Poll', pollSchema)
