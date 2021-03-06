var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  post: { type: Schema.ObjectId, ref: 'Post', required: true },
  user: { type: Schema.ObjectId, ref: 'User', required: true }
});

CommentSchema
.virtual('url')
.get(function () {
  return '/'+this._id;
});

module.exports = mongoose.model('Comment', CommentSchema);