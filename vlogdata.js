const mongoose = require('mongoose');

const vlogSchema = new mongoose.Schema({
  title: String,
  author: String,
  timestamp: { type: Date, default: Date.now },
  seenBy: [mongoose.Schema.Types.ObjectId] // Array of user IDs who have seen it
});

module.exports = mongoose.model('vlogdata', vlogSchema);
