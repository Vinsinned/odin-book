var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
	likes: { type: Number, required: true },
	user: { type: Schema.ObjectId, ref: 'User', required: true }
});

PostSchema
.virtual('url')
.get(function () {
  return '/'+this._id;
});


module.exports = mongoose.model('Post', PostSchema);