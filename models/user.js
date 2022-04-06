var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  username: { type: String, required: true },
  password: { type: String, required: true },
  image: { type: String },
  friends: [{ type: Schema.ObjectId, ref: 'Friends' }],
  requests: [{ type: Schema.ObjectId, ref: 'Requests' }]
});

UserSchema.virtual('name').get(function() {
  return this.first_name + ' ' + this.last_name;
});

UserSchema.virtual('url').get(function() {
  return '/' + this._id;
});


module.exports = mongoose.model('User', UserSchema);