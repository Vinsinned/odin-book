var async = require('async')
const User = require('../models/user');
const Post = require('../models/posts');
const Comment = require('../models/comments');
const { body, validationResult, check } = require('express-validator');

exports.post_list = function (req, res, next) {

	Post.find()
		.sort([['timestamp', 'ascending']])
		.exec(function (err, list_posts) {
			if (err) { return next(err); }
			// Successful, so render.
			console.log(list_posts)
			res.render('post_list', { title: 'Post List', post_list: list_posts });
		})

};

exports.post_create_get = function (req, res, next) {
	
	res.render('post_form', { title: 'Create Post'});

};

exports.post_create_post = [

	// Validate and sanitize fields.
	body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape()
	.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
	body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
	// Process request after validation and sanitization.
	(req, res, next) => {
		

		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a Book object with escaped and trimmed data.
		var post = new Post({
			title: req.body.title,
			content: req.body.content,
			timestamp: new Date().toISOString(),
			user: req.user.id
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.
			
			res.render('post_form', { title: 'Create Post', post: req.body, errors: errors.array() });
			return;
		}
		else {
			// Data from form is valid. Save book.
			post.save(function (err) {
				if (err) { return next(err); }
					// Successful - redirect to new book record.
					res.redirect('/posts' + post.url);
				});
		}
	}
];

// Display detail page for a specific Author.
exports.post_detail = function (req, res, next) {

	async.parallel({
		post: function (callback) {
			Post.findById(req.params.id)
			.exec(callback)
		},
		comments: function (callback) {
			Comment.find({ 'post': req.params.id })
			.exec(callback)
		},
  }, function (err, results) {
		if (err) { return next(err); } // Error in API usage.
		if (results.post == null) { // No results.
			var err = new Error('Author not found');
			err.status = 404;
			return next(err);
		}
		// Successful, so render.
		res.render('post_detail', { title: 'Post Detail', post: results.post, comments: results.comments, user: req.user });
	});

};

// Display BookInstance delete form on GET.
exports.post_delete_get = function(req, res, next) {

	Post.findById(req.params.id)
	.exec(function (err, post) {
			if (err) { return next(err); }
			if (post==null) { // No results.
					res.redirect('/posts');
			}
			// Successful, so render.
			res.render('post_delete', { title: 'Delete Post', post:  post});
	})

};

exports.post_delete_post = function(req, res, next) {
	
	// Assume valid BookInstance id in field.
	Post.findByIdAndRemove(req.body.id, function deletePost(err) {
		if (err) { return next(err); }
		// Success, so redirect to list of BookInstance items.
		res.redirect('/posts');
	});

};


exports.post_update_get = function(req, res, next) {

	Post.findById(req.params.id)
		.exec(function (err, result) {
			if (err) { return next(err); }
			if (result == null) { // No results.
				var err = new Error('Book copy not found');
				err.status = 404;
				return next(err);
			}
			// Success.
			res.render('post_form', { title: 'Update Post', post: result });
		});

};

exports.post_update_post = [

	body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape()
	.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
	body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
	
	(req, res, next) => {

		const errors = validationResult(req);

		var post = new Post({
			title: req.body.title,
			content: req.body.content,
			timestamp: new Date().toISOString(),
			user: req.user.id,
			_id: req.params.id
		});

		if (!errors.isEmpty()) {
			// There are errors so render the form again, passing sanitized values and errors.
			res.render('post_form', { title: 'Create Post', post: req.body, errors: errors.array() });
			return;
		}
		else {
			// Data from form is valid.
			Post.findByIdAndUpdate(req.params.id, post, {}, function (err,post) {
				if (err) { return next(err); }
				// Successful - redirect to detail page.
				res.redirect('/posts' + post.url);
			});
		}
	}
];

exports.post_like = function(req, res, next) {
	Post.findById(req.params.id)
		.exec(function (err, result) {
			if (err) { return next(err); }
			if (result.likes.includes(req.user.id)) {
				console.log('NO!');
				res.redirect('/posts/' + req.params.id)
			} else {
				Post.findByIdAndUpdate(req.params.id, { $push: { likes: req.user.id } }, function (err, post) {
					if (err) { return next(err); }
					// Successful - redirect to detail page.
					res.redirect('/posts/' + post.url);
				});
			}
		});
};

exports.post_unlike = function(req, res, next) {
	Post.findByIdAndUpdate(req.params.id, { $pull: { likes: req.user.id } }, function (err, post) {
		if (err) { return next(err); }
		// Successful - redirect to detail page.
		res.redirect('/posts/' + post.url);
	});
};