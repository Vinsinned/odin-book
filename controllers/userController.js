var async = require('async')
const User = require('../models/user');
const Posts = require('../models/posts');
const user = require('../models/user');

exports.user_list = function (req, res, next) {

	User.find()
		.sort([['first_name', 'ascending']])
		.exec(function (err, list_users) {
			if (err) { return next(err); }
			// Successful, so render.
			console.log(list_users)
			res.render('user_list', { title: 'User List', user_list: list_users });
		})

};

exports.user_detail = function (req, res, next) {
	
	async.parallel({
		user: function (callback) {
			User.findById(req.params.id)
				.exec(callback)
		},
		friends: function (callback) {
			User.find({ friends: req.params.id })
				.exec(callback)
		},
		userPosts: function (callback) {
			Posts.find({ user: req.params.id })
				.exec(callback)
		},
	}, function (err, results) {
		if (err) { return next(err); } // Error in API usage.
		if (results.user == null) { // No results.
			var err = new Error('User not found');
			err.status = 404;
			return next(err);
		}
		Posts.find({ 'user': results.user.friends })
			.exec(function (err, result) {
			if (err) { return next(err); }
			res.render('user_detail', { title: 'User Detail', user: results.user, posts: results.userPosts, friends: results.friends, friendPosts: result, localUser: req.user });
		})
	});

	/*
	User.findById(req.params.id)
	.exec(function (err, result) {
		const userInfo = result;
		if (err) { return next(err); } // Error in API usage.
		if (result == null) { // No results.
			var err = new Error('User not found');
			err.status = 404;
			return next(err);
		}
		//friends' post : BTW I GOT INTO CALLBACK HELL!!!!
		Posts.find({ 'user': { $in: userInfo.friends } })
		.exec(function (err, result) {
			const postsInfo = result;
			if (err) { return next(err); } // Error in API usage.
			User.find({ friends: req.params.id })
			.exec(function (err, result) { 
				const friendsInfo = result;
				if (err) { return next(err); } // Error in API usage.
				res.render('user_detail', { title: 'User Detail', user: userInfo, posts: postsInfo, friends: friendsInfo, localUser: req.user });
			})
		})
	})
	*/

};

exports.add_friend = function (req, res, next) {

	async.parallel({
		user: function (callback) {
			User.findById(req.params.id)
				.exec(callback)
		}
	}, function (err, results) {
		if (err) { return next(err); } // Error in API usage.
		if (results.user.friends.includes(req.params.localsId)) {
			console.log('already friends!')
			return res.redirect('/user/' + req.params.id);
		} else {
			if (results.user.requests.includes(req.params.localsId)) {
				console.log('request already sent!');
				return res.redirect('/user/' + req.params.id);
			} else {
				User.findByIdAndUpdate(req.params.id, { $push: { requests: req.params.localsId } }, function(err, result){
					if(err){
						return res.send(err)
					} else {
						result.save(function (err) {
							if (err) { return next(err); }
							// Successful - redirect to new user record.
							return res.redirect('/user/' + req.params.id);
						});
					}
        })
			}
		}
	});

};

exports.remove_request = function (req, res, next) {

	User.findById(req.params.id)
		.exec(function (err, result) {
			if (err) { return next(err); } // Error in API usage.
			if (result.friends.includes(req.params.localsId)) {
				console.log('already friends!')
				return res.redirect('/user/' + req.params.id);
			} else {
				if (result.requests.includes(req.params.localsId)) {
					User.findByIdAndUpdate(req.params.id, { $pull: { requests: req.params.localsId } }, function (err, result) {
						if (err) {
							res.send(err)
							return res.redirect('/user/' + req.params.id);
						} else {
							result.save(function (err) {
								if (err) { return next(err); }
								return res.redirect('/user/' + req.params.id);
							});
						}
					})
					User.findByIdAndUpdate(req.params.localsId, { $pull: { requests: req.params.id } }, function (err, result) {
						if (err) {
							res.send(err);
							return res.redirect('/user/' + req.params.id);
						} else {
							result.save(function (err) {
								if (err) { return next(err); }
								return res.redirect('/user/' + req.params.id);
							});
						}
					})
					res.redirect('/user/' + req.params.id);
				} else {
					console.log('no requests already sent!');
					return res.redirect('/user/' + req.params.id);
				}
			}
		});
	res.redirect('/user/' + req.params.id);
};

exports.accept_request = function (req, res, next) {

	User.findById(req.params.id)
		.exec(function (err, result) {
			if (err) { return next(err); } // Error in API usage.
			User.findByIdAndUpdate(req.params.id, { $pull: { requests: req.params.localsId } }, { friends: req.params.localsId }, function (err, result) {
				if (err) {
					res.send(err);
					return res.redirect('/user/' + req.params.id);
				} else {
					result.save(function (err) {
						if (err) { return next(err); }
						return res.redirect('/user/' + req.params.id);
					});
				}
			})
		});
	User.findById(req.params.localsId)
		.exec(function (err, result) {
			if (err) { return next(err); } // Error in API usage.
			User.findByIdAndUpdate(req.params.localsId, { $pull: { requests: req.params.id } }, { friends: req.params.id }, function (err, result) {
				if (err) {
					res.send(err);
					return res.redirect('/user/' + req.params.id);
				} else {
					result.save(function (err) {
						if (err) { return next(err); }
						return res.redirect('/user/' + req.params.id);
					});
				}
			})
		});
	res.redirect('/user/' + req.params.id);
};

exports.accept_friend = function (req, res, next) {

	async.parallel([
		function (callback) {
			User.findByIdAndUpdate(req.params.id, { $pull: { requests: req.params.localsId }, friends: req.params.localsId }, function (err, result) {
				if (err) {
					return res.redirect('/user/' + req.params.id);
				} else {
					result.save(function (err) {
						if (err) { return next(err); }
					});
				}
			})
		},
		function (callback) {
			User.findByIdAndUpdate(req.params.localsId, { $pull: { requests: req.params.id }, friends: req.params.id }, function (err, result) {
				if (err) {
					return res.redirect('/user/' + req.params.id);
				} else {
					result.save(function (err) {
						if (err) { return next(err); }
						return res.redirect('/user/' + req.params.id);
					});
				}
			})
		},
	], function (err, results) {
		if (err) {
			return res.send(err)
		}
		return res.redirect('/user/' + req.params.id);
		// results is equal to ['one','two'] even though
		// the second function had a shorter timeout.
	});
};

exports.remove_friend = function (req, res, next) {

	async.parallel([
		function (callback) {
			User.findByIdAndUpdate(req.params.id, { $pull: { friends: req.params.localsId } }, function (err, result) {
				if (err) {
					return res.redirect('/user/' + req.params.id);
				} else {
					result.save(function (err) {
						if (err) { return next(err); }
					});
				}
			})
		},
		function (callback) {
			User.findByIdAndUpdate(req.params.localsId, { $pull: { friends: req.params.id } }, function (err, result) {
				if (err) {
					return res.redirect('/user/' + req.params.id);
				} else {
					result.save(function (err) {
						if (err) { return next(err); }
						return res.redirect('/user/' + req.params.id);
					});
				}
			})
		},
	], function (err, results) {
		if (err) {
			return res.send(err)
		}
		return res.redirect('/user/' + req.params.id);
		// results is equal to ['one','two'] even though
		// the second function had a shorter timeout.
	});
};